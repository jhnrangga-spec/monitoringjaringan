import React from 'react'
import { motion } from 'framer-motion'
import './RocketMonitor.css'
import Rocket from './Rocket'
import StatsPanel from './StatsPanel'

export default function RocketMonitor({ data, loading, error }) {
  const upload = data?.upload || 0
  const download = data?.download || 0
  const isRunning = data?.isRunning || false
  const maxBandwidth = 100 // Mbps - adjust based on needs

  const totalBandwidth = upload + download
  const rocketHeight = (totalBandwidth / maxBandwidth) * 100

  return (
    <div className="rocket-monitor">
      <div className="monitor-header">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="title"
        >
          🚀 PPPoE Monitoring
        </motion.h1>
        <p className="subtitle">Real-time Network Monitoring from Mikrotik</p>
      </div>

      <div className="monitor-content">
        <div className="rocket-container">
          <Rocket
            height={rocketHeight}
            upload={upload}
            download={download}
            isRunning={isRunning}
            maxBandwidth={maxBandwidth}
          />
        </div>

        <StatsPanel
          upload={upload}
          download={download}
          isRunning={isRunning}
          loading={loading}
          error={error}
          totalBandwidth={totalBandwidth}
        />
      </div>

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
