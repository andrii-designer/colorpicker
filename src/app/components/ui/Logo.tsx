import React from 'react'
import Link from 'next/link'
import { cn } from '../../../lib/utils'

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <Link href="/" className={cn("flex items-center", className)}>
      <span className="text-xl font-bold" style={{ 
        fontFamily: 'Inter, sans-serif',
        fontSize: '20px',
        fontStyle: 'normal',
        fontWeight: 700,
        lineHeight: 'normal',
        color: '#000000'
      }}>
        Color Picker
      </span>
    </Link>
  )
} 