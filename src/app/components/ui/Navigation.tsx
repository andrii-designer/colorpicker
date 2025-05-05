import React from 'react'
import Link from 'next/link'
import { cn } from '../../../lib/utils'

interface NavigationItem {
  name: string
  href: string
  active?: boolean
}

interface NavigationProps {
  className?: string
  items?: NavigationItem[]
}

export function Navigation({ className, items = defaultItems }: NavigationProps) {
  return (
    <nav className={cn("inline-flex items-center gap-4", className)}>
      {items.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          style={{
            display: 'flex',
            padding: '8px 16px',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            borderRadius: '99px',
            background: item.active ? '#000' : 'transparent'
          }}
        >
          <span style={{ 
            color: item.active ? '#FFF' : '#000',
            fontFamily: 'Inter',
            fontSize: '16px',
            fontStyle: 'normal',
            fontWeight: 500,
            lineHeight: 'normal'
          }}>
            {item.name}
          </span>
        </Link>
      ))}
    </nav>
  )
}

const defaultItems: NavigationItem[] = [
  {
    name: "Random palette",
    href: "/",
    active: true,
  },
  {
    name: "Based on color",
    href: "/color-harmony",
  },
  {
    name: "From image",
    href: "/from-image",
  }
] 