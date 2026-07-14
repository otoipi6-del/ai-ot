'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Send, Copy, Download, Loader2, Bot, User, BookOpen, Globe, Settings, Trash2 } from 'lucide-react'
import { askQuestionClient } from '@/lib/api-client/chat-client'
import { AVAILABLE_MODELS } from '@/lib/ai-providers'
import { downloadFile, copyToClipboard } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: any[]
  modelUsed?: string
  timestamp: Date
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Здравствуйте! Я — AI-агент по охране труда Республики Беларусь.

Я могу помочь вам с:
• Толкованием нормативных актов
• Подготовкой документации
• Ответами на вопросы по охране труда
• Анализом рисков

Задайте ваш вопрос, и я найду актуальную информацию в нормативной базе.`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].name)
  const [showSettings, setShowSettings] = useState(false)
  const [useWebSearch, setUseWebSearch] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const chatHistory = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content,
      }))

      const response = await askQuestionClient(userMessage.content, selectedModel, useWebSearch)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        sources: response.sources,
        modelUsed: response.model_used,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Произошла ошибка при обработке запроса. Пожалуйста, попробуйте позже.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleDownload = (message: Message) => {
    const content = `${message.content}

---
Источники:
${message.sources?.map((s: any) => `- ${s.title} (${s.authority || 'База знаний'})`).join('
') || 'Не указаны'}

Модель: ${message.modelUsed || 'Неизвестно'}
Дата: ${message.timestamp.toLocaleString('ru-RU')}`
    downloadFile(content, `ответ-ai-ot-${Date.now()}.txt`)
  }

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Здравствуйте! Я — AI-агент по охране труда Республики Беларусь.

Я могу помочь вам с:
• Толкованием нормативных актов
• Подготовкой документации
• Ответами на вопросы по охране труда
• Анализом рисков

Задайте ваш вопрос, и я найду актуальную информацию в нормативной базе.`,
        timestamp: new Date(),
      },
    ])
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">AI-OT</h1>
            <p className="text-xs text-gray-500">Агент по охране труда РБ</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={clearChat} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Очистить чат">
            <Trash2 className="w-5 h-5" />
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-lg transition-colors ${showSettings ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'}`} title="Настройки">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Модель AI</label>
            <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
              {AVAILABLE_MODELS.map(model => (
                <option key={model.name} value={model.name}>{model.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="webSearch" checked={useWebSearch} onChange={(e) => setUseWebSearch(e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
            <label htmlFor="webSearch" className="text-sm text-gray-700 flex items-center gap-1">
              <Globe className="w-4 h-4" />
              Искать в интернете при недостатке данных
            </label>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'assistant' && (
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}

            <div className={`max-w-[80%] ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'} rounded-2xl px-4 py-3 shadow-sm`}>
              {message.role === 'assistant' ? (
                <div className="markdown-body text-gray-800">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-white">{message.content}</p>
              )}

              {message.role === 'assistant' && message.id !== 'welcome' && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                  <button onClick={() => copyToClipboard(message.content)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Копировать">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDownload(message)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors" title="Скачать">
                    <Download className="w-4 h-4" />
                  </button>
                  {message.sources && message.sources.length > 0 && (
                    <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto">
                      <BookOpen className="w-3 h-3" />
                      {message.sources.length} источников
                    </span>
                  )}
                  {message.modelUsed && <span className="text-xs text-gray-400">{message.modelUsed}</span>}
                </div>
              )}

              {message.sources && message.sources.length > 0 && message.id !== 'welcome' && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-1">Источники:</p>
                  <div className="space-y-1">
                    {message.sources.map((source: any, idx: number) => (
                      <div key={idx} className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                        <span className="font-medium">{source.title}</span>
                        {source.authority && <span className="text-gray-400 ml-1">({source.authority})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {message.role === 'user' && (
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
              <p className="text-gray-500 text-sm">Ищу информацию в нормативной базе...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Задайте вопрос по охране труда..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm max-h-32"
            rows={1}
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !input.trim()} className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-2 text-center">
          AI-агент может допускать ошибки. Проверяйте важную информацию в официальных источниках.
        </p>
      </div>
    </div>
  )
}
