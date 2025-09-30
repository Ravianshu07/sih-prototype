import React, { useEffect, useRef, useState } from 'react'
import { useRailway } from '../context/RailwayContext'
import { Train, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'

const TrainVisual = ({ train, position, conflict, onClick, isSelected }) => {
  const getPriorityColor = (priority) => {
    if (priority >= 4) return 'bg-red-500'
    if (priority >= 3) return 'bg-yellow-500'
    if (priority >= 2) return 'bg-blue-500'
    return 'bg-gray-500'
  }

  return (
    <motion.div
      key={train.id}
      className="absolute top-1/2 -translate-y-1/2 h-12 flex items-center group z-10 cursor-pointer"
      initial={{ x: position }}
      animate={{ x: position }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      onClick={onClick}
    >
      <div className={`relative w-10 h-10 rounded-full flex items-center justify-center shadow-lg transform -translate-x-1/2 transition-all duration-300 ${conflict ? 'animate-glow' : getPriorityColor(train.priority)} ${isSelected ? 'ring-4 ring-primary-500 ring-offset-2' : ''}`}>
        <Train className="h-5 w-5 text-white" />
        <span className="absolute -bottom-5 text-xs font-semibold text-gray-700 bg-white bg-opacity-75 px-1 rounded">
          {train.number}
        </span>
      </div>
      {/* Tooltip */}
      <div className="absolute bottom-full mb-6 w-48 bg-gray-800 text-white text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -translate-x-1/2 left-1/2 z-20 pointer-events-none">
        <p className="font-bold">{train.number}</p>
        <p>Type: {train.type}</p>
        <p>Priority: {train.priority}</p>
        {conflict && (
          <div className="mt-1 pt-1 border-t border-gray-600">
            <p className="text-red-400 font-bold">IN CONFLICT</p>
            <p>With: {conflict.train1.id === train.id ? conflict.train2.number : conflict.train1.number}</p>
            <p>In: {conflict.sectionId}</p>
          </div>
        )}
        <div className="absolute w-2 h-2 bg-gray-800 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
      </div>
    </motion.div>
  )
}

const LiveView = () => {
  const { sections, trains, conflicts, liveTime } = useRailway()
  
  const trackRef = useRef(null)
  const [trackWidth, setTrackWidth] = useState(0)
  const [selectedTrain, setSelectedTrain] = useState(null)

  useEffect(() => {
    const updateTrackWidth = () => {
      if (trackRef.current) {
        setTrackWidth(trackRef.current.offsetWidth)
      }
    }
    updateTrackWidth();
    window.addEventListener('resize', updateTrackWidth)
    return () => window.removeEventListener('resize', updateTrackWidth)
  }, [])

  const handleTrainClick = (train) => {
    if (selectedTrain && selectedTrain.id === train.id) {
      setSelectedTrain(null) // Deselect if clicking the same train
    } else {
      setSelectedTrain(train)
    }
  }

  const getTrainPosition = (train, trackWidth) => {
    const scheduledArrival = new Date(train.scheduledArrival);
    const scheduledDeparture = new Date(train.scheduledDeparture);

    if (isNaN(scheduledArrival.getTime()) || isNaN(scheduledDeparture.getTime())) {
      return -100;
    }

    const actualArrival = new Date(scheduledArrival.getTime() + train.currentDelay * 60000);
    const actualDeparture = new Date(scheduledDeparture.getTime() + train.currentDelay * 60000);
    
    const journeyDuration = actualDeparture.getTime() - actualArrival.getTime();
    
    if (liveTime < actualArrival || liveTime > actualDeparture || journeyDuration <= 0) return -100;

    const elapsedTime = liveTime.getTime() - actualArrival.getTime();
    const progress = Math.min(1, Math.max(0, elapsedTime / journeyDuration));

    return progress * trackWidth;
  };

  const getTrainConflict = (trainId) => {
    return conflicts.find(c => 
      (c.train1.id === trainId || c.train2.id === trainId) && 
      liveTime >= c.startTime && liveTime <= c.endTime
    ) || null;
  }

  const getTimelinePosition = () => {
    const startOfDay = new Date(liveTime);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(liveTime);
    endOfDay.setHours(23, 59, 59, 999);
    const totalDayMillis = endOfDay.getTime() - startOfDay.getTime();
    const elapsedMillis = liveTime.getTime() - startOfDay.getTime();
    return (elapsedMillis / totalDayMillis) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Live Network View</h1>
        <p className="mt-2 text-gray-600">A real-time visual representation of the railway network. Click a train to see its route.</p>
      </div>

      {/* Controls and Timeline */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <div className="flex items-center justify-center">
          <div className="flex items-center font-mono text-xl font-semibold text-gray-800 bg-gray-100 px-6 py-3 rounded-lg">
            <Clock className="h-6 w-6 mr-3 text-primary-600" />
            {format(liveTime, 'HH:mm:ss')}
          </div>
        </div>
        {/* 24h Timeline */}
        <div>
          <div className="relative h-2 bg-gray-200 rounded-full">
            <div className="absolute h-2 bg-primary-500 rounded-full" style={{ width: `${getTimelinePosition()}%` }}></div>
            <div className="absolute h-4 w-4 bg-white border-2 border-primary-600 rounded-full -top-1" style={{ left: `calc(${getTimelinePosition()}% - 8px)` }}></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>24:00</span>
          </div>
        </div>
      </div>

      {/* Track Visualization */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="relative py-8" ref={trackRef}>
          {/* Track background */}
          <div className="absolute inset-y-1/2 h-8 -translate-y-1/2 w-full bg-gray-300 rounded-lg" 
               style={{
                 backgroundImage: 'repeating-linear-gradient(90deg, #a0aec0, #a0aec0 2px, transparent 2px, transparent 10px)'
               }}>
            <div className="absolute top-1 h-0.5 w-full bg-gray-500"></div>
            <div className="absolute bottom-1 h-0.5 w-full bg-gray-500"></div>
          </div>

          {/* Track Sections */}
          <div className="relative flex h-24">
            {sections.map(section => {
              const isHighlighted = selectedTrain?.route.includes(section.id);
              return (
                <div 
                  key={section.id} 
                  className={`flex-grow border-r-2 border-dashed last:border-r-0 flex items-center justify-center transition-all duration-300 ${isHighlighted ? 'bg-primary-100 border-primary-300' : 'border-gray-400'}`}
                  style={{ flexBasis: `${section.length * 10}%`}}
                >
                  <div className={`bg-white bg-opacity-75 px-2 py-1 rounded-md text-xs font-semibold text-center transition-colors duration-300 ${isHighlighted ? 'text-primary-700' : 'text-gray-700'}`}>
                    {section.name}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Trains */}
          <div className="absolute top-0 left-0 w-full h-full">
            {trackWidth > 0 && trains.map(train => {
              const position = getTrainPosition(train, trackWidth)
              if (position < 0) return null
              const conflict = getTrainConflict(train.id)
              return (
                <TrainVisual 
                  key={train.id} 
                  train={train} 
                  position={position} 
                  conflict={conflict}
                  onClick={() => handleTrainClick(train)}
                  isSelected={selectedTrain?.id === train.id}
                />
              )
            })}
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-700">
            <span className="font-bold">Priority Legend:</span>
            <div className="flex items-center"><div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>Critical (4+)</div>
            <div className="flex items-center"><div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>High (3)</div>
            <div className="flex items-center"><div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>Medium (2)</div>
            <div className="flex items-center"><div className="w-4 h-4 rounded-full bg-gray-500 mr-2"></div>Low (1)</div>
            <div className="flex items-center ml-4"><div className="w-4 h-4 rounded-full animate-glow mr-2"></div>In Conflict</div>
            <div className="flex items-center ml-4"><div className="w-4 h-4 rounded-full ring-2 ring-primary-500 ring-offset-2 mr-2"></div>Selected</div>
        </div>
      </div>
    </div>
  )
}

export default LiveView
