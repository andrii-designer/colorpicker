import React from 'react'
import { cn } from '../../../lib/utils'
import Image from 'next/image'

interface ChatMessage {
  id: string
  text: string
  score?: number
  icon?: React.ReactNode
}

interface ChatPanelProps {
  className?: string
  messages: ChatMessage[]
  onAskForAdvice: () => void
  onGeneratePalette?: () => void
  onUndo?: () => void
  onRedo?: () => void
}

export function ChatPanel({ className, messages, onAskForAdvice, onGeneratePalette, onUndo, onRedo }: ChatPanelProps) {
  return (
    <div className={cn("flex flex-col h-full bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden", className)}>
      <div className="p-4 border-b border-[#E5E5E5] flex justify-between items-center">
        <h3 className="font-medium text-base">Color Palette Assistant</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length > 0 ? (
          messages.map((message) => (
            <div
              key={message.id}
              className="bg-[#F5F5F5] p-4 rounded-xl"
            >
              <div className="flex items-center mb-2">
                {message.icon && <span className="mr-2">{message.icon}</span>}
                {message.score !== undefined && (
                  <div className="ml-auto flex items-center">
                    <span className="text-sm font-medium mr-1" style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      fontWeight: 500
                    }}>Rating:</span>
                    <span className={getScoreColorClass(message.score)} style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      fontWeight: 600
                    }}>
                      {message.score}/10
                    </span>
                  </div>
                )}
              </div>
              <p className="text-black text-sm" style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '1.5'
              }}>{message.text}</p>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-[#888888]">
            <p className="text-sm" style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 400
            }}>Ask Bobby for advice about your color palette</p>
          </div>
        )}
      </div>
      
      <div className="px-4 pb-4 flex flex-col gap-2 mt-auto">
        <button
          onClick={onAskForAdvice}
          className="w-[306px] h-[48px] rounded-[999px] border border-black flex items-center justify-center mx-auto"
          style={{ 
            fontFamily: 'Inter', 
            fontSize: '16px', 
            fontWeight: 400,
            color: '#000'
          }}
        >
          Ask Bobby
        </button>
        
        <button
          onClick={onGeneratePalette}
          className="w-[306px] h-[48px] rounded-[999px] bg-black flex items-center justify-center mx-auto mt-2"
          style={{ 
            fontFamily: 'Inter', 
            fontSize: '16px', 
            fontWeight: 400,
            color: '#FFF'
          }}
        >
          Generate Palette
        </button>
      </div>
    </div>
  )
}

function getScoreColorClass(score: number): string {
  if (score >= 8) return 'text-green-600';
  if (score >= 6) return 'text-blue-500';
  if (score >= 4) return 'text-yellow-500';
  return 'text-red-500';
} 