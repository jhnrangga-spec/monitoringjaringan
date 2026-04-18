import React from 'react'
import { motion } from 'framer-motion'
import './StatsPanel.css'

export default function StatsPanel({
  upload,
  download,
  isRunning,
  loading,
  error,
  totalBandwidth,
}) {
  const formatBandwidth = (value) => value.toFixed(2)

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  }

  return (
    <motion.div
      className="stats-panel"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="stats-header">
        <h2>Network Status</h2>
        <motion.div
          className={`status-indicator ${isRunning ? 'active' : 'inactive'}`}
          animate={{
            scale: isRunning ? [1, 1.2, 1] : 1,
            opacity: isRunning ? [0.5, 1, 0.5] : 0.3,
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {isRunning ? '🟢 Online' : '🔴 Offline'}
        </motion.div>
      </div>

      {loading && (
        <motion.div className="loading" variants={itemVariants}>
          ⏳ Loading...
        </motion.div>
      )}

      {!loading && (
        <>
          <motion.div className="stat-item upload-stat" variants={itemVariants}>
            <div className="stat-icon">📤</div>
            <div className="stat-content">
              <span className="stat-label">Upload</span>
              <span className="stat-value">{formatBandwidth(upload)} Mbps</span>
            </div>
            <motion.div
              className="stat-bar"
              animate={{ width: `${Math.min((upload / 100) * 100, 100)}%` }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>

          <motion.div className="stat-item download-stat" variants={itemVariants}>
            <div className="stat-icon">📥</div>
            <div className="stat-content">
              <span className="stat-label">Download</span>
              <span className="stat-value">{formatBandwidth(download)} Mbps</span>
            </div>
            <motion.div
              className="stat-bar"
              animate={{ width: `${Math.min((download / 100) * 100, 100)}%` }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>

          <motion.div className="stat-item total-stat" variants={itemVariants}>
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <span className="stat-label">Total Bandwidth</span>
              <span className="stat-value">{formatBandwidth(totalBandwidth)} Mbps</span>
            </div>
            <motion.div
              className="stat-bar"
              animate={{
                width: `${Math.min((totalBandwidth / 200) * 100, 100)}%`,
              }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        </>
      )}

      {error && (
        <motion.div className="error-alert" variants={itemVariants}>
          ⚠️ {error}
        </motion.div>
      )}
    </motion.div>
  )
}
