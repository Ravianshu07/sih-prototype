from flask import Flask, render_template, request, jsonify, redirect, url_for
from datetime import datetime, timedelta
import json
import sys
import os

# Add src directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from models import (TrainType, TrainPriority, SectionType, 
                   create_sample_section, create_sample_trains, Train)
from conflict_detector import ConflictDetector, ConflictResolver
from optimizer import TrainScheduleOptimizer, WhatIfAnalyzer

app = Flask(__name__)
app.secret_key = 'railway_traffic_control_secret_key'

# Global variables to store current state
current_controller = create_sample_section()
current_trains = create_sample_trains()
optimizer = TrainScheduleOptimizer()
conflict_detector = ConflictDetector()
conflict_resolver = ConflictResolver()
what_if_analyzer = WhatIfAnalyzer(optimizer)

@app.route('/')
def index():
    """Main dashboard showing system overview"""
    # Get current conflicts
    conflicts = conflict_detector.detect_conflicts(current_trains, current_controller.sections)
    conflict_summary = conflict_detector.get_conflict_summary(conflicts)
    
    # Get optimization results
    optimization_result = optimizer.optimize_schedule(current_trains, current_controller.sections)
    
    return render_template('dashboard.html', 
                         controller=current_controller,
                         trains=current_trains,
                         conflicts=conflicts[:5],  # Show only first 5 conflicts
                         conflict_summary=conflict_summary,
                         metrics=optimization_result['metrics'])

@app.route('/trains')
def trains():
    """View and manage trains"""
    return render_template('trains.html', 
                         trains=current_trains,
                         train_types=list(TrainType),
                         priorities=list(TrainPriority))

@app.route('/add_train', methods=['POST'])
def add_train():
    """Add a new train to the system"""
    try:
        # Parse form data
        train_number = request.form['train_number']
        train_type = TrainType(request.form['train_type'])
        priority = TrainPriority(int(request.form['priority']))
        
        # Parse arrival and departure times
        arrival_time = datetime.strptime(request.form['arrival_time'], '%Y-%m-%dT%H:%M')
        departure_time = datetime.strptime(request.form['departure_time'], '%Y-%m-%dT%H:%M')
        
        # Parse route (comma-separated section IDs)
        route_str = request.form['route']
        route = [section_id.strip() for section_id in route_str.split(',')]
        
        # Create new train
        new_train = Train(
            train_id=f"T{len(current_trains) + 1:03d}",
            train_number=train_number,
            train_type=train_type,
            priority=priority,
            route=route,
            scheduled_arrival=arrival_time,
            scheduled_departure=departure_time,
            current_delay_minutes=int(request.form.get('delay', 0))
        )
        
        current_trains.append(new_train)
        
        return redirect(url_for('trains'))
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/sections')
def sections():
    """View track sections and their current occupancy"""
    # Calculate current occupancy for each section
    optimization_result = optimizer.optimize_schedule(current_trains, current_controller.sections)
    schedules = optimization_result['schedule']
    
    section_info = []
    for section in current_controller.sections:
        schedule = schedules.get(section.section_id)
        current_occupancy = []
        if schedule:
            now = datetime.now()
            current_occupancy = schedule.get_occupancy_at_time(now)
        
        section_info.append({
            'section': section,
            'schedule': schedule,
            'current_occupancy': current_occupancy,
            'utilization': len(current_occupancy) / section.capacity * 100 if section.capacity > 0 else 0
        })
    
    return render_template('sections.html', section_info=section_info)

@app.route('/conflicts')
def conflicts():
    """View and analyze conflicts"""
    conflicts = conflict_detector.detect_conflicts(current_trains, current_controller.sections)
    conflict_summary = conflict_detector.get_conflict_summary(conflicts)
    resolutions = conflict_resolver.suggest_resolutions(conflicts)
    
    return render_template('conflicts.html', 
                         conflicts=conflicts,
                         conflict_summary=conflict_summary,
                         resolutions=resolutions)

@app.route('/optimize', methods=['POST'])
def optimize():
    """Run optimization and return results"""
    global current_trains
    try:
        optimization_result = optimizer.optimize_schedule(current_trains, current_controller.sections)
        
        # Update global trains with optimized versions
        current_trains = optimization_result['optimized_trains']
        
        return jsonify({
            'success': True,
            'metrics': optimization_result['metrics'],
            'conflicts_remaining': len(optimization_result['conflicts_remaining'])
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/what_if')
def what_if():
    """What-if analysis interface"""
    return render_template('what_if.html', 
                         trains=current_trains,
                         priorities=list(TrainPriority))

@app.route('/analyze_delay', methods=['POST'])
def analyze_delay():
    """Analyze impact of delaying a specific train"""
    try:
        train_id = request.form['train_id']
        delay_minutes = int(request.form['delay_minutes'])
        
        analysis = what_if_analyzer.analyze_delay_scenario(
            current_trains, current_controller.sections, train_id, delay_minutes
        )
        
        return jsonify(analysis)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyze_priority', methods=['POST'])
def analyze_priority():
    """Analyze impact of changing a train's priority"""
    try:
        train_id = request.form['train_id']
        new_priority = TrainPriority(int(request.form['new_priority']))
        
        analysis = what_if_analyzer.analyze_priority_change(
            current_trains, current_controller.sections, train_id, new_priority
        )
        
        return jsonify(analysis)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/schedule_data')
def schedule_data():
    """Get schedule data for visualization"""
    try:
        optimization_result = optimizer.optimize_schedule(current_trains, current_controller.sections)
        schedules = optimization_result['schedule']
        
        # Convert schedules to JSON-serializable format
        schedule_data = {}
        for section_id, schedule in schedules.items():
            schedule_data[section_id] = {
                'section_name': next(s.name for s in current_controller.sections if s.section_id == section_id),
                'slots': []
            }
            
            for slot in schedule.train_slots:
                schedule_data[section_id]['slots'].append({
                    'train_number': slot['train_number'],
                    'train_type': slot['train_type'],
                    'priority': slot['priority'],
                    'start_time': slot['start_time'].strftime('%Y-%m-%d %H:%M:%S'),
                    'end_time': slot['end_time'].strftime('%Y-%m-%d %H:%M:%S')
                })
        
        return jsonify(schedule_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/reset_data', methods=['POST'])
def reset_data():
    """Reset system to sample data"""
    global current_controller, current_trains
    current_controller = create_sample_section()
    current_trains = create_sample_trains()
    
    return jsonify({'success': True, 'message': 'System reset to sample data'})

# Template filters
@app.template_filter('datetime_format')
def datetime_format(value):
    """Format datetime for display"""
    if isinstance(value, datetime):
        return value.strftime('%Y-%m-%d %H:%M')
    return str(value)

@app.template_filter('duration_format')
def duration_format(minutes):
    """Format duration in minutes to human readable format"""
    if minutes < 60:
        return f"{minutes} min"
    else:
        hours = minutes // 60
        mins = minutes % 60
        return f"{hours}h {mins}m"

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
