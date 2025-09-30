import React, { useState } from 'react'
import { useRailway } from '../context/RailwayContext'
import { AlertTriangle, Clock, Zap, CheckCircle, Train } from 'lucide-react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import ConflictTimeline from '../components/ConflictTimeline'

const Conflicts = () => {
  const { conflicts, optimizeSchedule, trains } = useRailway()
  const [selectedConflict, setSelectedConflict] = useState(null)

  const conflictSummary = {
    totalConflicts: conflicts.length,
    criticalConflicts: conflicts.filter(c => c.severity >= 4).length,
    sectionsAffected: [...new Set(conflicts.map(c => c.sectionId))],
    trainsAffected: [...new Set(conflicts.flatMap(c => [c.train1.id, c.train2.id]))]
  }

  const severityBreakdown = conflicts.reduce((acc, conflict) => {
    acc[conflict.severity] = (acc[conflict.severity] || 0) + 1
    return acc
  }, {})

  const getSeverityColor = (severity) => {
    if (severity >= 4) return 'text-red-600 bg-red-50 border-red-200'
    if (severity >= 3) return 'text-orange-600 bg-orange-50 border-orange-200'
    return 'text-blue-600 bg-blue-50 border-blue-200'
  }

  const getSeverityBadgeColor = (severity) => {
    if (severity >= 4) return 'bg-red-500'
    if (severity >= 3) return 'bg-orange-500'
    return 'bg-blue-500'
  }

  const getResolutionSuggestions = (conflict) => {
    const suggestions = []
    const { train1, train2 } = conflict
    
    if (train1.priority < train2.priority) {
      suggestions.push(`Delay ${train1.number} by 15 minutes to avoid conflict`)
      suggestions.push(`Reroute ${train1.number} through alternative sections`)
    } else if (train2.priority < train1.priority) {
      suggestions.push(`Delay ${train2.number} by 15 minutes to avoid conflict`)
      suggestions.push(`Reroute ${train2.number} through alternative sections`)
    } else {
      suggestions.push(`Delay lower priority train by 10 minutes`)
      suggestions.push(`Adjust speeds to minimize overlap duration`)
    }
    
    return suggestions
  }

  const handleOptimize = () => {
    optimizeSchedule()
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3 }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <AlertTriangle className="h-8 w-8 mr-3 text-red-600" />
            Conflict Management
          </h1>
          <p className="mt-2 text-gray-600">Identify, analyze, and resolve train scheduling conflicts</p>
        </div>
        {conflicts.length > 0 && (
          <div className="mt-4 sm:mt-0">
            <button
              onClick={handleOptimize}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center"
            >
              <Zap className="h-5 w-5 mr-2" />
              Auto-Resolve
            </button>
          </div>
        )}
      </div>

      {/* Conflict Summary */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div variants={itemVariants} className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="metric-value text-red-600">{conflictSummary.totalConflicts}</div>
              <div className="metric-label">Total Conflicts</div>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="metric-value text-orange-600">{conflictSummary.criticalConflicts}</div>
              <div className="metric-label">Critical Conflicts</div>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-500" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="metric-value text-blue-600">{conflictSummary.sectionsAffected.length}</div>
              <div className="metric-label">Sections Affected</div>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="metric-value text-purple-600">{conflictSummary.trainsAffected.length}</div>
              <div className="metric-label">Trains Involved</div>
            </div>
            <Train className="h-8 w-8 text-purple-500" />
          </div>
        </motion.div>
      </motion.div>

      {conflicts.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conflict List */}
          <div className="lg:col-span-2">
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-lg shadow-sm border border-gray-200"
            >
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Conflict Details</h3>
              </div>
              <div className="divide-y divide-gray-200 max-h-[40rem] overflow-y-auto">
                {conflicts.map((conflict) => (
                  <div
                    key={conflict.id}
                    className={`p-6 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
                      selectedConflict?.id === conflict.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => setSelectedConflict(conflict)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-900">
                            {conflict.train1.number} vs {conflict.train2.number}
                          </h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getSeverityBadgeColor(conflict.severity)} text-white`}>
                            Severity {conflict.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Section: {conflict.sectionId} • Duration: {conflict.duration.toFixed(0)} minutes
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(conflict.startTime, 'PPp')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Conflict Details Panel */}
          <div>
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6"
            >
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedConflict ? 'Conflict Analysis' : 'Select a Conflict'}
                </h3>
              </div>
              <div className="p-6">
                {selectedConflict ? (
                  <div className="space-y-6">
                    {/* Visual Timeline */}
                    <ConflictTimeline conflict={selectedConflict} />
                    
                    <hr/>

                    {/* Conflict Information */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Conflict Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Section:</span>
                          <span className="font-medium">{selectedConflict.sectionId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Start Time:</span>
                          <span>{format(selectedConflict.startTime, 'HH:mm')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">End Time:</span>
                          <span>{format(selectedConflict.endTime, 'HH:mm')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Duration:</span>
                          <span>{selectedConflict.duration.toFixed(0)} minutes</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Severity:</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getSeverityBadgeColor(selectedConflict.severity)} text-white`}>
                            {selectedConflict.severity}/5
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Train Information */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Involved Trains</h4>
                      <div className="space-y-3">
                        {[selectedConflict.train1, selectedConflict.train2].map((train, index) => (
                          <div key={train.id} className="p-3 border border-gray-200 rounded-lg">
                            <div className="font-medium text-gray-900">{train.number}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              Type: {train.type} • Priority: {train.priority}
                            </div>
                            <div className="text-sm text-gray-600">
                              Delay: {train.currentDelay} minutes
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Resolution Suggestions */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Resolution Suggestions</h4>
                      <div className="space-y-2">
                        {getResolutionSuggestions(selectedConflict).map((suggestion, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <div className="flex-shrink-0 w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center mt-0.5">
                              <span className="text-xs font-medium text-yellow-800">{index + 1}</span>
                            </div>
                            <p className="text-sm text-gray-700">{suggestion}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Select a conflict from the list to view detailed analysis</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      ) : (
        /* No Conflicts State */
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-lg shadow-sm border border-gray-200"
        >
          <div className="p-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Conflicts Detected!</h3>
            <p className="text-gray-600 mb-6">The current train schedule is optimized and conflict-free.</p>
            <div className="flex justify-center space-x-4">
              <a
                href="/trains"
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Manage Trains
              </a>
              <a
                href="/what-if"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Run What-If Analysis
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default Conflicts
