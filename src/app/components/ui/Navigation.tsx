'use client';

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  const pathname = usePathname();
  
  // Update active state based on current path
  const updatedItems = items.map(item => ({
    ...item,
    active: pathname === item.href
  }));
  
  return (
    <nav className={cn("flex items-center justify-center gap-4 w-[460px]", className)}>
      {updatedItems.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={cn(
            "flex items-center justify-center px-6 py-2 rounded-full transition-colors whitespace-nowrap w-[150px]",
            item.active ? "bg-black text-white" : "text-black hover:bg-gray-100"
          )}
        >
          <span className="text-base font-medium">{item.name}</span>
        </Link>
      ))}
    </nav>
  )
}

const defaultItems: NavigationItem[] = [
  {
    name: "Random palette",
    href: "/",
  },
  {
    name: "Saved palettes",
    href: "/saved-palettes",
  },
  {
    name: "Popular palettes",
    href: "/popular-palettes",
  }
] 