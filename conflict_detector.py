from datetime import datetime, timedelta
from typing import List, Tuple, Dict
import uuid

from models import Train, TrackSection, Conflict, Schedule, SectionType


class ConflictDetector:
    """Detects conflicts between trains in the railway network"""
    
    def __init__(self, safety_margin_minutes: int = 5):
        """
        Initialize conflict detector
        
        Args:
            safety_margin_minutes: Minimum time gap required between trains in the same section
        """
        self.safety_margin_minutes = safety_margin_minutes
    
    def detect_conflicts(self, trains: List[Train], sections: List[TrackSection]) -> List[Conflict]:
        """
        Detect all conflicts between trains
        
        Args:
            trains: List of trains to check for conflicts
            sections: List of track sections
            
        Returns:
            List of detected conflicts
        """
        conflicts = []
        section_dict = {section.section_id: section for section in sections}
        
        # Generate train schedules for each section
        section_schedules = self._generate_section_schedules(trains, section_dict)
        
        # Check for conflicts in each section
        for section_id, train_times in section_schedules.items():
            section = section_dict[section_id]
            section_conflicts = self._detect_section_conflicts(train_times, section)
            conflicts.extend(section_conflicts)
        
        return conflicts
    
    def _generate_section_schedules(self, trains: List[Train], 
                                  sections: Dict[str, TrackSection]) -> Dict[str, List[Tuple[Train, datetime, datetime]]]:
        """
        Generate schedules showing when each train occupies each section
        
        Returns:
            Dictionary mapping section_id to list of (train, start_time, end_time) tuples
        """
        section_schedules = {}
        
        for train in trains:
            current_time = train.get_actual_arrival()
            
            for section_id in train.route:
                if section_id not in section_schedules:
                    section_schedules[section_id] = []
                
                # Calculate time spent in this section
                section_time_minutes = train.estimated_section_times.get(section_id, 10)
                start_time = current_time
                end_time = current_time + timedelta(minutes=section_time_minutes)
                
                section_schedules[section_id].append((train, start_time, end_time))
                
                # Move to next section
                current_time = end_time
        
        # Sort schedules by start time
        for section_id in section_schedules:
            section_schedules[section_id].sort(key=lambda x: x[1])
        
        return section_schedules
    
    def _detect_section_conflicts(self, train_times: List[Tuple[Train, datetime, datetime]], 
                                section: TrackSection) -> List[Conflict]:
        """
        Detect conflicts within a specific section
        
        Args:
            train_times: List of (train, start_time, end_time) tuples for this section
            section: The track section to check
            
        Returns:
            List of conflicts in this section
        """
        conflicts = []
        
        # Group overlapping trains considering section capacity
        for i in range(len(train_times)):
            train1, start1, end1 = train_times[i]
            
            # Count how many trains overlap with this one
            overlapping_trains = []
            
            for j in range(len(train_times)):
                if i == j:
                    continue
                    
                train2, start2, end2 = train_times[j]
                
                # Check if trains overlap (with safety margin)
                safety_margin = timedelta(minutes=self.safety_margin_minutes)
                overlap_start = max(start1, start2)
                overlap_end = min(end1 + safety_margin, end2 + safety_margin)
                
                if overlap_start < overlap_end:
                    overlapping_trains.append((train2, start2, end2))
            
            # If overlapping trains exceed section capacity, create conflicts
            if len(overlapping_trains) >= section.capacity:
                for train2, start2, end2 in overlapping_trains:
                    conflict = self._create_conflict(train1, train2, section, start1, end1, start2, end2)
                    if conflict and not self._conflict_exists(conflicts, conflict):
                        conflicts.append(conflict)
        
        return conflicts
    
    def _create_conflict(self, train1: Train, train2: Train, section: TrackSection,
                        start1: datetime, end1: datetime, start2: datetime, end2: datetime) -> Conflict:
        """Create a conflict object between two trains"""
        
        # Calculate conflict time window
        conflict_start = max(start1, start2)
        conflict_end = min(end1, end2)
        
        # Only create conflict if there's actual overlap
        if conflict_start >= conflict_end:
            return None
        
        # Determine severity based on train priorities and conflict duration
        severity = self._calculate_conflict_severity(train1, train2, conflict_start, conflict_end, section)
        
        conflict_id = str(uuid.uuid4())
        
        return Conflict(
            conflict_id=conflict_id,
            train1=train1,
            train2=train2,
            section_id=section.section_id,
            conflict_start_time=conflict_start,
            conflict_end_time=conflict_end,
            severity=severity
        )
    
    def _calculate_conflict_severity(self, train1: Train, train2: Train, 
                                   conflict_start: datetime, conflict_end: datetime,
                                   section: TrackSection) -> int:
        """Calculate conflict severity (1-5) based on various factors"""
        
        base_severity = 2
        
        # Higher severity for higher priority trains
        min_priority = min(train1.priority.value, train2.priority.value)
        if min_priority == 1:  # Critical trains
            base_severity += 2
        elif min_priority == 2:  # High priority
            base_severity += 1
        
        # Higher severity for longer conflicts
        conflict_duration = (conflict_end - conflict_start).total_seconds() / 60
        if conflict_duration > 30:
            base_severity += 1
        if conflict_duration > 60:
            base_severity += 1
        
        # Higher severity for critical sections (junctions, single lines)
        if section.section_type in [SectionType.JUNCTION, SectionType.SINGLE_LINE]:
            base_severity += 1
        
        # Cap at maximum severity
        return min(base_severity, 5)
    
    def _conflict_exists(self, conflicts: List[Conflict], new_conflict: Conflict) -> bool:
        """Check if a similar conflict already exists in the list"""
        for conflict in conflicts:
            if ((conflict.train1.train_id == new_conflict.train1.train_id and
                 conflict.train2.train_id == new_conflict.train2.train_id) or
                (conflict.train1.train_id == new_conflict.train2.train_id and
                 conflict.train2.train_id == new_conflict.train1.train_id)) and \
               conflict.section_id == new_conflict.section_id:
                return True
        return False
    
    def get_conflict_summary(self, conflicts: List[Conflict]) -> Dict:
        """Generate a summary of detected conflicts"""
        if not conflicts:
            return {
                'total_conflicts': 0,
                'severity_breakdown': {},
                'sections_affected': [],
                'trains_affected': []
            }
        
        severity_breakdown = {}
        sections_affected = set()
        trains_affected = set()
        
        for conflict in conflicts:
            severity = conflict.severity
            severity_breakdown[severity] = severity_breakdown.get(severity, 0) + 1
            sections_affected.add(conflict.section_id)
            trains_affected.add(conflict.train1.train_number)
            trains_affected.add(conflict.train2.train_number)
        
        return {
            'total_conflicts': len(conflicts),
            'severity_breakdown': severity_breakdown,
            'sections_affected': list(sections_affected),
            'trains_affected': list(trains_affected),
            'critical_conflicts': len([c for c in conflicts if c.severity >= 4])
        }


class ConflictResolver:
    """Provides suggestions for resolving detected conflicts"""
    
    def __init__(self):
        self.resolution_strategies = {
            'delay_lower_priority': self._suggest_delay_resolution,
            'route_alternative': self._suggest_route_resolution,
            'speed_adjustment': self._suggest_speed_resolution
        }
    
    def suggest_resolutions(self, conflicts: List[Conflict]) -> Dict[str, List[str]]:
        """
        Suggest resolutions for conflicts
        
        Returns:
            Dictionary mapping conflict_id to list of resolution suggestions
        """
        resolutions = {}
        
        for conflict in conflicts:
            suggestions = []
            
            # Prioritize resolution strategies based on conflict severity
            if conflict.severity >= 4:
                suggestions.extend(self._suggest_delay_resolution(conflict))
                suggestions.extend(self._suggest_route_resolution(conflict))
            else:
                suggestions.extend(self._suggest_speed_resolution(conflict))
                suggestions.extend(self._suggest_delay_resolution(conflict))
            
            resolutions[conflict.conflict_id] = suggestions
        
        return resolutions
    
    def _suggest_delay_resolution(self, conflict: Conflict) -> List[str]:
        """Suggest delay-based resolutions"""
        suggestions = []
        
        # Delay the lower priority train
        lower_priority_train = (conflict.train2 if conflict.train1.priority.value < conflict.train2.priority.value 
                               else conflict.train1)
        higher_priority_train = (conflict.train1 if lower_priority_train == conflict.train2 
                                else conflict.train2)
        
        delay_minutes = conflict.duration_minutes() + 5  # Add safety margin
        
        suggestions.append(
            f"Delay train {lower_priority_train.train_number} by {delay_minutes} minutes "
            f"to give precedence to higher priority train {higher_priority_train.train_number}"
        )
        
        return suggestions
    
    def _suggest_route_resolution(self, conflict: Conflict) -> List[str]:
        """Suggest route-based resolutions"""
        suggestions = []
        
        suggestions.append(
            f"Consider alternative routing for one of the trains to avoid section {conflict.section_id}"
        )
        
        return suggestions
    
    def _suggest_speed_resolution(self, conflict: Conflict) -> List[str]:
        """Suggest speed adjustment resolutions"""
        suggestions = []
        
        suggestions.append(
            f"Adjust speed of trains to minimize overlap in section {conflict.section_id}"
        )
        
        return suggestions
