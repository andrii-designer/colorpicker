import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '../../../lib/utils'

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-1.5", className)}>
      <Image src="/logo.svg" alt="ColorJogger" width={168} height={48} priority />
    </Link>
  )
} 