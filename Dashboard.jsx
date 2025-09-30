import React from 'react'
import { useRailway } from '../context/RailwayContext'
import { Link } from 'react-router-dom'
import { Train, AlertTriangle, Clock, TrendingUp, Zap, MapPin, BarChart2, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { format, addMinutes } from 'date-fns'

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.4 }
  }
};

const KeyMetrics = ({ metrics }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <motion.div variants={itemVariants} className="metric-card">
      <div className="flex items-center justify-between">
        <div>
          <div className="metric-value">{metrics.totalTrains}</div>
          <div className="metric-label">Active Trains</div>
        </div>
        <Train className="h-8 w-8 text-blue-500" />
      </div>
    </motion.div>

    <motion.div variants={itemVariants} className="metric-card">
      <div className="flex items-center justify-between">
        <div>
          <div className="metric-value text-red-600">{metrics.totalConflicts}</div>
          <div className="metric-label">Total Conflicts</div>
        </div>
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
    </motion.div>

    <motion.div variants={itemVariants} className="metric-card">
      <div className="flex items-center justify-between">
        <div>
          <div className="metric-value text-yellow-600">{metrics.averageDelay.toFixed(1)}</div>
          <div className="metric-label">Avg Delay (min)</div>
        </div>
        <Clock className="h-8 w-8 text-yellow-500" />
      </div>
    </motion.div>

    <motion.div variants={itemVariants} className="metric-card">
      <div className="flex items-center justify-between">
        <div>
          <div className="metric-value text-green-600">{metrics.punctuality.toFixed(0)}%</div>
          <div className="metric-label">On-Time Performance</div>
        </div>
        <TrendingUp className="h-8 w-8 text-green-500" />
      </div>
    </motion.div>
  </div>
);

const TrainOverview = ({ trains, conflicts, liveTime, sectionSchedules, sections }) => {
  const getTrainStatus = (train) => {
    const now = liveTime;
    const actualArrival = addMinutes(new Date(train.scheduledArrival), train.currentDelay);
    const actualDeparture = addMinutes(new Date(train.scheduledDeparture), train.currentDelay);

    if (now < actualArrival) {
        return { statusText: 'Upcoming', progress: 0, location: 'Not Started' };
    }
    if (now > actualDeparture) {
        return { statusText: 'Finished', progress: 100, location: 'Destination Reached' };
    }

    const journeyDuration = actualDeparture.getTime() - actualArrival.getTime();
    const elapsedTime = now.getTime() - actualArrival.getTime();
    const progress = journeyDuration > 0 ? Math.min(100, (elapsedTime / journeyDuration) * 100) : 0;

    let location = 'In Transit';
    if (sectionSchedules) {
        for (const sectionId of train.route) {
            const sectionSchedule = sectionSchedules[sectionId];
            if (sectionSchedule) {
                const trainSlot = sectionSchedule.find(slot => slot.trainId === train.id);
                if (trainSlot && now >= new Date(trainSlot.startTime) && now < new Date(trainSlot.endTime)) {
                    const sectionDetails = sections.find(s => s.id === sectionId);
                    location = sectionDetails ? sectionDetails.name : sectionId;
                    break;
                }
            }
        }
    }
    
    return { statusText: 'In Transit', progress: Math.round(progress), location };
  };

  const isTrainInConflict = (trainId) => {
    return conflicts.some(c => 
        (c.train1.id === trainId || c.train2.id === trainId) &&
        liveTime >= new Date(c.startTime) && liveTime <= new Date(c.endTime)
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Train className="h-5 w-5 mr-2 text-gray-600" />
          Train Overview
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Train</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delay</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {trains.map((train) => {
                const { statusText, progress, location } = getTrainStatus(train);
                const isInConflict = isTrainInConflict(train.id);
                const actualArrival = addMinutes(new Date(train.scheduledArrival), train.currentDelay);
                const actualDeparture = addMinutes(new Date(train.scheduledDeparture), train.currentDelay);
                
                return (
                  <tr key={train.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                            <div className="font-medium text-gray-900">{train.number}</div>
                            {isInConflict && <AlertTriangle className="h-4 w-4 text-red-500 ml-2 animate-pulse" title="In Conflict" />}
                        </div>
                        <div className="text-sm text-gray-500">{train.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            statusText === 'Finished' ? 'bg-gray-100 text-gray-800' :
                            statusText === 'In Transit' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                            {statusText}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                            <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
                                <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                            <span className="text-sm text-gray-600">{progress}%</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                        {format(actualArrival, 'HH:mm')}→{format(actualDeparture, 'HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        {train.currentDelay > 0 ? (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                                +{train.currentDelay} min
                            </span>
                        ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                                On time
                            </span>
                        )}
                    </td>
                </tr>
                )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CurrentConflicts = ({ conflicts }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
    <div className="p-6 border-b border-gray-200 flex justify-between items-center">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
        Current Conflicts
      </h3>
      {conflicts.length > 0 && (
        <Link to="/conflicts" className="text-sm font-medium text-primary-600 hover:text-primary-700">
          View All
        </Link>
      )}
    </div>
    <div className="p-6">
      {conflicts.length > 0 ? (
        <div className="space-y-3">
          {conflicts.slice(0, 2).map((conflict) => (
            <div key={conflict.id} className={`p-3 rounded-lg border-l-4 severity-${conflict.severity} bg-yellow-50`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-gray-900">{conflict.train1.number} vs {conflict.train2.number}</div>
                  <div className="text-sm text-gray-600">{conflict.sectionId} • {conflict.duration.toFixed(0)} min overlap</div>
                </div>
                <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-medium rounded">
                  Severity {conflict.severity}
                </span>
              </div>
            </div>
          ))}
          {conflicts.length > 2 && (
            <div className="text-center text-gray-500 text-sm pt-2">... and {conflicts.length - 2} more</div>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <CheckCircle className="mx-auto h-10 w-10 text-green-500" />
          <p className="text-gray-900 font-medium mt-2">No conflicts detected</p>
        </div>
      )}
    </div>
  </div>
);

const SectionStatus = ({ sections, sectionSchedules, liveTime }) => {
  const getSectionOccupancy = (section) => {
    const schedule = sectionSchedules[section.id] || [];
    const trainsInSection = schedule.filter(slot => 
        liveTime >= new Date(slot.startTime) && liveTime < new Date(slot.endTime)
    );
    return trainsInSection.length;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-gray-600" />
          Section Status
        </h3>
      </div>
      <div className="p-6 space-y-4">
        {sections.map((section) => {
          const occupancy = getSectionOccupancy(section);
          const utilization = Math.min(100, (occupancy / section.capacity) * 100);
          const utilColor = utilization >= 100 ? 'bg-red-500' : utilization >= 75 ? 'bg-orange-500' : utilization >= 50 ? 'bg-yellow-500' : 'bg-green-500';

          return (
            <div key={section.id}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-800">{section.name}</span>
                <span className="text-xs font-semibold text-gray-600">{occupancy} / {section.capacity}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className={`${utilColor} h-2.5 rounded-full transition-all duration-300`} style={{ width: `${utilization}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PerformanceMetrics = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart2 className="h-5 w-5 mr-2 text-gray-600" />
            Performance Metrics
          </h3>
        </div>
        <div className="p-6 text-center text-gray-500">
          <p>Run "Optimize Schedule" to see performance metrics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <BarChart2 className="h-5 w-5 mr-2 text-gray-600" />
          Last Optimization
        </h3>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Effectiveness</span>
          <span className="text-lg font-bold text-green-600">{metrics.optimizationEffectiveness}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Conflicts Resolved</span>
          <span className="text-lg font-bold text-gray-800">{metrics.conflictsResolved}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Delay Added</span>
          <span className="text-lg font-bold text-yellow-600">{metrics.additionalDelayIntroduced} min</span>
        </div>
      </div>
    </div>
  );
};

const QuickActions = () => {
  const actions = [
    { name: 'Manage Trains', href: '/trains', icon: Train, color: 'text-blue-600' },
    { name: 'View Sections', href: '/sections', icon: MapPin, color: 'text-green-600' },
    { name: 'Resolve Conflicts', href: '/conflicts', icon: AlertTriangle, color: 'text-red-600' },
    { name: 'What-If Analysis', href: '/what-if', icon: TrendingUp, color: 'text-orange-600' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Zap className="h-5 w-5 mr-2 text-gray-600" />
          Quick Actions
        </h3>
      </div>
      <div className="p-6 grid grid-cols-2 gap-4">
        {actions.map(action => {
          const Icon = action.icon;
          return (
            <Link
              key={action.name}
              to={action.href}
              className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <Icon className={`h-8 w-8 mb-2 ${action.color}`} />
              <span className="text-sm font-medium text-gray-700 text-center">{action.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { trains, conflicts, sections, optimizeSchedule, liveTime, sectionSchedules, optimizationMetrics } = useRailway()

  const metrics = {
    totalTrains: trains.length,
    totalConflicts: conflicts.length,
    averageDelay: trains.reduce((sum, train) => sum + train.currentDelay, 0) / trains.length || 0,
    punctuality: trains.filter(train => train.currentDelay <= 5).length / trains.length * 100 || 0
  }

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.1 } }
      }}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Control Dashboard</h1>
          <p className="mt-2 text-gray-600">Real-time overview of railway operations</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={optimizeSchedule}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center"
          >
            <Zap className="h-5 w-5 mr-2" />
            Optimize Schedule
          </button>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <KeyMetrics metrics={metrics} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-3">
          <TrainOverview trains={trains} conflicts={conflicts} liveTime={liveTime} sectionSchedules={sectionSchedules} sections={sections} />
        </motion.div>

        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={itemVariants}>
            <CurrentConflicts conflicts={conflicts} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <SectionStatus sections={sections} sectionSchedules={sectionSchedules} liveTime={liveTime} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <PerformanceMetrics metrics={optimizationMetrics} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <QuickActions />
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

export default Dashboard
