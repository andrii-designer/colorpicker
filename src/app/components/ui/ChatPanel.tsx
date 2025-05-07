import React, { useEffect, useRef } from 'react'
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  return (
    <div 
      className={cn("relative h-full", className)}
      style={{ overflow: 'hidden', border: 'none', background: 'transparent' }}
    >
      {/* Fixed position message container */}
      <div 
        className="absolute top-0 left-0 right-0 bottom-[124px] overflow-hidden"
        style={{ border: 'none' }}
      >
        <div 
          className="h-full overflow-y-auto pl-4 pb-4 pr-4" 
          style={{ 
            border: 'none', 
            scrollbarWidth: 'thin',
            scrollbarColor: '#E0E0E0 transparent'
          }}
        >
          {messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((message, index) => (
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
              ))}
              <div ref={messagesEndRef} className="h-1" />
            </div>
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
      </div>
      
      {/* Fixed position button container */}
      <div className="absolute left-0 right-0 bottom-0 h-[124px] pt-4 px-4" style={{ border: 'none', background: 'transparent' }}>
        <button
          onClick={onAskForAdvice}
          className="w-full h-[48px] rounded-[999px] border border-black flex items-center justify-center mb-2"
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
          className="w-full h-[48px] rounded-[999px] bg-black flex items-center justify-center"
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