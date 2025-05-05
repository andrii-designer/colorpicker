import React from 'react'
import Link from 'next/link'
import { cn } from '../../../lib/utils'

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <Link href="/" className={cn("text-2xl font-bold text-primary-600 flex items-center", className)}>
      <span className="mr-2">🎨</span>
      <span>ColorPicker</span>
    </Link>
  )
} 