import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import './GalaxyBackground.css'

export default function GalaxyBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5,
      opacity: Math.random() * 0.5 + 0.5,
      twinkleSpeed: Math.random() * 0.05 + 0.01,
    }))

    const meteors = Array.from({ length: 5 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.3,
      vx: Math.random() * 2 + 1,
      vy: Math.random() * 2 + 1,
      length: Math.random() * 100 + 50,
      opacity: 0.8,
    }))

    const animate = () => {
      ctx.fillStyle = 'rgba(5, 10, 25, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      stars.forEach((star) => {
        star.opacity += star.twinkleSpeed
        if (star.opacity > 1 || star.opacity < 0.2) {
          star.twinkleSpeed *= -1
        }

        ctx.fillStyle = `rgba(100, 150, 255, ${star.opacity})`
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      meteors.forEach((meteor) => {
        meteor.x += meteor.vx
        meteor.y += meteor.vy

        if (meteor.x > canvas.width || meteor.y > canvas.height) {
          meteor.x = Math.random() * canvas.width
          meteor.y = Math.random() * canvas.height * 0.3
        }

        const gradient = ctx.createLinearGradient(
          meteor.x,
          meteor.y,
          meteor.x - meteor.vx * 10,
          meteor.y - meteor.vy * 10
        )
        gradient.addColorStop(0, 'rgba(150, 200, 255, 0.8)')
        gradient.addColorStop(1, 'rgba(150, 200, 255, 0)')

        ctx.strokeStyle = gradient
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(meteor.x, meteor.y)
        ctx.lineTo(meteor.x - meteor.vx * 20, meteor.y - meteor.vy * 20)
        ctx.stroke()
      })

      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="galaxy-background">
      <canvas ref={canvasRef} className="galaxy-canvas" />
      <motion.div
        className="nebula nebula-1"
        animate={{
          opacity: [0.2, 0.4, 0.2],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="nebula nebula-2"
        animate={{
          opacity: [0.15, 0.35, 0.15],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 10, repeat: Infinity }}
      />
    </div>
  )
}
