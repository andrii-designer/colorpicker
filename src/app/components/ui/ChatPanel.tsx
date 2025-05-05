import React from 'react'
import { cn } from '../../../lib/utils'
import { FiMessageSquare } from 'react-icons/fi'

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
}

export function ChatPanel({ className, messages, onAskForAdvice }: ChatPanelProps) {
  return (
    <div className={cn("flex flex-col h-full bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden", className)}>
      <div className="p-4 border-b border-[#E5E5E5]">
        <h2 className="text-lg font-medium flex items-center" style={{ 
          fontFamily: 'Inter, sans-serif',
          fontSize: '18px',
          fontWeight: 600
        }}>
          <FiMessageSquare className="mr-2 text-black" />
          Chat with Bobby
        </h2>
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
                    }}>Score:</span>
                    <span className={getScoreColorClass(message.score)} style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      fontWeight: 600
                    }}>
                      {message.score.toFixed(1)}
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
            <FiMessageSquare className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm" style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 400
            }}>Ask Bobby for advice about your color palette</p>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-[#E5E5E5]">
        <button
          onClick={onAskForAdvice}
          className="w-full flex items-center justify-center px-4 py-2 rounded-full bg-black text-white hover:bg-gray-900 transition-colors"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500 }}
        >
          <FiMessageSquare className="mr-2 h-4 w-4" />
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