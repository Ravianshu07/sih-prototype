import React, { useState } from 'react'
import { useRailway } from '../context/RailwayContext'
import { TrendingUp, Clock, Flag, Play, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const WhatIf = () => {
  const { trains, analyzeScenario, scenarioAnalysis } = useRailway()
  const [delayForm, setDelayForm] = useState({
    trainId: '',
    delayMinutes: 15
  })
  const [priorityForm, setPriorityForm] = useState({
    trainId: '',
    newPriority: 2
  })

  const priorities = [
    { value: 1, name: 'Low' },
    { value: 2, name: 'Medium' },
    { value: 3, name: 'High' },
    { value: 4, name: 'Critical' },
    { value: 5, name: 'Emergency' }
  ]

  const handleDelayAnalysis = (e) => {
    e.preventDefault()
    
    // Simulate delay analysis
    const selectedTrain = trains.find(t => t.id === delayForm.trainId)
    if (!selectedTrain) return

    const mockAnalysis = {
      type: 'delay',
      trainAffected: selectedTrain.number,
      delayAdded: delayForm.delayMinutes,
      scenarioDescription: `Adding ${delayForm.delayMinutes} minutes delay to train ${selectedTrain.number}`,
      originalMetrics: {
        totalConflicts: 2,
        totalDelay: 45,
        punctuality: 85,
        throughput: 12
      },
      scenarioMetrics: {
        totalConflicts: 1,
        totalDelay: 60,
        punctuality: 78,
        throughput: 11
      },
      impact: {
        conflictsChange: -1,
        delayChange: 15,
        punctualityChange: -7,
        throughputChange: -1
      }
    }

    analyzeScenario(mockAnalysis)
  }

  const handlePriorityAnalysis = (e) => {
    e.preventDefault()
    
    const selectedTrain = trains.find(t => t.id === priorityForm.trainId)
    if (!selectedTrain) return

    const mockAnalysis = {
      type: 'priority',
      trainAffected: selectedTrain.number,
      priorityChange: `${selectedTrain.priority} → ${priorityForm.newPriority}`,
      scenarioDescription: `Changing train ${selectedTrain.number} priority from ${selectedTrain.priority} to ${priorityForm.newPriority}`,
      originalMetrics: {
        totalConflicts: 2,
        totalDelay: 45,
        punctuality: 85,
        throughput: 12
      },
      scenarioMetrics: {
        totalConflicts: 3,
        totalDelay: 38,
        punctuality: 89,
        throughputChange: 12
      },
      impact: {
        conflictsChange: 1,
        delayChange: -7,
        punctualityChange: 4,
        throughputChange: 0
      }
    }

    analyzeScenario(mockAnalysis)
  }

  const clearResults = () => {
    analyzeScenario(null)
  }

  const chartData = scenarioAnalysis ? [
    {
      name: 'Conflicts',
      Original: scenarioAnalysis.originalMetrics.totalConflicts,
      Modified: scenarioAnalysis.scenarioMetrics.totalConflicts,
    },
    {
      name: 'Total Delay',
      Original: scenarioAnalysis.originalMetrics.totalDelay,
      Modified: scenarioAnalysis.scenarioMetrics.totalDelay,
    },
    {
      name: 'Punctuality',
      Original: scenarioAnalysis.originalMetrics.punctuality,
      Modified: scenarioAnalysis.scenarioMetrics.punctuality,
    },
    {
      name: 'Throughput',
      Original: scenarioAnalysis.originalMetrics.throughput,
      Modified: scenarioAnalysis.scenarioMetrics.throughput,
    },
  ] : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <TrendingUp className="h-8 w-8 mr-3 text-primary-600" />
          What-If Analysis
        </h1>
        <p className="mt-2 text-gray-600">Test different scenarios to understand their impact on the railway system</p>
      </div>

      {/* Analysis Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delay Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-600" />
              Delay Impact Analysis
            </h3>
          </div>
          <div className="p-6">
            <form onSubmit={handleDelayAnalysis} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Train
                </label>
                <select
                  value={delayForm.trainId}
                  onChange={(e) => setDelayForm(prev => ({ ...prev, trainId: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Choose a train...</option>
                  {trains.map(train => (
                    <option key={train.id} value={train.id}>
                      {train.number} ({train.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Delay (minutes)
                </label>
                <input
                  type="range"
                  min="5"
                  max="120"
                  value={delayForm.delayMinutes}
                  onChange={(e) => setDelayForm(prev => ({ ...prev, delayMinutes: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>5 min</span>
                  <span className="font-medium">{delayForm.delayMinutes} minutes</span>
                  <span>120 min</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
              >
                <Play className="h-4 w-4 mr-2" />
                Analyze Delay Impact
              </button>
            </form>
          </div>
        </motion.div>

        {/* Priority Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Flag className="h-5 w-5 mr-2 text-orange-600" />
              Priority Change Analysis
            </h3>
          </div>
          <div className="p-6">
            <form onSubmit={handlePriorityAnalysis} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Train
                </label>
                <select
                  value={priorityForm.trainId}
                  onChange={(e) => setPriorityForm(prev => ({ ...prev, trainId: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Choose a train...</option>
                  {trains.map(train => (
                    <option key={train.id} value={train.id}>
                      {train.number} (Current: {train.priority})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Priority
                </label>
                <select
                  value={priorityForm.newPriority}
                  onChange={(e) => setPriorityForm(prev => ({ ...prev, newPriority: parseInt(e.target.value) }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.name} ({priority.value})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
              >
                <Play className="h-4 w-4 mr-2" />
                Analyze Priority Change
              </button>
            </form>
          </div>
        </motion.div>
      </div>

      {/* Results Section */}
      {scenarioAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-primary-600" />
              Analysis Results
            </h3>
            <button
              onClick={clearResults}
              className="text-gray-500 hover:text-gray-700 px-3 py-1 rounded"
            >
              Clear
            </button>
          </div>
          <div className="p-6">
            {/* Scenario Description */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-blue-900 mb-1">Scenario</h4>
              <p className="text-blue-800">{scenarioAnalysis.scenarioDescription}</p>
            </div>

            {/* Impact Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-600 mb-1">Conflicts Change</div>
                <div className={`text-2xl font-bold ${scenarioAnalysis.impact.conflictsChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {scenarioAnalysis.impact.conflictsChange >= 0 ? '+' : ''}{scenarioAnalysis.impact.conflictsChange}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-600 mb-1">Delay Change</div>
                <div className={`text-2xl font-bold ${scenarioAnalysis.impact.delayChange >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {scenarioAnalysis.impact.delayChange >= 0 ? '+' : ''}{scenarioAnalysis.impact.delayChange} min
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-600 mb-1">Punctuality Change</div>
                <div className={`text-2xl font-bold ${scenarioAnalysis.impact.punctualityChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {scenarioAnalysis.impact.punctualityChange >= 0 ? '+' : ''}{scenarioAnalysis.impact.punctualityChange}%
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-600 mb-1">Throughput Change</div>
                <div className={`text-2xl font-bold ${scenarioAnalysis.impact.throughputChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {scenarioAnalysis.impact.throughputChange >= 0 ? '+' : ''}{scenarioAnalysis.impact.throughputChange}
                </div>
              </div>
            </div>

            {/* Comparison Chart */}
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-4">Metrics Comparison</h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Original" fill="#3b82f6" />
                    <Bar dataKey="Modified" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Comparison Table */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Original Scenario</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Conflicts:</span>
                    <span className="font-medium">{scenarioAnalysis.originalMetrics.totalConflicts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Delay:</span>
                    <span className="font-medium">{scenarioAnalysis.originalMetrics.totalDelay} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Punctuality:</span>
                    <span className="font-medium">{scenarioAnalysis.originalMetrics.punctuality}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Throughput:</span>
                    <span className="font-medium">{scenarioAnalysis.originalMetrics.throughput} trains/hr</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Modified Scenario</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Conflicts:</span>
                    <span className="font-medium">{scenarioAnalysis.scenarioMetrics.totalConflicts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Delay:</span>
                    <span className="font-medium">{scenarioAnalysis.scenarioMetrics.totalDelay} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Punctuality:</span>
                    <span className="font-medium">{scenarioAnalysis.scenarioMetrics.punctuality}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Throughput:</span>
                    <span className="font-medium">{scenarioAnalysis.scenarioMetrics.throughput} trains/hr</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default WhatIf
