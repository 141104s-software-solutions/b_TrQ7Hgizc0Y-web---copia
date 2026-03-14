'use client'

import { useEffect, useRef, useCallback } from 'react'

interface DatamoshCanvasProps {
  scrollProgress: number
  images: HTMLImageElement[]
  intensity?: number
}

export function DatamoshCanvas({ scrollProgress, images, intensity = 1 }: DatamoshCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)

  const applyDatamosh = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, progress: number) => {
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    
    // Intensity based on scroll and multiplier
    const effectIntensity = Math.min(progress * 2 * intensity, 1)
    
    // Horizontal pixel displacement (datamosh effect)
    const displacement = Math.floor(effectIntensity * 80)
    
    for (let y = 0; y < height; y++) {
      // Random row glitching - more frequent
      if (Math.random() < effectIntensity * 0.25) {
        const shift = Math.floor(Math.random() * displacement * 2 - displacement)
        const rowStart = y * width * 4
        const tempRow = new Uint8ClampedArray(width * 4)
        
        for (let x = 0; x < width; x++) {
          const srcX = (x + shift + width) % width
          const srcIdx = rowStart + srcX * 4
          const dstIdx = x * 4
          tempRow[dstIdx] = data[srcIdx]
          tempRow[dstIdx + 1] = data[srcIdx + 1]
          tempRow[dstIdx + 2] = data[srcIdx + 2]
          tempRow[dstIdx + 3] = data[srcIdx + 3]
        }
        
        for (let x = 0; x < width * 4; x++) {
          data[rowStart + x] = tempRow[x]
        }
      }
    }
    
    // Color channel separation (RGB shift)
    if (effectIntensity > 0.2) {
      const shift = Math.floor((effectIntensity - 0.2) * 20)
      const tempData = new Uint8ClampedArray(data)
      
      for (let i = 0; i < data.length; i += 4) {
        // Red channel shift right
        const redOffset = Math.min(i + shift * 4, data.length - 4)
        data[i] = tempData[redOffset]
        
        // Blue channel shift left
        const blueOffset = Math.max(i - shift * 4, 0)
        data[i + 2] = tempData[blueOffset + 2]
      }
    }
    
    // Block corruption / pixel sorting
    if (effectIntensity > 0.4) {
      const blockSize = 8 + Math.floor(Math.random() * 16)
      const numBlocks = Math.floor((effectIntensity - 0.4) * 40)
      
      for (let b = 0; b < numBlocks; b++) {
        const blockX = Math.floor(Math.random() * (width / blockSize)) * blockSize
        const blockY = Math.floor(Math.random() * (height / blockSize)) * blockSize
        const srcBlockY = Math.floor(Math.random() * (height / blockSize)) * blockSize
        
        for (let dy = 0; dy < blockSize && blockY + dy < height; dy++) {
          for (let dx = 0; dx < blockSize && blockX + dx < width; dx++) {
            const dstIdx = ((blockY + dy) * width + blockX + dx) * 4
            const srcIdx = ((srcBlockY + dy) * width + blockX + dx) * 4
            
            if (srcIdx < data.length - 3 && dstIdx < data.length - 3) {
              data[dstIdx] = data[srcIdx]
              data[dstIdx + 1] = data[srcIdx + 1]
              data[dstIdx + 2] = data[srcIdx + 2]
            }
          }
        }
      }
    }
    
    // Scanline artifacts
    if (effectIntensity > 0.3) {
      for (let y = 0; y < height; y += 2) {
        if (Math.random() < effectIntensity * 0.1) {
          const rowStart = y * width * 4
          for (let x = 0; x < width * 4; x += 4) {
            data[rowStart + x] = Math.min(255, data[rowStart + x] + 30)
            data[rowStart + x + 1] = Math.min(255, data[rowStart + x + 1] + 30)
            data[rowStart + x + 2] = Math.min(255, data[rowStart + x + 2] + 30)
          }
        }
      }
    }
    
    // Convert to grayscale with contrast boost
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114)
      // Increase contrast
      const contrast = 1.2
      const adjusted = ((avg / 255 - 0.5) * contrast + 0.5) * 255
      const final = Math.max(0, Math.min(255, adjusted))
      data[i] = final
      data[i + 1] = final
      data[i + 2] = final
    }
    
    ctx.putImageData(imageData, 0, 0)
  }, [intensity])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || images.length === 0) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const render = () => {
      const width = canvas.width
      const height = canvas.height
      
      // Clear with white
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
      
      // Determine which images to blend based on scroll
      const totalImages = images.length
      const imageIndex = Math.min(
        Math.floor(scrollProgress * totalImages),
        totalImages - 1
      )
      const nextIndex = Math.min(imageIndex + 1, totalImages - 1)
      const blendFactor = (scrollProgress * totalImages) % 1
      
      // Draw current image
      const img1 = images[imageIndex]
      const img2 = images[nextIndex]
      
      if (img1) {
        ctx.globalAlpha = 1 - blendFactor * 0.6
        const scale1 = Math.max(width / img1.width, height / img1.height)
        const w1 = img1.width * scale1
        const h1 = img1.height * scale1
        ctx.drawImage(img1, (width - w1) / 2, (height - h1) / 2, w1, h1)
      }
      
      if (img2 && imageIndex !== nextIndex) {
        ctx.globalAlpha = blendFactor * 0.8
        const scale2 = Math.max(width / img2.width, height / img2.height)
        const w2 = img2.width * scale2
        const h2 = img2.height * scale2
        ctx.drawImage(img2, (width - w2) / 2, (height - h2) / 2, w2, h2)
      }
      
      ctx.globalAlpha = 1
      
      // Apply datamosh effects
      applyDatamosh(ctx, width, height, scrollProgress)
    }
    
    render()
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [images, scrollProgress, applyDatamosh])

  return (
    <canvas 
      ref={canvasRef}
      width={600}
      height={450}
      className="w-full h-full bitcrush"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
