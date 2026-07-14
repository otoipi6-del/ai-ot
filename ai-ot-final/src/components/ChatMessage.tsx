'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Download, Bot, User } from 'lucide-react'
import { copyToClipboard, downloadFile } from '@/lib/utils'

interface ChatMessageProps {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: any[]
  modelUsed?: string
  timestamp: Date
}

export default function ChatMessage({ role, content, sources, modelUsed, timestamp }: ChatMessageProps) {
  const handleCopy = () => {
    copyToClipboard(content)
  }

  const handleDownload = () => {
    const text = `${content}

---
Модель: ${modelUsed || 'Неизвестно'}
Дата: ${timestamp.toLocaleString('ru-RU')}`
    downloadFile(text, `ответ-${Date.now()}.txt`)
  }

  return (
    <div className={`flex gap-3 ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {role === 'assistant' && (
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}

      <div className={`max-w-[80%] ${role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'} rounded-2xl px-4 py-3 shadow-sm`}>
        {role === 'assistant' ? (
          <div className="markdown-body text-gray-800">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-white">{content}</p>
        )}

        {role === 'assistant' && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
            <button onClick={handleCopy} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Копировать">
              <Copy className="w-4 h-4" />
            </button>
            <button onClick={handleDownload} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors" title="Скачать">
              <Download className="w-4 h-4" />
            </button>
            {modelUsed && <span className="text-xs text-gray-400 ml-auto">{modelUsed}</span>}
          </div>
        )}

        {sources && sources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-1">Источники:</p>
            <div className="space-y-1">
              {sources.map((source: any, idx: number) => (
                <div key={idx} className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                  <span className="font-medium">{source.title}</span>
                  {source.authority && <span className="text-gray-400 ml-1">({source.authority})</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {role === 'user' && (
        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  )
}
