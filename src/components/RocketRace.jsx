import React, { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './RocketRace.css'
import RepairStation from './RepairStation'

const ROCKET_COLORS = [
  '#4da6ff', '#ff6b35', '#64d5ff', '#ffd700', '#ff69b4',
  '#50ff88', '#ff8c5a', '#bb88ff', '#88ffee', '#ffaa44',
  '#ff5577', '#77ffaa', '#88aaff', '#ffcc44', '#dd88ff',
]

function getColorForIndex(index) {
  return ROCKET_COLORS[index % ROCKET_COLORS.length]
}

const MAX_FLAME_HEIGHT = 60
const MIN_FLAME_HEIGHT = 8

function getFlameHeight(bandwidth, maxBandwidth) {
  if (bandwidth <= 0) return 0
  const ratio = bandwidth / Math.max(maxBandwidth, 0.1)
  return Math.min(MAX_FLAME_HEIGHT, Math.max(MIN_FLAME_HEIGHT, ratio * MAX_FLAME_HEIGHT))
}

// Round max altitude up to a nice Mbps number so the scale looks natural.
function niceCeilMbps(value) {
  const steps = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
  for (const s of steps) if (value <= s) return s
  return Math.ceil(value / 1000) * 1000
}

function formatMbps(value) {
  if (value >= 100) return `${Math.round(value)} Mbps`
  if (value >= 10) return `${value.toFixed(0)} Mbps`
  if (value >= 1) return `${value.toFixed(1)} Mbps`
  return `${(value * 1000).toFixed(0)} Kbps`
}

export default function RocketRace({ clients }) {
  // Split into active (racing) and inactive (repair station)
  const { activeClients, inactiveClients } = useMemo(() => {
    const active = clients.filter((c) => c.isActive)
    const inactive = clients.filter((c) => !c.isActive)
    return { activeClients: active, inactiveClients: inactive }
  }, [clients])

  const maxClientBw = useMemo(() => {
    if (!activeClients || activeClients.length === 0) return 1
    const max = Math.max(...activeClients.map((c) => c.total), 0.1)
    return max
  }, [activeClients])

  // Altitude scale in Mbps — rockets climb to their actual Mbps, not percent.
  // Adds 30% headroom above the top climber so no rocket pins the ceiling.
  const maxAltitudeMbps = useMemo(
    () => niceCeilMbps(Math.max(maxClientBw * 1.3, 1)),
    [maxClientBw],
  )

  if (!clients || clients.length === 0) {
    return (
      <div className="race-empty">
        <div className="empty-message">
          <span className="empty-icon">🛸</span>
          <p>Tidak ada client terdeteksi</p>
          <span className="empty-subtitle">Pastikan PPPoE server running</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rocket-race-wrapper">
      <div className="rocket-race">
        <div className="race-track">
          <div className="height-markers">
            <div className="marker" style={{ bottom: '70%' }}>
              <span>🏆 {formatMbps(maxAltitudeMbps)}</span>
            </div>
            <div className="marker" style={{ bottom: '52.5%' }}>
              <span>{formatMbps(maxAltitudeMbps * 0.75)}</span>
            </div>
            <div className="marker" style={{ bottom: '35%' }}>
              <span>{formatMbps(maxAltitudeMbps * 0.5)}</span>
            </div>
            <div className="marker" style={{ bottom: '17.5%' }}>
              <span>{formatMbps(maxAltitudeMbps * 0.25)}</span>
            </div>
          </div>

          <div className="rockets-container">
            {activeClients.length === 0 ? (
              <div className="empty-track">
                <span className="empty-track-icon">🚀</span>
                <p>Menunggu client aktif...</p>
              </div>
            ) : (
              <AnimatePresence>
                {activeClients.map((client, index) => {
                  // Altitude maps directly to Mbps — 0 Mbps sits on the ground,
                  // the max-altitude marker is the ceiling. No percent scaling.
                  const heightRatio = client.total / maxAltitudeMbps
                  const heightPercent = Math.min(heightRatio * 70, 70)
                  const color = getColorForIndex(index)
                  const isTop3 = index < 3 && client.total > 0

                  const uploadFlame = getFlameHeight(client.upload, maxClientBw)
                  const downloadFlame = getFlameHeight(client.download, maxClientBw)

                  return (
                    <motion.div
                      key={client.id}
                      className={`rocket-slot ${isTop3 ? 'top-rank' : ''}`}
                      layout
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.5 }}
                    >
                      <motion.div
                        className="mini-rocket-wrapper"
                        initial={{ bottom: '0%' }}
                        animate={{ bottom: `${heightPercent}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      >
                        {isTop3 && (
                          <div className={`rank-badge rank-${index + 1}`}>
                            {index === 0 && '🥇'}
                            {index === 1 && '🥈'}
                            {index === 2 && '🥉'}
                          </div>
                        )}

                        <div className="rocket-body-wrapper">
                          <svg
                            className="mini-rocket"
                            viewBox="0 0 40 80"
                            style={{ filter: `drop-shadow(0 0 10px ${color})` }}
                          >
                            <polygon points="20,0 15,15 25,15" fill={color} />
                            <rect x="12" y="15" width="16" height="40" fill="#e0e0e0" rx="2" />
                            <rect
                              x="12"
                              y="15"
                              width="16"
                              height="40"
                              fill="none"
                              stroke={color}
                              strokeWidth="1.5"
                              rx="2"
                            />
                            <circle cx="20" cy="25" r="2" fill={color} />
                            <circle cx="20" cy="33" r="2" fill={color} />
                            <polygon points="12,45 7,60 12,58" fill={color} />
                            <polygon points="28,45 33,60 28,58" fill={color} />
                            <rect x="13" y="55" width="14" height="6" fill="#333" />
                          </svg>

                          {(uploadFlame > 0 || downloadFlame > 0) && (
                            <div className="flames-container">
                              {uploadFlame > 0 && (
                                <motion.div
                                  className="mini-flame flame-up"
                                  animate={{
                                    height: [uploadFlame * 0.9, uploadFlame, uploadFlame * 0.9],
                                    opacity: [0.7, 1, 0.7],
                                  }}
                                  transition={{ duration: 0.3, repeat: Infinity }}
                                />
                              )}
                              {downloadFlame > 0 && (
                                <motion.div
                                  className="mini-flame flame-down"
                                  animate={{
                                    height: [downloadFlame * 0.9, downloadFlame, downloadFlame * 0.9],
                                    opacity: [0.7, 1, 0.7],
                                  }}
                                  transition={{ duration: 0.3, repeat: Infinity, delay: 0.15 }}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>

                      <div className="rocket-label">
                        <span className="rocket-name" style={{ color }}>
                          {client.name}
                        </span>
                        <span className="rocket-bw">
                          {client.total < 1
                            ? `${(client.total * 1000).toFixed(0)} Kbps`
                            : `${client.total.toFixed(2)} Mbps`}
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Leaderboard - only active clients */}
        <div className="leaderboard">
          <h3>🏁 Live Ranking</h3>
          <div className="leaderboard-list">
            {activeClients.slice(0, 10).map((client, index) => (
              <motion.div
                key={client.id}
                className="leaderboard-item"
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <span className="rank">
                  {index === 0 && '🥇'}
                  {index === 1 && '🥈'}
                  {index === 2 && '🥉'}
                  {index > 2 && `#${index + 1}`}
                </span>
                <span className="name" style={{ color: getColorForIndex(index) }}>
                  {client.name}
                </span>
                <div className="bw-bars">
                  <span className="bw-up">↑ {client.upload.toFixed(2)}</span>
                  <span className="bw-down">↓ {client.download.toFixed(2)}</span>
                </div>
                <span className="status-dot">🟢</span>
              </motion.div>
            ))}
            {activeClients.length === 0 && (
              <div className="leaderboard-empty">No active clients</div>
            )}
          </div>
        </div>
      </div>

      {/* Repair Station for inactive clients */}
      {inactiveClients.length > 0 && (
        <RepairStation clients={inactiveClients} />
      )}
    </div>
  )
}
