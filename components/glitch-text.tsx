'use client'

import { useEffect, useState } from 'react'

interface GlitchTextProps {
  text: string
  className?: string
  glitchIntensity?: number
}

const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/\\~`01'

export function GlitchText({ text, className = '', glitchIntensity = 0.1 }: GlitchTextProps) {
  const [displayText, setDisplayText] = useState(text)

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < glitchIntensity) {
        const chars = text.split('')
        const numGlitches = Math.floor(Math.random() * 3) + 1
        
        for (let i = 0; i < numGlitches; i++) {
          const idx = Math.floor(Math.random() * chars.length)
          if (chars[idx] !== ' ') {
            chars[idx] = glitchChars[Math.floor(Math.random() * glitchChars.length)]
          }
        }
        
        setDisplayText(chars.join(''))
        
        setTimeout(() => setDisplayText(text), 50 + Math.random() * 100)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [text, glitchIntensity])

  return (
    <span className={`glitch-text ${className}`} data-text={text}>
      {displayText}
    </span>
  )
}

export function TypewriterText({ text, className = '', speed = 50 }: { text: string; className?: string; speed?: number }) {
  const [displayText, setDisplayText] = useState('')
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    let index = 0
    setDisplayText('')
    
    const typeInterval = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1))
        index++
      } else {
        clearInterval(typeInterval)
      }
    }, speed)

    return () => clearInterval(typeInterval)
  }, [text, speed])

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 500)

    return () => clearInterval(cursorInterval)
  }, [])

  return (
    <span className={className}>
      {displayText}
      <span className={showCursor ? 'opacity-100' : 'opacity-0'}>_</span>
    </span>
  )
}
