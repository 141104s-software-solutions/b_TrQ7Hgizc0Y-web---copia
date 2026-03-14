'use client'

import { ReactNode } from 'react'

interface GridCellProps {
  children?: ReactNode
  span?: number
  className?: string
  label?: string
}

export function GridCell({ children, span = 1, className = '', label }: GridCellProps) {
  return (
    <div 
      className={`border border-border p-4 relative ${className}`}
      style={{ gridColumn: `span ${span}` }}
    >
      {label && (
        <span className="absolute top-1 left-2 text-[10px] text-muted-foreground uppercase tracking-widest">
          {label}
        </span>
      )}
      {children}
    </div>
  )
}

interface SwissGridProps {
  children: ReactNode
  columns?: number
  className?: string
}

export function SwissGrid({ children, columns = 12, className = '' }: SwissGridProps) {
  return (
    <div 
      className={`grid gap-0 ${className}`}
      style={{ 
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
      }}
    >
      {children}
    </div>
  )
}

export function GridOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 opacity-10">
      <div className="w-full h-full grid-overlay" />
    </div>
  )
}
