import React from 'react'
import Link from 'next/link'
import { cn } from '../../../lib/utils'

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-1.5", className)}>
      {/* Icon */}
      <div className="w-12 h-12 aspect-square">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="24" fill="black"/>
          <mask id="mask0_95_5" maskUnits="userSpaceOnUse" x="0" y="0" width="48" height="48">
            <circle cx="24" cy="24" r="24" fill="black"/>
          </mask>
          <g mask="url(#mask0_95_5)">
            <path d="M0 24L49 9L49 39L0 24Z" fill="url(#paint0_linear_95_5)"/>
          </g>
          <defs>
            <linearGradient id="paint0_linear_95_5" x1="49" y1="23.9996" x2="0" y2="23.9996" gradientUnits="userSpaceOnUse">
              <stop stop-color="#ABFF02"/>
              <stop offset="1" stop-color="#FF0000"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* Text */}
      <span style={{ 
        color: '#000',
        fontFamily: 'Inter, sans-serif',
        fontSize: '20px',
        fontStyle: 'normal',
        fontWeight: 600,
        lineHeight: 'normal',
        letterSpacing: '-0.6px'
      }}>
        Color Picker
      </span>
    </Link>
  )
} 