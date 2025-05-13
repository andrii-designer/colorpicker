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
    <nav className={cn("hidden md:flex items-center justify-center lg:gap-4 gap-2 lg:w-[460px] md:w-auto", className)}>
      {updatedItems.map((item) => {
        // Get display text based on screen size
        const displayText = item.name.replace(/\s+palette(s)?$/, '');
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center justify-center lg:px-6 md:px-3 py-2 rounded-full transition-colors whitespace-nowrap lg:w-[150px] md:w-auto",
              item.active ? "bg-black text-white" : "text-black hover:bg-gray-100"
            )}
          >
            <span className="text-base font-medium">
              <span className="lg:hidden md:inline">{displayText}</span>
              <span className="hidden lg:inline">{item.name}</span>
            </span>
          </Link>
        );
      })}
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