import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './RepairStation.css'

export default function RepairStation({ clients }) {
  return (
    <motion.div
      className="repair-station"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="repair-header">
        <motion.span
          className="repair-icon"
          animate={{ rotate: [0, -15, 15, -15, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          🔧
        </motion.span>
        <h3>Repair Station</h3>
        <span className="repair-count">{clients.length} rocket{clients.length !== 1 ? 's' : ''} offline</span>
      </div>

      <div className="repair-grid">
        <AnimatePresence>
          {clients.map((client, index) => (
            <BrokenRocket key={client.id} client={client} index={index} />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function BrokenRocket({ client, index }) {
  const delayOffset = (index * 0.3) % 2

  return (
    <motion.div
      className="broken-rocket-slot"
      layout
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.4, delay: index * 0.03 }}
    >
      <div className="repair-bay">
        {/* Repair platform */}
        <div className="repair-platform" />

        {/* Broken rocket with tilt animation */}
        <motion.div
          className="broken-rocket-container"
          animate={{
            rotate: [-3, 3, -3],
            y: [0, -2, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: delayOffset,
          }}
        >
          <svg className="broken-rocket" viewBox="0 0 40 80">
            <polygon points="20,0 15,15 25,15" fill="#666" />
            <rect x="12" y="15" width="16" height="40" fill="#888" rx="2" />
            <rect
              x="12"
              y="15"
              width="16"
              height="40"
              fill="none"
              stroke="#555"
              strokeWidth="1.5"
              rx="2"
            />
            <circle cx="20" cy="25" r="2" fill="#444" />
            <circle cx="20" cy="33" r="2" fill="#444" />
            <polygon points="12,45 7,60 12,58" fill="#666" />
            <polygon points="28,45 33,60 28,58" fill="#666" />
            <rect x="13" y="55" width="14" height="6" fill="#333" />

            {/* Damage cracks */}
            <path
              d="M 14 22 L 18 28 L 16 32 L 20 36"
              stroke="#333"
              strokeWidth="0.8"
              fill="none"
              opacity="0.8"
            />
            <path
              d="M 22 18 L 26 24 L 24 30"
              stroke="#333"
              strokeWidth="0.6"
              fill="none"
              opacity="0.6"
            />
          </svg>

          {/* Smoke puffs */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="smoke-puff"
              initial={{ opacity: 0, y: 0, x: (i - 1) * 8 }}
              animate={{
                opacity: [0, 0.6, 0],
                y: [-10, -30, -40],
                scale: [0.5, 1.2, 1.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.5 + delayOffset,
              }}
            />
          ))}
        </motion.div>

        {/* Spinning wrench */}
        <motion.div
          className="wrench"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          🔧
        </motion.div>

        {/* Rotating gear */}
        <motion.div
          className="gear"
          animate={{ rotate: -360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        >
          ⚙️
        </motion.div>

        {/* Sparks */}
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={`spark-${i}`}
            className="spark"
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{
              opacity: [0, 1, 0],
              x: [0, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 60],
              y: [0, -10 - Math.random() * 20, -30 - Math.random() * 20],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.3 + delayOffset,
            }}
          />
        ))}

        {/* Status label */}
        <div className="repair-status">
          <motion.div
            className="repair-progress"
            animate={{
              background: [
                'linear-gradient(90deg, #ff6b35 0%, #ff6b35 30%, #555 30%, #555 100%)',
                'linear-gradient(90deg, #ff6b35 0%, #ff6b35 60%, #555 60%, #555 100%)',
                'linear-gradient(90deg, #ff6b35 0%, #ff6b35 80%, #555 80%, #555 100%)',
                'linear-gradient(90deg, #ff6b35 0%, #ff6b35 30%, #555 30%, #555 100%)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </div>
      </div>

      <div className="broken-rocket-label">
        <span className="broken-name">{client.name}</span>
        <span className="broken-status">⚠️ Offline</span>
      </div>
    </motion.div>
  )
}
