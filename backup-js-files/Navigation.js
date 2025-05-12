import React from 'react'
import Link from 'next/link'
import { cn } from '../../../lib/utils'

export function Navigation({ className, items = defaultItems }) {
  return (
    <nav className={cn("inline-flex items-center gap-4", className)}>
      {items.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          style={{
            display: 'flex',
            padding: '0.5rem 1rem',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
            borderRadius: '0.25rem',
            background: item.active ? '#000' : 'transparent'
          }}
        >
          <span style={{ 
            color: item.active ? '#FFF' : '#000',
            fontFamily: 'inherit',
            fontSize: '1rem',
            fontStyle: 'normal',
            fontWeight: '500',
            lineHeight: '1.5'
          }}>
            {item.name}
          </span>
        </Link>
      ))}
    </nav>
  )
}

const defaultItems = [
  {
    name: "Home",
    href: "/",
    active: true
  },
  {
    name: "Color Harmony",
    href: "/color-harmony",
    active: false
  },
  {
    name: "From Image",
    href: "/from-image",
    active: false
  }
] 