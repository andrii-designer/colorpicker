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
            display padding justifyContent alignItems gap borderRadius background ? '#000'  }}
        >
          <span style={{ 
            color ? '#FFF' : '#000',
            fontFamily fontSize fontStyle fontWeight lineHeight }}>
            {item.name}
          </span>
        </Link>
      ))}
    </nav>
  )
}

const defaultItems= [
  {
    name href: "/",
    active },
  {
    name href: "/color-harmony",
  },
  {
    name href: "/from-image",
  }
] 