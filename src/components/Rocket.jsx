import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import './Rocket.css'

export default function Rocket({ height, upload, download, isRunning, maxBandwidth }) {
  const particles = useMemo(
    () => Array.from({ length: 20 }, (_, i) => ({
      id: i,
      delay: Math.random() * 0.5,
      duration: Math.random() * 1 + 0.5,
      x: Math.random() * 40 - 20,
    })),
    []
  )

  return (
    <div className="rocket-launch-area">
      <svg className="rocket-background" viewBox="0 0 200 400">
        <defs>
          <linearGradient id="sky-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(5, 10, 25, 0)" />
            <stop offset="100%" stopColor="rgba(50, 100, 150, 0.1)" />
          </linearGradient>
        </defs>
        <rect width="200" height="400" fill="url(#sky-gradient)" />
      </svg>

      <motion.div
        className={`rocket-wrapper ${isRunning ? 'running' : 'broken'}`}
        animate={{
          y: isRunning ? [0, -height * 3] : 0,
          opacity: isRunning ? 1 : 0.3,
        }}
        transition={{
          duration: isRunning ? 3 : 0,
          ease: 'easeInOut',
          repeat: isRunning ? Infinity : 0,
        }}
      >
        {/* Rocket Flames */}
        {isRunning && (
          <>
            {/* Upload Flame (Blue) */}
            <motion.div
              className="flame flame-upload"
              animate={{
                height: [upload * 2, upload * 2.5, upload * 2],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{ duration: 0.3, repeat: Infinity }}
            />
            {/* Download Flame (Red) */}
            <motion.div
              className="flame flame-download"
              animate={{
                height: [download * 2, download * 2.5, download * 2],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{ duration: 0.3, repeat: Infinity }}
            />
          </>
        )}

        {/* Rocket Body */}
        <svg className="rocket" viewBox="0 0 50 100" xmlns="http://www.w3.org/2000/svg">
          {/* Nose cone */}
          <polygon
            points="25,0 20,15 30,15"
            fill="#ff6b35"
            filter="drop-shadow(0 0 10px #ff6b35)"
          />

          {/* Body with glow */}
          <rect x="15" y="15" width="20" height="50" fill="#e0e0e0" rx="2" />
          <rect
            x="15"
            y="15"
            width="20"
            height="50"
            fill="none"
            stroke="#4da6ff"
            strokeWidth="1"
            filter="drop-shadow(0 0 8px #4da6ff)"
            rx="2"
          />

          {/* Windows */}
          <circle cx="25" cy="25" r="2.5" fill="#4da6ff" filter="drop-shadow(0 0 5px #4da6ff)" />
          <circle cx="25" cy="35" r="2.5" fill="#4da6ff" filter="drop-shadow(0 0 5px #4da6ff)" />
          <circle cx="25" cy="45" r="2.5" fill="#4da6ff" filter="drop-shadow(0 0 5px #4da6ff)" />

          {/* Left fin */}
          <polygon points="15,55 10,75 15,70" fill="#ff6b35" />
          {/* Right fin */}
          <polygon points="35,55 40,75 35,70" fill="#ff6b35" />

          {/* Engine nozzle */}
          <rect x="16" y="68" width="18" height="8" fill="#333" />
        </svg>

        {/* Particles/Energy */}
        {isRunning && particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="particle"
            initial={{ y: 0, x: particle.x, opacity: 1 }}
            animate={{
              y: [0, -50, -100],
              opacity: [1, 0.5, 0],
              x: [particle.x, particle.x * 2, particle.x * 3],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
            }}
          />
        ))}
      </motion.div>

      {/* Broken rocket state */}
      {!isRunning && (
        <motion.div
          className="rocket-broken-state"
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          💥
        </motion.div>
      )}

      {/* Bandwidth indicator */}
      <div className="bandwidth-display">
        <motion.div
          className="bandwidth-up"
          animate={{ width: `${(upload / (maxBandwidth || 1)) * 100}%` }}
          transition={{ duration: 0.2 }}
        >
          <span className="bandwidth-label">↑ {upload.toFixed(2)} Mbps</span>
        </motion.div>
        <motion.div
          className="bandwidth-down"
          animate={{ width: `${(download / (maxBandwidth || 1)) * 100}%` }}
          transition={{ duration: 0.2 }}
        >
          <span className="bandwidth-label">↓ {download.toFixed(2)} Mbps</span>
        </motion.div>
      </div>
    </div>
  )
}
