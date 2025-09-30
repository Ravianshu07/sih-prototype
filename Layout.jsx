import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Train, Home, MapPin, AlertTriangle, TrendingUp, RotateCcw, Activity } from 'lucide-react'
import { useRailway } from '../context/RailwayContext'
import { motion } from 'framer-motion'

const Layout = ({ children }) => {
  const location = useLocation()
  const { resetData } = useRailway()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Live View', href: '/live-view', icon: Activity },
    { name: 'Trains', href: '/trains', icon: Train },
    { name: 'Sections', href: '/sections', icon: MapPin },
    { name: 'Conflicts', href: '/conflicts', icon: AlertTriangle },
    { name: 'What-If Analysis', href: '/what-if', icon: TrendingUp },
  ]

  const handleResetData = () => {
    if (window.confirm('Are you sure you want to reset all data to sample data?')) {
      resetData()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Train className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">Railway Control</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        location.pathname === item.href
                          ? 'border-primary-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleResetData}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Data
              </button>
            </div>
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    location.pathname === item.href
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200`}
                >
                  <div className="flex items-center">
                    <Icon className="h-4 w-4 mr-3" />
                    {item.name}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="px-4 py-6 sm:px-0"
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}

export default Layout
