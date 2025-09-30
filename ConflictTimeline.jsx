import React from 'react'
import { format } from 'date-fns'

const ConflictTimeline = ({ conflict }) => {
  const { train1, train2, train1Window, train2Window, startTime, endTime } = conflict

  if (!train1Window || !train2Window) {
    return <p className="text-sm text-gray-500">Timeline data not available for this conflict.</p>
  }

  const timelineStart = Math.min(train1Window.start, train2Window.start)
  const timelineEnd = Math.max(train1Window.end, train2Window.end)
  const totalDuration = timelineEnd - timelineStart

  if (totalDuration <= 0) return null

  const getBarProps = (window) => {
    const left = ((window.start - timelineStart) / totalDuration) * 100
    const width = ((window.end - window.start) / totalDuration) * 100
    return { left: `${left}%`, width: `${width}%` }
  }

  const bar1Props = getBarProps(train1Window)
  const bar2Props = getBarProps(train2Window)
  const overlapProps = getBarProps({ start: startTime, end: endTime })

  return (
    <div>
      <h4 className="font-medium text-gray-900 mb-3">Visual Timeline</h4>
      <div className="space-y-4 text-sm">
        {/* Train 1 Timeline */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-800">{train1.number}</span>
            <span className="text-xs text-gray-500">
              {format(train1Window.start, 'HH:mm:ss')} - {format(train1Window.end, 'HH:mm:ss')}
            </span>
          </div>
          <div className="relative w-full h-6 bg-gray-200 rounded">
            <div
              className="absolute h-6 bg-blue-300 rounded"
              style={{ ...bar1Props }}
            ></div>
          </div>
        </div>

        {/* Train 2 Timeline */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-800">{train2.number}</span>
            <span className="text-xs text-gray-500">
              {format(train2Window.start, 'HH:mm:ss')} - {format(train2Window.end, 'HH:mm:ss')}
            </span>
          </div>
          <div className="relative w-full h-6 bg-gray-200 rounded">
            <div
              className="absolute h-6 bg-yellow-300 rounded"
              style={{ ...bar2Props }}
            ></div>
          </div>
        </div>

        {/* Combined Timeline with Overlap */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-800">Conflict Overlap</span>
            <span className="text-xs text-red-500 font-semibold">
              {format(startTime, 'HH:mm:ss')} - {format(endTime, 'HH:mm:ss')}
            </span>
          </div>
          <div className="relative w-full h-8 bg-gray-100 rounded">
            {/* Train 1 Bar */}
            <div
              className="absolute top-0 h-8 bg-blue-300 opacity-70 rounded"
              style={{ ...bar1Props }}
            ></div>
            {/* Train 2 Bar */}
            <div
              className="absolute top-0 h-8 bg-yellow-300 opacity-70 rounded"
              style={{ ...bar2Props }}
            ></div>
            {/* Overlap Bar */}
            <div
              className="absolute top-0 h-8 bg-red-500 rounded animate-pulse"
              style={{ ...overlapProps }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConflictTimeline
