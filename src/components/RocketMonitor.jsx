import React from 'react'
import { motion } from 'framer-motion'
import './RocketMonitor.css'
import RocketRace from './RocketRace'

export default function RocketMonitor({ data, loading, error }) {
  const clients = data?.clients || []
  const isRunning = data?.isRunning || false
  const totalUpload = data?.totalUpload || 0
  const totalDownload = data?.totalDownload || 0
  const activeClients = data?.activeClients || 0
  const totalClients = data?.totalClients || 0

  return (
    <div className="rocket-monitor">
      <div className="monitor-header">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="title"
        >
          🚀 PPPoE Rocket Race
        </motion.h1>
        <p className="subtitle">Live Bandwidth Racing Competition</p>

        <motion.div
          className="summary-stats"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="summary-item">
            <span className="summary-label">Active</span>
            <span className="summary-value">
              {activeClients} / {totalClients}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">↑ Upload</span>
            <span className="summary-value upload">
              {totalUpload.toFixed(2)} Mbps
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">↓ Download</span>
            <span className="summary-value download">
              {totalDownload.toFixed(2)} Mbps
            </span>
          </div>
          <div className={`summary-item status ${isRunning ? 'active' : 'inactive'}`}>
            <span className="summary-label">Status</span>
            <span className="summary-value">
              {isRunning ? '🟢 Online' : '🔴 Offline'}
            </span>
          </div>
        </motion.div>
      </div>

      {loading && !data && (
        <motion.div
          className="loading-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="loading-rocket">🚀</div>
          <p>Connecting to Mikrotik...</p>
        </motion.div>
      )}

      {!loading && <RocketRace clients={clients} />}

      {error && (
        <motion.div
          className="error-message"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          ⚠️ Error: {error}
        </motion.div>
      )}
    </div>
  )
}
