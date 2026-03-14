'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { BitcoinTicker } from '@/components/bitcoin-ticker'

interface WikiImage {
  url: string
  fullUrl: string
  title: string
  identifier: string
  description: string
  artist: string
  date: string
}

function ElementTree({
  data,
  depth = 0,
  expanded = true,
}: {
  data: WikiImage | null
  depth?: number
  expanded?: boolean
}) {
  const indent = '  '.repeat(depth)
  const [isExpanded, setIsExpanded] = useState(expanded)

  if (!data) {
    return (
      <div className="text-xs leading-relaxed">
        <span className="text-foreground/50">{indent}</span>
        <span className="text-orange-600">{'<'}</span>
        <span className="text-pink-600">loading</span>
        <span className="text-orange-600">{' />'}</span>
      </div>
    )
  }

  return (
    <div className="text-xs leading-relaxed select-text">
      <div className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="text-foreground/50">{indent}</span>
        <span className="text-foreground/50 mr-1">{isExpanded ? '▼' : '▶'}</span>
        <span className="text-orange-600">{'<'}</span>
        <span className="text-pink-600">image</span>
        <span className="text-orange-500"> id</span>
        <span className="text-foreground">=</span>
        <span className="text-green-600">{'"'}{data.identifier}{'"'}</span>
        <span className="text-orange-600">{'>'}</span>
      </div>
      {isExpanded && (
        <>
          <div>
            <span className="text-foreground/50">{indent}  </span>
            <span className="text-orange-600">{'<'}</span>
            <span className="text-pink-600">title</span>
            <span className="text-orange-600">{'>'}</span>
            <span className="text-foreground">{data.title.slice(0, 35)}{data.title.length > 35 ? '...' : ''}</span>
            <span className="text-orange-600">{'</'}</span>
            <span className="text-pink-600">title</span>
            <span className="text-orange-600">{'>'}</span>
          </div>
          <div>
            <span className="text-foreground/50">{indent}  </span>
            <span className="text-orange-600">{'<'}</span>
            <span className="text-pink-600">artist</span>
            <span className="text-orange-600">{'>'}</span>
            <span className="text-foreground">{data.artist.slice(0, 25)}</span>
            <span className="text-orange-600">{'</'}</span>
            <span className="text-pink-600">artist</span>
            <span className="text-orange-600">{'>'}</span>
          </div>
        </>
      )}
      <div>
        <span className="text-foreground/50">{indent}</span>
        <span className="text-orange-600">{'</'}</span>
        <span className="text-pink-600">image</span>
        <span className="text-orange-600">{'>'}</span>
      </div>
    </div>
  )
}

const sample = (d: Uint8ClampedArray, idx: number, ch: number) =>
  d[Math.max(0, Math.min(idx + ch, d.length - 1))]

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [images, setImages] = useState<HTMLImageElement[]>([])
  const [imageData, setImageData] = useState<WikiImage[]>([])
  const [scrollProgress, setScrollProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentPair, setCurrentPair] = useState(0)
  const [blendFactor, setBlendFactor] = useState(0)
  const [debugTick, setDebugTick] = useState(0)
  const scrollRef = useRef(0)
  const rafRef = useRef<number>(0)

  const fetchImages = useCallback(async () => {
    try {
      const res = await fetch(`/api/archive-images?count=18`)
      const data = await res.json()
      return data.images || []
    } catch {
      return []
    }
  }, [])

  const loadImageObjects = useCallback((urls: WikiImage[]) => {
    return Promise.all(
      urls.map(
        (u) =>
          new Promise<HTMLImageElement>((resolve) => {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            img.onload = () => resolve(img)
            img.onerror = () => {
              const pl = new Image()
              pl.src = 'data:image/svg+xml,' + encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect fill="#eee" width="800" height="600"/><text x="400" y="300" text-anchor="middle" fill="#999" font-size="14">NO_SIGNAL</text></svg>`
              )
              pl.onload = () => resolve(pl)
            }
            img.src = u.url
          })
      )
    )
  }, [])

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      setLoading(true)
      const wikiImages = await fetchImages()
      if (cancelled) return
      setImageData(wikiImages)
      if (wikiImages.length) {
        const loaded = await loadImageObjects(wikiImages)
        if (!cancelled) setImages(loaded)
      }
      setLoading(false)
    }
    init()
    return () => { cancelled = true }
  }, [fetchImages, loadImageObjects])

  const scrollHeight = useMemo(
    () => Math.max(400, images.length * 90),
    [images.length]
  )

  useEffect(() => {
    const onScroll = () => {
      scrollRef.current = window.scrollY
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const tick = () => {
      const scrollTop = scrollRef.current
      const docH = document.documentElement.scrollHeight - window.innerHeight
      const progress = docH > 0 ? scrollTop / docH : 0
      setScrollProgress(progress)
      const total = Math.max(1, images.length - 1)
      const exact = progress * total
      setCurrentPair(Math.min(Math.floor(exact), total - 1))
      setBlendFactor(exact - Math.floor(exact))
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [images.length])

  useEffect(() => {
    const t = setInterval(() => setDebugTick((n: number) => n + 1), 800)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || images.length < 2) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    const total = images.length - 1
    const exact = scrollProgress * total
    const idx = Math.min(Math.floor(exact), total - 1)
    const blend = exact - idx

    const img1 = images[idx]
    const img2 = images[Math.min(idx + 1, images.length - 1)]
    if (!img1 || !img2) return

    ctx.clearRect(0, 0, w, h)

    const scale1 = Math.max(w / img1.width, h / img1.height)
    const sw1 = img1.width * scale1
    const sh1 = img1.height * scale1
    const x1 = (w - sw1) / 2
    const y1 = (h - sh1) / 2

    const scale2 = Math.max(w / img2.width, h / img2.height)
    const sw2 = img2.width * scale2
    const sh2 = img2.height * scale2
    const x2 = (w - sw2) / 2
    const y2 = (h - sh2) / 2

    const tc1 = document.createElement('canvas')
    tc1.width = w
    tc1.height = h
    const c1 = tc1.getContext('2d')!
    c1.clearRect(0, 0, w, h)
    c1.drawImage(img1, x1, y1, sw1, sh1)

    const tc2 = document.createElement('canvas')
    tc2.width = w
    tc2.height = h
    const c2 = tc2.getContext('2d')!
    c2.clearRect(0, 0, w, h)
    c2.drawImage(img2, x2, y2, sw2, sh2)

    const d1 = c1.getImageData(0, 0, w, h).data
    const d2 = c2.getImageData(0, 0, w, h).data
    const out = ctx.createImageData(w, h)
    const o = out.data

    const ease = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

    for (let i = 0; i < d1.length; i += 4) {
      let r = d1[i], g = d1[i + 1], b = d1[i + 2]
      const r2 = d2[i], g2 = d2[i + 1], b2 = d2[i + 2]

      if (blend < 0.33) {
        const t = ease(blend / 0.33)
        r = r + (255 - r - r) * t
        g = g + (255 - g - g) * t
        b = b + (255 - b - b) * t
      } else if (blend < 0.66) {
        const r1i = 255 - r, g1i = 255 - g, b1i = 255 - b
        const r2i = 255 - r2, g2i = 255 - g2, b2i = 255 - b2
        const dr = Math.min(255, Math.abs(r1i - r2i) * 1.2)
        const dg = Math.min(255, Math.abs(g1i - g2i) * 1.2)
        const db = Math.min(255, Math.abs(b1i - b2i) * 1.2)
        const t = (blend - 0.33) / 0.33
        const m = 4 * t * (1 - t)
        r = r1i * (1 - t) + r2i * t + (dr - r1i * (1 - t) - r2i * t) * m
        g = g1i * (1 - t) + g2i * t + (dg - g1i * (1 - t) - g2i * t) * m
        b = b1i * (1 - t) + b2i * t + (db - b1i * (1 - t) - b2i * t) * m
      } else {
        const t = ease((blend - 0.66) / 0.34)
        r = (255 - r2) + (r2 - (255 - r2)) * t
        g = (255 - g2) + (g2 - (255 - g2)) * t
        b = (255 - b2) + (b2 - (255 - b2)) * t
      }

      const shift = Math.round(Math.sin(blend * Math.PI * 2) * 2) * 4
      const rm = Math.sin(blend * Math.PI) * 0.12
      r = r * (1 - rm) + (0.4 * sample(d1, i, -shift) + 0.4 * sample(d2, i, shift) + 0.2 * r) * rm + (r + r2) / 2 * rm * 0.15
      g = g * (1 - rm) + (0.4 * sample(d1, i + 1, -shift) + 0.4 * sample(d2, i + 1, shift) + 0.2 * g) * rm + (g + g2) / 2 * rm * 0.15
      b = b * (1 - rm) + (0.4 * sample(d1, i + 2, shift) + 0.4 * sample(d2, i + 2, -shift) + 0.2 * b) * rm + (b + b2) / 2 * rm * 0.15

      const noise = Math.random() > 0.996 ? (Math.random() > 0.5 ? 30 : -30) : 0
      o[i] = Math.max(0, Math.min(255, r + noise))
      o[i + 1] = Math.max(0, Math.min(255, g + noise))
      o[i + 2] = Math.max(0, Math.min(255, b + noise))
      o[i + 3] = 255
    }

    ctx.putImageData(out, 0, 0)

    ctx.fillStyle = 'rgba(0,0,0,0.006)'
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1)
  }, [images, scrollProgress])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const phase = blendFactor < 0.33 ? 'INVERT_A' : blendFactor < 0.66 ? 'XOR_DIFF' : 'EMERGE_B'

  return (
    <main className="bg-background">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full bg-transparent"
        style={{ transform: `translateY(${scrollProgress * 5}%)` }}
      />

      <div
        className="relative z-20 font-mono w-full flex justify-end"
        style={{ minHeight: `${scrollHeight}vh` }}
      >
        <div className="sticky top-0 w-[36%] min-w-[280px] max-w-[400px] text-foreground p-3 debug-console">
          <div className="flex-1 overflow-auto p-2 text-xs leading-relaxed">
            <div className="text-foreground/40 mb-2">{'<!DOCTYPE html>'}</div>
            <div>
              <span className="text-orange-600">{'<'}</span>
              <span className="text-pink-600">html</span>
              <span className="text-orange-600">{'>'}</span>
            </div>
            <div className="pl-2">
              <span className="text-orange-600">{'<'}</span>
              <span className="text-pink-600">body</span>
              <span className="text-orange-500"> class</span>
              <span className="text-foreground">=</span>
              <span className="text-green-600">{'"portfolio"'}</span>
              <span className="text-orange-600">{'>'}</span>
            </div>
            <div className="pl-4 mt-2">
              <div className="text-foreground/40 text-[10px] mb-1">{'<!-- stream -->'}</div>
              <div>
                <span className="text-orange-600">{'<'}</span>
                <span className="text-pink-600">canvas</span>
                <span className="text-orange-500"> id</span>
                <span className="text-foreground">=</span>
                <span className="text-green-600">{'"datamosh"'}</span>
                <span className="text-orange-600">{'>'}</span>
              </div>
              <div className="pl-4 py-2">
                <div className="text-foreground/50 text-[10px] mb-1">
                  {`// [${currentPair}] → [${Math.min(currentPair + 1, images.length - 1)}]`}
                </div>
                <ElementTree data={imageData[currentPair] ?? null} />
                {images.length > 1 && (
                  <div className="mt-1 opacity-40">
                    <ElementTree data={imageData[Math.min(currentPair + 1, imageData.length - 1)] ?? null} />
                  </div>
                )}
              </div>
              <div>
                <span className="text-orange-600">{'</'}</span>
                <span className="text-pink-600">canvas</span>
                <span className="text-orange-600">{'>'}</span>
              </div>
            </div>
            <div className="pl-2 mt-2">
              <span className="text-orange-600">{'<'}</span>
              <span className="text-purple-500">element.style</span>
              <span className="text-orange-600">{' {'}</span>
            </div>
            <div className="pl-3 text-[10px]">
              <div><span className="text-purple-500">--phase</span><span className="text-foreground">: </span><span className="text-orange-500">{phase}</span></div>
              <div><span className="text-purple-500">--blend</span><span className="text-foreground">: </span><span className="text-blue-600">{(blendFactor * 100).toFixed(1)}%</span></div>
              <div><span className="text-purple-500">--tick</span><span className="text-foreground">: </span><span className="text-foreground/60 debug-num">{debugTick}</span></div>
            </div>
            <div className="text-orange-600 pl-2">{'}'}</div>
            <div className="pl-2 mt-1">
              <span className="text-orange-600">{'</'}</span>
              <span className="text-pink-600">body</span>
              <span className="text-orange-600">{'>'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 left-4 font-mono text-xs text-foreground/70 pointer-events-none z-30">
        <div>SCROLL {(scrollProgress * 100).toFixed(0)}%</div>
        <div>FRAME {currentPair + 1}/{images.length}</div>
      </div>

      <BitcoinTicker />
    </main>
  )
}
