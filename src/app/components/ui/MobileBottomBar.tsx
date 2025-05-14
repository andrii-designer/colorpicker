'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface MobileBottomBarProps {
  onGenerate?: () => void;
  onSave?: () => void;
  onCopy?: () => void;
  onShare?: () => void;
  className?: string;
}

export function MobileBottomBar({
  onGenerate,
  onSave,
  onCopy,
  onShare,
  className,
}: MobileBottomBarProps) {
  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg pb-safe z-50 ${className}`}
      style={{
        paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
      }}
    >
      <div className="flex items-center justify-around px-2 py-3">
        <button
          onClick={onGenerate}
          className="flex flex-col items-center justify-center p-2 text-gray-800 hover:text-black focus:outline-none"
          aria-label="Generate"
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
            <path d="M23 4v6h-6" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          <span className="text-xs mt-1">Generate</span>
        </button>

        <button
          onClick={onSave}
          className="flex flex-col items-center justify-center p-2 text-gray-800 hover:text-black focus:outline-none"
          aria-label="Save"
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
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          <span className="text-xs mt-1">Save</span>
        </button>

        <button
          onClick={onCopy}
          className="flex flex-col items-center justify-center p-2 text-gray-800 hover:text-black focus:outline-none"
          aria-label="Copy"
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
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <span className="text-xs mt-1">Copy</span>
        </button>

        <button
          onClick={onShare}
          className="flex flex-col items-center justify-center p-2 text-gray-800 hover:text-black focus:outline-none"
          aria-label="Share"
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
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span className="text-xs mt-1">Share</span>
        </button>
      </div>
    </motion.div>
  );
} 