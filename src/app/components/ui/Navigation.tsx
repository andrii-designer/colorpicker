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
    <nav className={cn("flex items-center justify-center px-2", className)}>
      <ul className="flex space-x-1 bg-neutral-100 p-1 rounded-lg">
        {items.map((item) => (
          <li key={item.name}>
            <Link
              href={item.href}
              className={cn(
                "block px-4 py-2 text-sm font-medium rounded-md transition-colors",
                item.active
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-neutral-600 hover:text-primary-600 hover:bg-white/50"
              )}
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

const defaultItems: NavigationItem[] = [
  {
    name: "Random Palette",
    href: "/",
    active: true,
  },
  {
    name: "Color Harmony",
    href: "/color-harmony",
  },
  {
    name: "Color Blindness",
    href: "/color-blindness",
  },
  {
    name: "Saved Palettes",
    href: "/saved-palettes",
  },
] 