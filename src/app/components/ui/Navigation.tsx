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
          className={cn(
            "flex px-3 py-2 justify-center items-center gap-2.5 rounded-[99px]",
            item.active
              ? "bg-black text-white"
              : "text-black hover:bg-neutral-100"
          )}
        >
          <span style={{ 
            fontFamily: 'Inter, sans-serif',
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