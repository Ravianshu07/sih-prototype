#!/usr/bin/env python3
"""
Test script for Railway Traffic Control System
Verifies core functionality and demonstrates system capabilities.
"""

import sys
import os
from datetime import datetime, timedelta

# Add src directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from models import (create_sample_section, create_sample_trains, TrainType, 
                   TrainPriority, Train, TrackSection, SectionType)
from conflict_detector import ConflictDetector, ConflictResolver
from optimizer import TrainScheduleOptimizer, WhatIfAnalyzer


def test_data_models():
    """Test basic data model functionality"""
    print("🧪 Testing Data Models...")
    
    # Test sample data creation
    controller = create_sample_section()
    trains = create_sample_trains()
    
    print(f"  ✓ Created section controller: {controller}")
    print(f"  ✓ Created {len(trains)} sample trains")
    print(f"  ✓ Sections: {[s.name for s in controller.sections]}")
    
    # Test train details
    for train in trains:
        print(f"  ✓ Train {train.train_number}: {train.train_type.value}, "
              f"Priority: {train.priority.name}, Route: {' → '.join(train.route)}")
    
    return controller, trains


def test_conflict_detection():
    """Test conflict detection algorithm"""
    print("\n🔍 Testing Conflict Detection...")
    
    controller, trains = test_data_models()
    detector = ConflictDetector()
    
    # Detect conflicts
    conflicts = detector.detect_conflicts(trains, controller.sections)
    print(f"  ✓ Detected {len(conflicts)} conflicts")
    
    if conflicts:
        for conflict in conflicts[:3]:  # Show first 3 conflicts
            print(f"  ⚠️  Conflict: {conflict.train1.train_number} vs "
                  f"{conflict.train2.train_number} in {conflict.section_id}")
            print(f"      Duration: {conflict.duration_minutes()} minutes, "
                  f"Severity: {conflict.severity}/5")
    
    # Get conflict summary
    summary = detector.get_conflict_summary(conflicts)
    print(f"  📊 Conflict Summary: {summary['total_conflicts']} total, "
          f"{summary['critical_conflicts']} critical")
    
    return conflicts


def test_optimization():
    """Test schedule optimization"""
    print("\n⚙️ Testing Schedule Optimization...")
    
    controller, trains = test_data_models()
    optimizer = TrainScheduleOptimizer()
    
    # Run optimization
    result = optimizer.optimize_schedule(trains, controller.sections)
    metrics = result['metrics']
    
    print(f"  ✓ Optimization completed")
    print(f"  📈 Metrics:")
    print(f"      - Original conflicts: {metrics['original_conflicts']}")
    print(f"      - Optimized conflicts: {metrics['optimized_conflicts']}")
    print(f"      - Conflicts reduced: {metrics['conflicts_reduced']}")
    print(f"      - Punctuality: {metrics['punctuality_percentage']}%")
    print(f"      - Average delay per train: {metrics['average_delay_per_train']:.1f} min")
    print(f"      - Optimization effectiveness: {metrics['optimization_effectiveness']}%")
    
    return result


def test_what_if_analysis():
    """Test what-if analysis functionality"""
    print("\n🎯 Testing What-If Analysis...")
    
    controller, trains = test_data_models()
    optimizer = TrainScheduleOptimizer()
    analyzer = WhatIfAnalyzer(optimizer)
    
    if trains:
        # Test delay scenario
        train_id = trains[0].train_id
        print(f"  🔄 Testing delay scenario for train {trains[0].train_number}")
        
        delay_analysis = analyzer.analyze_delay_scenario(
            trains, controller.sections, train_id, 30
        )
        
        print(f"  📊 Delay Impact:")
        print(f"      - Additional conflicts: {delay_analysis['impact']['additional_conflicts']}")
        print(f"      - Additional system delay: {delay_analysis['impact']['additional_system_delay']} min")
        print(f"      - Punctuality impact: {delay_analysis['impact']['punctuality_impact']:.1f}%")
        
        # Test priority change scenario
        print(f"  🔄 Testing priority change scenario for train {trains[0].train_number}")
        
        priority_analysis = analyzer.analyze_priority_change(
            trains, controller.sections, train_id, TrainPriority.LOW
        )
        
        print(f"  📊 Priority Change Impact:")
        print(f"      - Conflicts change: {priority_analysis['impact']['conflicts_change']}")
        print(f"      - Delay change: {priority_analysis['impact']['delay_change']} min")
        print(f"      - Punctuality change: {priority_analysis['impact']['punctuality_change']:.1f}%")


def test_conflict_resolution():
    """Test conflict resolution suggestions"""
    print("\n🛠️ Testing Conflict Resolution...")
    
    controller, trains = test_data_models()
    detector = ConflictDetector()
    resolver = ConflictResolver()
    
    conflicts = detector.detect_conflicts(trains, controller.sections)
    
    if conflicts:
        resolutions = resolver.suggest_resolutions(conflicts[:2])  # First 2 conflicts
        
        for conflict_id, suggestions in resolutions.items():
            print(f"  💡 Suggestions for conflict {conflict_id}:")
            for i, suggestion in enumerate(suggestions, 1):
                print(f"      {i}. {suggestion}")
    else:
        print("  ✅ No conflicts to resolve!")


def test_edge_cases():
    """Test edge cases and validation"""
    print("\n🧪 Testing Edge Cases...")
    
    # Test with no trains
    controller = create_sample_section()
    optimizer = TrainScheduleOptimizer()
    detector = ConflictDetector()
    
    result = optimizer.optimize_schedule([], controller.sections)
    print(f"  ✓ Empty train list handled: {result['metrics']['total_trains']} trains")
    
    conflicts = detector.detect_conflicts([], controller.sections)
    print(f"  ✓ No conflicts detected with empty list: {len(conflicts)} conflicts")
    
    # Test single train
    base_time = datetime.now().replace(minute=0, second=0, microsecond=0)
    single_train = [Train(
        train_id="TEST001",
        train_number="TEST",
        train_type=TrainType.LOCAL,
        priority=TrainPriority.MEDIUM,
        route=["SEC_001", "SEC_002"],
        scheduled_arrival=base_time + timedelta(hours=1),
        scheduled_departure=base_time + timedelta(hours=2)
    )]
    
    result = optimizer.optimize_schedule(single_train, controller.sections)
    print(f"  ✓ Single train optimization: {result['metrics']['total_trains']} trains")
    
    conflicts = detector.detect_conflicts(single_train, controller.sections)
    print(f"  ✓ Single train conflicts: {len(conflicts)} conflicts")


def demonstrate_system():
    """Demonstrate complete system functionality"""
    print("\n🚀 System Demonstration Complete!")
    print("="*60)
    
    controller, trains = test_data_models()
    
    print(f"\n📋 System Status:")
    print(f"   - Railway Network: {len(controller.sections)} sections, "
          f"{sum(s.length_km for s in controller.sections):.1f}km total")
    print(f"   - Active Trains: {len(trains)}")
    print(f"   - Train Types: {', '.join(set(t.train_type.value for t in trains))}")
    print(f"   - Priority Levels: {', '.join(set(t.priority.name for t in trains))}")
    
    # Run full optimization
    optimizer = TrainScheduleOptimizer()
    result = optimizer.optimize_schedule(trains, controller.sections)
    
    print(f"\n📈 Optimization Results:")
    print(f"   - Conflicts Resolved: {result['metrics']['conflicts_reduced']}")
    print(f"   - System Punctuality: {result['metrics']['punctuality_percentage']}%")
    print(f"   - Network Throughput: {result['metrics']['throughput_trains_per_hour']} trains/hour")
    print(f"   - Optimization Effectiveness: {result['metrics']['optimization_effectiveness']}%")
    
    print(f"\n✅ System is ready for deployment!")
    print(f"   Run 'python app.py' to start the web interface")
    print(f"   Then visit http://localhost:5000 in your browser")


def main():
    """Main test runner"""
    print("Railway Traffic Control System - Test Suite")
    print("="*60)
    
    try:
        # Run all tests
        test_data_models()
        test_conflict_detection()
        test_optimization()
        test_what_if_analysis()
        test_conflict_resolution()
        test_edge_cases()
        demonstrate_system()
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
