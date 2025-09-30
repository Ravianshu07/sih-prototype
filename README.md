# Railway Traffic Control System MVP

An intelligent decision-support system for railway traffic controllers that assists in making optimized, real-time decisions for train precedence and crossings.

## Features

### Core Functionality
- **Conflict Detection**: Automatically identifies potential train conflicts in track sections
- **Schedule Optimization**: Uses greedy algorithms to minimize delays and maximize throughput
- **Real-time Decision Support**: Provides recommendations for train precedence and crossings
- **What-If Analysis**: Simulate scenarios to understand impact of different scheduling decisions

### User Interface
- **Dashboard**: System overview with key metrics and performance indicators
- **Train Management**: Add, view, and manage trains with their schedules and routes
- **Section Monitoring**: Track section utilization and occupancy status
- **Conflict Management**: Detailed conflict analysis with resolution suggestions
- **Scenario Analysis**: Interactive what-if analysis with visual comparisons

### Key Metrics & KPIs
- **Punctuality**: On-time performance percentage
- **Throughput**: Trains per hour capacity utilization
- **Delay Analysis**: Average delays and optimization effectiveness
- **Conflict Statistics**: Severity breakdown and affected sections

## Quick Start

### Prerequisites
- Python 3.8 or higher
- pip package manager

### Installation

1. **Clone or download the project**
   ```bash
   cd railway_traffic_control
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python app.py
   ```

4. **Access the web interface**
   Open your browser and navigate to: `http://localhost:5000`

## System Architecture

### Core Components

1. **Data Models** (`src/models.py`)
   - Train: Represents trains with schedules, priorities, and routes
   - TrackSection: Railway infrastructure with capacity and constraints
   - Schedule: Time-based allocation of trains to sections
   - Conflict: Detected scheduling conflicts between trains

2. **Conflict Detection** (`src/conflict_detector.py`)
   - Identifies overlapping train schedules in track sections
   - Calculates conflict severity based on priorities and duration
   - Provides resolution suggestions

3. **Optimization Engine** (`src/optimizer.py`)
   - Greedy algorithm for train scheduling optimization
   - Priority-based precedence decisions
   - What-if scenario analysis capabilities

4. **Web Interface** (`app.py` + `templates/`)
   - Flask-based web application
   - Interactive dashboard and management interfaces
   - Real-time visualization of system status

## Usage Guide

### Dashboard
- View system overview with key metrics
- Monitor active trains and current conflicts
- Quick access to optimization and management functions

### Train Management
- Add new trains with schedules and routes
- View detailed train information and status
- Available sections: SEC_001 to SEC_005 (Platform A, Main Line North, Junction X, Main Line South, Platform B)

### Conflict Resolution
- Automatic conflict detection and severity assessment
- Resolution suggestions (delay, reroute, speed adjustment)
- Manual conflict resolution tools

### What-If Analysis
- **Delay Analysis**: Test impact of train delays on system performance
- **Priority Changes**: Analyze effects of changing train priorities
- Visual comparison charts and detailed impact metrics

## Sample Data

The system comes with pre-loaded sample data:

### Track Sections
- **SEC_001**: Platform A (0.5km, 2 capacity)
- **SEC_002**: Main Line North (5km, 2 capacity) 
- **SEC_003**: Junction X (0.2km, 1 capacity)
- **SEC_004**: Main Line South (8km, 1 capacity)
- **SEC_005**: Platform B (0.5km, 2 capacity)

### Sample Trains
- **12345**: Express train (High priority)
- **56789**: Local train (Medium priority)  
- **FR001**: Freight train (Low priority)

## System Capabilities

### Optimization Features
- **Priority-based scheduling**: Higher priority trains get precedence
- **Conflict minimization**: Reduces overlapping schedules
- **Delay optimization**: Balances delays across the network
- **Capacity utilization**: Maximizes track section usage

### Performance Metrics
- **Punctuality**: Percentage of on-time trains (≤5 min delay)
- **Throughput**: Network capacity utilization (trains/hour)
- **Optimization Effectiveness**: Percentage of conflicts resolved
- **Average Delays**: System-wide delay performance

### Safety Features
- **Safety Margins**: 5-minute minimum gap between trains
- **Capacity Constraints**: Respects track section limits
- **Signal Block Consideration**: Accounts for signaling infrastructure
- **Single-line Restrictions**: Enhanced safety for single-track sections

## Technical Details

### Algorithms
- **Greedy Optimization**: Priority-first scheduling with conflict avoidance
- **Conflict Detection**: Time-window overlap analysis with safety margins
- **Severity Calculation**: Multi-factor conflict importance scoring

### Data Structures
- **Dataclasses**: Type-safe data models with validation
- **Enums**: Structured categorization (train types, priorities, section types)
- **Time-based Scheduling**: DateTime-aware conflict detection

### Web Technologies
- **Flask**: Python web framework
- **Bootstrap 5**: Responsive UI framework
- **Chart.js**: Interactive data visualization
- **HTML5/CSS3**: Modern web standards

## Extending the System

### Adding New Features
- **Database Integration**: Replace in-memory storage with PostgreSQL/MySQL
- **Real-time Updates**: WebSocket integration for live updates
- **Advanced Algorithms**: Machine learning for predictive scheduling
- **External Integrations**: Connect to existing railway management systems

### Customization
- **Business Rules**: Modify priority schemes and conflict resolution strategies  
- **UI Themes**: Customize appearance and branding
- **Reporting**: Add custom KPIs and analytics
- **API Development**: RESTful APIs for external system integration

## Limitations & Future Enhancements

### Current Limitations
- **In-memory Storage**: Data resets on application restart
- **Simplified Network**: Linear track layout (real networks are more complex)
- **Basic Algorithms**: Greedy optimization (not globally optimal)
- **Manual Input**: No integration with external train tracking systems

### Future Enhancements
- **Dynamic Optimization**: Real-time re-optimization as conditions change
- **Predictive Analytics**: Machine learning for delay prediction
- **Multi-objective Optimization**: Balance competing objectives (delay vs. fuel vs. passenger satisfaction)
- **Advanced Visualization**: 3D network views and animation
- **Mobile App**: Controllers mobile interface
- **Integration APIs**: Connect with existing railway systems (TMS, SCADA, etc.)

## License

This is an MVP demonstration system for educational and evaluation purposes.

## Support


For questions or support, please refer to the code documentation and comments within the source files.

