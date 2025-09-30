from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Set
from enum import Enum
import uuid

class TrainType(Enum):
    EXPRESS = "EXPRESS"
    LOCAL = "LOCAL"
    FREIGHT = "FREIGHT"
    MAINTENANCE = "MAINTENANCE"
    SPECIAL = "SPECIAL"

class TrainPriority(Enum):
    CRITICAL = 1    # Emergency/VIP trains
    HIGH = 2        # Express trains
    MEDIUM = 3      # Regular passenger trains
    LOW = 4         # Freight trains
    LOWEST = 5      # Maintenance blocks

class SectionType(Enum):
    SINGLE_LINE = "SINGLE_LINE"
    DOUBLE_LINE = "DOUBLE_LINE"
    JUNCTION = "JUNCTION"
    PLATFORM = "PLATFORM"

@dataclass
class TrackSection:
    """Represents a section of railway track"""
    section_id: str
    name: str
    section_type: SectionType
    length_km: float
    max_speed_kmh: int
    capacity: int = 1  # Number of trains that can occupy simultaneously
    signal_blocks: int = 1  # Number of signal blocks in this section
    
    def __str__(self):
        return f"{self.name} ({self.section_id})"

@dataclass
class Train:
    """Represents a train with its schedule and properties"""
    train_id: str
    train_number: str
    train_type: TrainType
    priority: TrainPriority
    route: List[str]  # List of section IDs the train will traverse
    scheduled_arrival: datetime
    scheduled_departure: datetime
    current_section: Optional[str] = None
    current_delay_minutes: int = 0
    max_speed_kmh: int = 100
    estimated_section_times: Dict[str, int] = field(default_factory=dict)  # section_id -> time in minutes
    
    def __post_init__(self):
        if not self.estimated_section_times:
            # Default estimation: 10 minutes per section
            self.estimated_section_times = {section_id: 10 for section_id in self.route}
    
    def get_actual_arrival(self) -> datetime:
        return self.scheduled_arrival + timedelta(minutes=self.current_delay_minutes)
    
    def get_actual_departure(self) -> datetime:
        return self.scheduled_departure + timedelta(minutes=self.current_delay_minutes)
    
    def __str__(self):
        return f"Train {self.train_number} ({self.train_type.value})"

@dataclass
class Conflict:
    """Represents a conflict between two trains for the same resource"""
    conflict_id: str
    train1: Train
    train2: Train
    section_id: str
    conflict_start_time: datetime
    conflict_end_time: datetime
    severity: int = 1  # 1 = low, 5 = critical
    resolution: Optional[str] = None
    
    def duration_minutes(self) -> int:
        return int((self.conflict_end_time - self.conflict_start_time).total_seconds() / 60)
    
    def __str__(self):
        return f"Conflict: {self.train1.train_number} vs {self.train2.train_number} at {self.section_id}"

@dataclass
class Schedule:
    """Represents the complete schedule for a section"""
    schedule_id: str
    section_id: str
    train_slots: List[Dict] = field(default_factory=list)  # List of {train_id, start_time, end_time}
    conflicts: List[Conflict] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    optimized: bool = False
    
    def add_train_slot(self, train: Train, start_time: datetime, end_time: datetime):
        """Add a train slot to the schedule"""
        slot = {
            'train_id': train.train_id,
            'train_number': train.train_number,
            'train_type': train.train_type.value,
            'priority': train.priority.value,
            'start_time': start_time,
            'end_time': end_time
        }
        self.train_slots.append(slot)
    
    def get_occupancy_at_time(self, check_time: datetime) -> List[str]:
        """Get list of train IDs occupying the section at a given time"""
        occupying_trains = []
        for slot in self.train_slots:
            if slot['start_time'] <= check_time <= slot['end_time']:
                occupying_trains.append(slot['train_id'])
        return occupying_trains
    
    def __str__(self):
        return f"Schedule for {self.section_id} with {len(self.train_slots)} slots"

@dataclass
class SectionController:
    """Represents a railway section with its tracks and current state"""
    controller_id: str
    name: str
    sections: List[TrackSection]
    active_trains: List[Train] = field(default_factory=list)
    schedule: Optional[Schedule] = None
    
    def add_train(self, train: Train):
        """Add a train to this section"""
        self.active_trains.append(train)
    
    def remove_train(self, train_id: str):
        """Remove a train from this section"""
        self.active_trains = [t for t in self.active_trains if t.train_id != train_id]
    
    def get_section_by_id(self, section_id: str) -> Optional[TrackSection]:
        """Get a track section by its ID"""
        return next((s for s in self.sections if s.section_id == section_id), None)
    
    def __str__(self):
        return f"Section Controller: {self.name} ({len(self.sections)} sections, {len(self.active_trains)} active trains)"

# Utility functions for creating sample data
def create_sample_section() -> SectionController:
    """Create a sample section for testing"""
    sections = [
        TrackSection("SEC_001", "Platform A", SectionType.PLATFORM, 0.5, 30, capacity=2),
        TrackSection("SEC_002", "Main Line North", SectionType.DOUBLE_LINE, 5.0, 120, capacity=2),
        TrackSection("SEC_003", "Junction X", SectionType.JUNCTION, 0.2, 40, capacity=1),
        TrackSection("SEC_004", "Main Line South", SectionType.SINGLE_LINE, 8.0, 100, capacity=1),
        TrackSection("SEC_005", "Platform B", SectionType.PLATFORM, 0.5, 30, capacity=2)
    ]
    
    controller = SectionController("CTRL_001", "Central Section", sections)
    return controller

def create_sample_trains() -> List[Train]:
    """Create sample trains for testing"""
    base_time = datetime.now().replace(minute=0, second=0, microsecond=0)
    
    trains = [
        Train(
            train_id="T001",
            train_number="12345",
            train_type=TrainType.EXPRESS,
            priority=TrainPriority.HIGH,
            route=["SEC_001", "SEC_002", "SEC_003", "SEC_004", "SEC_005"],
            scheduled_arrival=base_time + timedelta(hours=1),
            scheduled_departure=base_time + timedelta(hours=1, minutes=30),
            estimated_section_times={"SEC_001": 5, "SEC_002": 15, "SEC_003": 5, "SEC_004": 20, "SEC_005": 5}
        ),
        Train(
            train_id="T002",
            train_number="56789",
            train_type=TrainType.LOCAL,
            priority=TrainPriority.MEDIUM,
            route=["SEC_005", "SEC_004", "SEC_003", "SEC_002", "SEC_001"],
            scheduled_arrival=base_time + timedelta(hours=1, minutes=15),
            scheduled_departure=base_time + timedelta(hours=1, minutes=45),
            estimated_section_times={"SEC_005": 8, "SEC_004": 25, "SEC_003": 8, "SEC_002": 18, "SEC_001": 8}
        ),
        Train(
            train_id="T003",
            train_number="FR001",
            train_type=TrainType.FREIGHT,
            priority=TrainPriority.LOW,
            route=["SEC_001", "SEC_002", "SEC_004", "SEC_005"],
            scheduled_arrival=base_time + timedelta(hours=2),
            scheduled_departure=base_time + timedelta(hours=3),
            estimated_section_times={"SEC_001": 10, "SEC_002": 30, "SEC_004": 40, "SEC_005": 10}
        )
    ]
    
    return trains
