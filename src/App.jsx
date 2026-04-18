import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import './App.css'
import GalaxyBackground from './components/GalaxyBackground'
import RocketMonitor from './components/RocketMonitor'

function App() {
  const [mikrotikData, setMikrotikData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [intervalRef, setIntervalRef] = useState(null)

  const startMonitoring = async () => {
    setIsMonitoring(true)
    setLoading(true)

    const fetchData = async () => {
      try {
        const response = await fetch('/api/handler')
        if (!response.ok) throw new Error('Failed to fetch data')
        const data = await response.json()
        setMikrotikData(data)
        setError(null)
      } catch (err) {
        setError(err.message)
        console.error('Error fetching Mikrotik data:', err)
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    await fetchData()

    // Set up interval for continuous updates
    const interval = setInterval(fetchData, 1000)
    setIntervalRef(interval)
  }

  const stopMonitoring = () => {
    setIsMonitoring(false)
    if (intervalRef) {
      clearInterval(intervalRef)
      setIntervalRef(null)
    }
    setMikrotikData(null)
  }

  useEffect(() => {
    return () => {
      if (intervalRef) {
        clearInterval(intervalRef)
      }
    }
  }, [intervalRef])

  return (
    <div className="app-container">
      <GalaxyBackground />

      {!isMonitoring ? (
        <div className="start-dashboard">
          <motion.div
            className="dashboard-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="dashboard-title">🚀 Network Monitoring Hub</h1>
            <p className="dashboard-subtitle">Monitor real-time PPPoE bandwidth with live rocket animation</p>

            <motion.button
              className="start-button"
              onClick={startMonitoring}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>▶ Start Monitoring</span>
            </motion.button>

            <div className="features">
              <div className="feature">
                <span className="feature-icon">📊</span>
                <p>Real-time bandwidth tracking</p>
              </div>
              <div className="feature">
                <span className="feature-icon">🌌</span>
                <p>Space-themed animations</p>
              </div>
              <div className="feature">
                <span className="feature-icon">⚡</span>
                <p>Live Mikrotik integration</p>
              </div>
            </div>

            <p className="dashboard-footer">No login required • Live data only when monitoring active</p>
          </motion.div>
        </div>
      ) : (
        <>
          <motion.button
            className="stop-button"
            onClick={stopMonitoring}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ⏹ Stop Monitoring
          </motion.button>
          <RocketMonitor data={mikrotikData} loading={loading} error={error} />
        </>
      )}
    </div>
  )
}

export default App
