import React, { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './RocketRace.css'

const ROCKET_COLORS = [
  '#4da6ff', '#ff6b35', '#64d5ff', '#ffd700', '#ff69b4',
  '#50ff88', '#ff8c5a', '#bb88ff', '#88ffee', '#ffaa44',
  '#ff5577', '#77ffaa', '#88aaff', '#ffcc44', '#dd88ff',
]

function getColorForIndex(index) {
  return ROCKET_COLORS[index % ROCKET_COLORS.length]
}

// Cap flame height so it doesn't overflow
const MAX_FLAME_HEIGHT = 60
const MIN_FLAME_HEIGHT = 8

function getFlameHeight(bandwidth, maxBandwidth) {
  if (bandwidth <= 0) return 0
  const ratio = bandwidth / Math.max(maxBandwidth, 0.1)
  return Math.min(MAX_FLAME_HEIGHT, Math.max(MIN_FLAME_HEIGHT, ratio * MAX_FLAME_HEIGHT))
}

export default function RocketRace({ clients }) {
  const maxClientBw = useMemo(() => {
    if (!clients || clients.length === 0) return 1
    const max = Math.max(...clients.map((c) => c.total), 0.1)
    return max
  }, [clients])

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
    <div className="rocket-race">
      <div className="race-track">
        <div className="height-markers">
          <div className="marker" style={{ bottom: '95%' }}>
            <span>🏆 Winner</span>
          </div>
          <div className="marker" style={{ bottom: '75%' }}>
            <span>75%</span>
          </div>
          <div className="marker" style={{ bottom: '50%' }}>
            <span>50%</span>
          </div>
          <div className="marker" style={{ bottom: '25%' }}>
            <span>25%</span>
          </div>
        </div>

        <div className="rockets-container">
          <AnimatePresence>
            {clients.map((client, index) => {
              const heightRatio = client.total / maxClientBw
              const heightPercent = Math.min(heightRatio * 100, 95)
              const color = getColorForIndex(index)
              const isTop3 = index < 3 && client.isActive && client.total > 0

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
                    animate={{
                      bottom: client.isActive ? `${heightPercent}%` : '0%',
                      rotate: !client.isActive ? [0, -8, 8, 0] : 0,
                    }}
                    transition={{
                      bottom: { duration: 1, ease: 'easeOut' },
                      rotate: !client.isActive
                        ? { duration: 0.5, repeat: Infinity }
                        : { duration: 0 },
                    }}
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
                        style={{
                          filter: client.isActive
                            ? `drop-shadow(0 0 10px ${color})`
                            : 'grayscale(1) brightness(0.5)',
                        }}
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

                      {/* Flames - only visible when active and has traffic */}
                      {client.isActive && (uploadFlame > 0 || downloadFlame > 0) && (
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

                      {!client.isActive && (
                        <div className="broken-indicator">💥</div>
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
        </div>
      </div>

      {/* Leaderboard */}
      <div className="leaderboard">
        <h3>🏁 Live Ranking</h3>
        <div className="leaderboard-list">
          {clients.slice(0, 10).map((client, index) => (
            <motion.div
              key={client.id}
              className={`leaderboard-item ${!client.isActive ? 'inactive' : ''}`}
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
              <span className="status-dot">{client.isActive ? '🟢' : '🔴'}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
