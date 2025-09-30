import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { RailwayProvider } from './context/RailwayContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Trains from './pages/Trains'
import Sections from './pages/Sections'
import Conflicts from './pages/Conflicts'
import WhatIf from './pages/WhatIf'
import LiveView from './pages/LiveView'

function App() {
  return (
    <RailwayProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/live-view" element={<LiveView />} />
            <Route path="/trains" element={<Trains />} />
            <Route path="/sections" element={<Sections />} />
            <Route path="/conflicts" element={<Conflicts />} />
            <Route path="/what-if" element={<WhatIf />} />
          </Routes>
        </Layout>
      </Router>
    </RailwayProvider>
  )
}

export default App
