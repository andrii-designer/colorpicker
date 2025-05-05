import React from 'react'
import { Button } from './Button'
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
    <div className={cn("flex flex-col h-full bg-neutral-50 rounded-lg border border-neutral-200 shadow-sm overflow-hidden", className)}>
      <div className="p-4 border-b border-neutral-200 bg-white">
        <h2 className="text-lg font-medium flex items-center">
          <FiMessageSquare className="mr-2 text-primary-500" />
          Chat with Bobby
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length > 0 ? (
          messages.map((message) => (
            <div
              key={message.id}
              className="bg-white p-4 rounded-lg shadow-sm border border-neutral-200"
            >
              <div className="flex items-center mb-2">
                {message.icon && <span className="mr-2">{message.icon}</span>}
                {message.score !== undefined && (
                  <div className="ml-auto flex items-center">
                    <span className="text-sm font-medium mr-1">Score:</span>
                    <span className={getScoreColorClass(message.score)}>
                      {message.score.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-neutral-700 text-sm">{message.text}</p>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-neutral-500">
            <FiMessageSquare className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm">Ask Bobby for advice about your color palette</p>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-neutral-200 bg-white">
        <Button
          variant="default"
          size="default"
          className="w-full"
          onClick={onAskForAdvice}
        >
          <FiMessageSquare className="mr-2" />
          Ask Bobby
        </Button>
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