'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

export function BitcoinTicker() {
  const [price, setPrice] = useState<number | null>(null)
  const [change24h, setChange24h] = useState<number>(0)
  const [pos, setPos] = useState({ x: 60, y: 80 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const fetchRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchPrice = useCallback(async () => {
    try {
      const res = await fetch('/api/bitcoin')
      const data = await res.json()
      setPrice(data.price)
      setChange24h(data.change24h ?? 0)
    } catch {
      setPrice(null)
    }
  }, [])

  useEffect(() => {
    fetchPrice()
    fetchRef.current = setInterval(fetchPrice, 60000)
    return () => {
      if (fetchRef.current) clearInterval(fetchRef.current)
    }
  }, [fetchPrice])

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('button')) return
      setDragging(true)
      dragStart.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    },
    [pos]
  )

  useEffect(() => {
    if (!dragging) return
    const move = (e: MouseEvent) => {
      setPos({
        x: Math.max(0, e.clientX - dragStart.current.x),
        y: Math.max(0, e.clientY - dragStart.current.y),
      })
    }
    const up = () => setDragging(false)
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
    return () => {
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
    }
  }, [dragging])

  const isUp = change24h >= 0

  return (
    <div
      className="fixed z-50 cursor-grab active:cursor-grabbing select-none font-mono"
      style={{ left: pos.x, top: pos.y }}
      onMouseDown={onMouseDown}
    >
      <div className="bg-black text-green-400 border border-green-500/50 shadow-lg shadow-black/50 min-w-[180px] p-3">
        <div className="text-[10px] text-green-500/80 mb-1">BTC/USD</div>
        <div className="text-lg font-semibold">
          {price != null
            ? `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : '—'}
        </div>
        <div
          className={`text-xs mt-1 ${isUp ? 'text-green-400' : 'text-red-500'}`}
        >
          {change24h >= 0 ? '+' : ''}
          {change24h.toFixed(2)}% 24h
        </div>
        <div className="flex gap-0.5 mt-2 h-4 items-end">
          {[3, 5, 4, 7, 6, 8, 5, 9, 7, 6, 8, 10].map((h, i) => (
            <div
              key={i}
              className={`flex-1 min-w-[4px] ${isUp ? 'bg-green-500/60' : 'bg-red-500/60'}`}
              style={{ height: `${h * 25}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
