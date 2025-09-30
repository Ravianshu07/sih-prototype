from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
import copy

from models import Train, TrackSection, Schedule, TrainPriority, SectionType
from conflict_detector import ConflictDetector


class TrainScheduleOptimizer:
    """Optimizes train schedules to minimize conflicts and delays"""
    
    def __init__(self, safety_margin_minutes: int = 5):
        """
        Initialize the optimizer
        
        Args:
            safety_margin_minutes: Minimum time gap between trains in same section
        """
        self.safety_margin_minutes = safety_margin_minutes
        self.conflict_detector = ConflictDetector(safety_margin_minutes)
    
    def optimize_schedule(self, trains: List[Train], sections: List[TrackSection]) -> Dict:
        """
        Optimize train schedules using a greedy algorithm
        
        Args:
            trains: List of trains to schedule
            sections: List of track sections
            
        Returns:
            Dictionary containing optimized schedule and metrics
        """
        # Create working copy of trains
        working_trains = copy.deepcopy(trains)
        
        # Sort trains by priority and arrival time
        working_trains.sort(key=lambda t: (t.priority.value, t.get_actual_arrival()))
        
        # Apply optimization strategies
        optimized_trains = self._apply_greedy_optimization(working_trains, sections)
        
        # Generate optimized schedule
        schedule = self._generate_optimized_schedule(optimized_trains, sections)
        
        # Calculate performance metrics
        metrics = self._calculate_metrics(trains, optimized_trains, sections)
        
        return {
            'optimized_trains': optimized_trains,
            'schedule': schedule,
            'metrics': metrics,
            'conflicts_remaining': self.conflict_detector.detect_conflicts(optimized_trains, sections)
        }
    
    def _apply_greedy_optimization(self, trains: List[Train], sections: List[TrackSection]) -> List[Train]:
        """
        Apply greedy optimization strategies to minimize conflicts
        
        Args:
            trains: Pre-sorted list of trains (by priority, then arrival time)
            sections: List of track sections
            
        Returns:
            List of trains with optimized timings
        """
        optimized_trains = []
        section_dict = {s.section_id: s for s in sections}
        
        for i, train in enumerate(trains):
            # For the first train, no optimization needed
            if i == 0:
                optimized_trains.append(train)
                continue
            
            # Find optimal timing for this train considering already scheduled trains
            optimized_train = self._optimize_single_train(train, optimized_trains, section_dict)
            optimized_trains.append(optimized_train)
        
        return optimized_trains
    
    def _optimize_single_train(self, train: Train, scheduled_trains: List[Train], 
                              sections: Dict[str, TrackSection]) -> Train:
        """
        Optimize timing for a single train considering already scheduled trains
        
        Args:
            train: Train to optimize
            scheduled_trains: Trains already scheduled
            sections: Dictionary of sections
            
        Returns:
            Optimized train with adjusted timing
        """
        optimized_train = copy.deepcopy(train)
        
        # Check each section in the train's route for conflicts
        current_arrival = train.get_actual_arrival()
        total_delay_added = 0
        
        for section_id in train.route:
            section = sections[section_id]
            
            # Calculate when this train would occupy this section
            section_start_time = current_arrival + timedelta(minutes=total_delay_added)
            section_duration = train.estimated_section_times.get(section_id, 10)
            section_end_time = section_start_time + timedelta(minutes=section_duration)
            
            # Check for conflicts with already scheduled trains
            required_delay = self._calculate_required_delay(
                train, section_id, section_start_time, section_end_time,
                scheduled_trains, section
            )
            
            if required_delay > 0:
                total_delay_added += required_delay
                current_arrival = train.get_actual_arrival() + timedelta(minutes=total_delay_added)
        
        # Apply the calculated delay
        if total_delay_added > 0:
            optimized_train.current_delay_minutes = train.current_delay_minutes + total_delay_added
        
        return optimized_train
    
    def _calculate_required_delay(self, train: Train, section_id: str, 
                                 planned_start: datetime, planned_end: datetime,
                                 scheduled_trains: List[Train], section: TrackSection) -> int:
        """
        Calculate minimum delay required to avoid conflicts in a specific section
        
        Returns:
            Required delay in minutes
        """
        max_delay_needed = 0
        safety_margin = timedelta(minutes=self.safety_margin_minutes)
        
        for scheduled_train in scheduled_trains:
            if section_id not in scheduled_train.route:
                continue
            
            # Calculate when the scheduled train occupies this section
            scheduled_arrival = scheduled_train.get_actual_arrival()
            time_to_section = 0
            
            # Calculate time to reach this section
            for route_section in scheduled_train.route:
                if route_section == section_id:
                    break
                time_to_section += scheduled_train.estimated_section_times.get(route_section, 10)
            
            scheduled_section_start = scheduled_arrival + timedelta(minutes=time_to_section)
            scheduled_section_duration = scheduled_train.estimated_section_times.get(section_id, 10)
            scheduled_section_end = scheduled_section_start + timedelta(minutes=scheduled_section_duration)
            
            # Check for overlap considering section capacity
            if self._sections_overlap(planned_start, planned_end, 
                                    scheduled_section_start, scheduled_section_end, 
                                    safety_margin, section):
                
                # Calculate delay needed to avoid this conflict
                if train.priority.value > scheduled_train.priority.value:
                    # This train has lower priority, delay it
                    delay_needed = (scheduled_section_end + safety_margin - planned_start).total_seconds() / 60
                    max_delay_needed = max(max_delay_needed, delay_needed)
                # If this train has higher priority, the scheduled train would need adjustment
                # but since it's already scheduled, we might still need minor adjustment
        
        return max(0, int(max_delay_needed))
    
    def _sections_overlap(self, start1: datetime, end1: datetime, 
                         start2: datetime, end2: datetime,
                         safety_margin: timedelta, section: TrackSection) -> bool:
        """
        Check if two time periods overlap considering section capacity and safety margins
        """
        # For single capacity sections, any overlap with safety margin is a conflict
        if section.capacity == 1:
            return not (end1 + safety_margin <= start2 or end2 + safety_margin <= start1)
        
        # For higher capacity sections, use simpler overlap check
        return not (end1 <= start2 or end2 <= start1)
    
    def _generate_optimized_schedule(self, trains: List[Train], sections: List[TrackSection]) -> Dict[str, Schedule]:
        """
        Generate schedule objects for each section based on optimized trains
        
        Returns:
            Dictionary mapping section_id to Schedule object
        """
        schedules = {}
        section_dict = {s.section_id: s for s in sections}
        
        # Initialize schedules for all sections
        for section in sections:
            schedules[section.section_id] = Schedule(
                schedule_id=f"SCH_{section.section_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                section_id=section.section_id,
                optimized=True
            )
        
        # Add train slots to appropriate schedules
        for train in trains:
            current_time = train.get_actual_arrival()
            
            for section_id in train.route:
                section_duration = train.estimated_section_times.get(section_id, 10)
                start_time = current_time
                end_time = current_time + timedelta(minutes=section_duration)
                
                schedules[section_id].add_train_slot(train, start_time, end_time)
                current_time = end_time
        
        return schedules
    
    def _calculate_metrics(self, original_trains: List[Train], optimized_trains: List[Train], 
                          sections: List[TrackSection]) -> Dict:
        """
        Calculate optimization performance metrics
        
        Returns:
            Dictionary containing various performance metrics
        """
        # Calculate delay metrics
        total_original_delay = sum(t.current_delay_minutes for t in original_trains)
        total_optimized_delay = sum(t.current_delay_minutes for t in optimized_trains)
        additional_delay = total_optimized_delay - total_original_delay
        
        # Calculate conflict metrics
        original_conflicts = self.conflict_detector.detect_conflicts(original_trains, sections)
        optimized_conflicts = self.conflict_detector.detect_conflicts(optimized_trains, sections)
        
        # Calculate throughput (trains per hour)
        if original_trains:
            time_span = max(t.get_actual_departure() for t in original_trains) - \
                       min(t.get_actual_arrival() for t in original_trains)
            throughput = len(original_trains) / (time_span.total_seconds() / 3600)
        else:
            throughput = 0
        
        # Calculate punctuality (percentage of on-time trains)
        on_time_trains = len([t for t in optimized_trains if t.current_delay_minutes <= 5])
        punctuality = (on_time_trains / len(optimized_trains) * 100) if optimized_trains else 0
        
        return {
            'total_trains': len(original_trains),
            'original_conflicts': len(original_conflicts),
            'optimized_conflicts': len(optimized_conflicts),
            'conflicts_reduced': len(original_conflicts) - len(optimized_conflicts),
            'original_total_delay': total_original_delay,
            'optimized_total_delay': total_optimized_delay,
            'additional_delay_introduced': additional_delay,
            'average_delay_per_train': total_optimized_delay / len(optimized_trains) if optimized_trains else 0,
            'throughput_trains_per_hour': round(throughput, 2),
            'punctuality_percentage': round(punctuality, 1),
            'optimization_effectiveness': round(
                (len(original_conflicts) - len(optimized_conflicts)) / max(len(original_conflicts), 1) * 100, 1
            )
        }


class WhatIfAnalyzer:
    """Provides what-if analysis for different scheduling scenarios"""
    
    def __init__(self, optimizer: TrainScheduleOptimizer):
        """
        Initialize what-if analyzer
        
        Args:
            optimizer: TrainScheduleOptimizer instance
        """
        self.optimizer = optimizer
    
    def analyze_delay_scenario(self, trains: List[Train], sections: List[TrackSection],
                              train_id: str, additional_delay_minutes: int) -> Dict:
        """
        Analyze impact of additional delay on a specific train
        
        Args:
            trains: Original list of trains
            sections: List of track sections
            train_id: ID of train to apply delay to
            additional_delay_minutes: Additional delay to apply
            
        Returns:
            Analysis results comparing scenarios
        """
        # Create scenario with delayed train
        scenario_trains = copy.deepcopy(trains)
        for train in scenario_trains:
            if train.train_id == train_id:
                train.current_delay_minutes += additional_delay_minutes
                break
        
        # Optimize both scenarios
        original_result = self.optimizer.optimize_schedule(trains, sections)
        scenario_result = self.optimizer.optimize_schedule(scenario_trains, sections)
        
        return {
            'scenario_description': f"Train {train_id} delayed by {additional_delay_minutes} minutes",
            'original_metrics': original_result['metrics'],
            'scenario_metrics': scenario_result['metrics'],
            'impact': {
                'additional_conflicts': scenario_result['metrics']['optimized_conflicts'] - 
                                       original_result['metrics']['optimized_conflicts'],
                'additional_system_delay': scenario_result['metrics']['optimized_total_delay'] - 
                                          original_result['metrics']['optimized_total_delay'],
                'punctuality_impact': scenario_result['metrics']['punctuality_percentage'] - 
                                     original_result['metrics']['punctuality_percentage']
            }
        }
    
    def analyze_priority_change(self, trains: List[Train], sections: List[TrackSection],
                               train_id: str, new_priority: TrainPriority) -> Dict:
        """
        Analyze impact of changing a train's priority
        
        Args:
            trains: Original list of trains
            sections: List of track sections
            train_id: ID of train to change priority for
            new_priority: New priority level
            
        Returns:
            Analysis results comparing scenarios
        """
        # Create scenario with changed priority
        scenario_trains = copy.deepcopy(trains)
        original_priority = None
        
        for train in scenario_trains:
            if train.train_id == train_id:
                original_priority = train.priority
                train.priority = new_priority
                break
        
        # Optimize both scenarios
        original_result = self.optimizer.optimize_schedule(trains, sections)
        scenario_result = self.optimizer.optimize_schedule(scenario_trains, sections)
        
        return {
            'scenario_description': f"Train {train_id} priority changed from {original_priority.name} to {new_priority.name}",
            'original_metrics': original_result['metrics'],
            'scenario_metrics': scenario_result['metrics'],
            'impact': {
                'conflicts_change': scenario_result['metrics']['optimized_conflicts'] - 
                                   original_result['metrics']['optimized_conflicts'],
                'delay_change': scenario_result['metrics']['optimized_total_delay'] - 
                               original_result['metrics']['optimized_total_delay'],
                'punctuality_change': scenario_result['metrics']['punctuality_percentage'] - 
                                     original_result['metrics']['punctuality_percentage']
            }
        }
