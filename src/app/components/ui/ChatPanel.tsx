import React, { useEffect, useRef, useState } from 'react'
import { cn } from '../../../lib/utils'
import Image from 'next/image'
import BobbyIcon from '../../assets/bobby.svg'

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
  resetClickState?: boolean
  onResetHandled?: () => void
}

export function ChatPanel({ className, messages, onAskForAdvice, onGeneratePalette, onUndo, onRedo, resetClickState, onResetHandled }: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasClickedAskBobby, setHasClickedAskBobby] = useState(false);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Reset hasClickedAskBobby when messages are reset to just the initial message
  // This happens when a new palette is generated
  useEffect(() => {
    if (messages.length === 1) {
      setHasClickedAskBobby(false);
    }
  }, [messages.length]);
  
  // Reset state when resetClickState changes
  useEffect(() => {
    // Only reset hasClickedAskBobby when explicit true is passed
    // This prevents re-renders from boolean toggles
    if (resetClickState === true) {
      setHasClickedAskBobby(false);
      
      // Call the callback to reset the flag in the parent component
      if (onResetHandled) {
        onResetHandled();
      }
    }
  }, [resetClickState, onResetHandled]);
  
  // Handle click on Ask Bobby button
  const handleAskBobbyClick = () => {
    setHasClickedAskBobby(true);
    onAskForAdvice();
  };
  
  return (
    <div 
      className={cn("relative h-full", className)}
      style={{ overflow: 'hidden', border: 'none', background: 'transparent' }}
    >
      {/* Fixed position message container */}
      <div 
        className="absolute top-0 left-0 right-0 bottom-[64px] overflow-hidden"
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
          {messages.length > 1 || (messages.length === 1 && hasClickedAskBobby) ? (
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
              <div className="mb-4">
                <Image 
                  src={BobbyIcon} 
                  alt="Bobby" 
                  width={80} 
                  height={80} 
                />
              </div>
              <p className="text-sm" style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 400
              }}>Press Enter to generate palettes, or click Ask Bobby for advice</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Fixed position button container */}
      <div className="absolute left-0 right-0 bottom-0 h-[64px] pt-4 px-4" style={{ border: 'none', background: 'transparent' }}>
        <button
          onClick={handleAskBobbyClick}
          data-ask-bobby
          className="w-full h-[48px] rounded-[999px] bg-black flex items-center justify-center"
          style={{ 
            fontFamily: 'Inter', 
            fontSize: '16px', 
            fontWeight: 400,
            color: '#FFF'
          }}
        >
          Ask Bobby
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