'use client';

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '../../lib/utils'

interface NavigationItem {
  name: string
  href: string
  active?: boolean
}

interface MobileNavigationProps {
  className?: string
  items?: NavigationItem[]
}

export function MobileNavigation({ className, items = defaultItems }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  
  // Update active state based on current path
  const updatedItems = items.map(item => ({
    ...item,
    active: pathname === item.href
  }));
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  
  return (
    <div className={cn("relative", className)}>
      {/* Burger button */}
      <button 
        className="p-2 text-black focus:outline-none" 
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          {isOpen ? (
            // X icon when menu is open
            <>
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </>
          ) : (
            // Burger icon when menu is closed
            <>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </>
          )}
        </svg>
      </button>
      
      {/* Mobile navigation menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
          {updatedItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "block px-4 py-2 text-sm transition-colors",
                item.active ? "bg-black text-white" : "text-black hover:bg-gray-100"
              )}
              onClick={() => setIsOpen(false)}
            >
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
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