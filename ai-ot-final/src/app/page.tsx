'use client'

import { useState } from 'react'
import ChatInterface from '@/components/ChatInterface'
import KnowledgeBase from '@/components/KnowledgeBase'
import ApiKeyManager from '@/components/ApiKeyManager'
import Navigation from '@/components/Navigation'

type Page = 'chat' | 'knowledge' | 'apikeys'

export default function Home() {
  const [currentPage, setCurrentPage] = useState<Page>('chat')

  return (
    <div className="flex h-screen bg-gray-50">
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />

      <main className="flex-1 overflow-hidden">
        {currentPage === 'chat' && <ChatInterface />}
        {currentPage === 'knowledge' && <KnowledgeBase />}
        {currentPage === 'apikeys' && <ApiKeyManager />}
      </main>
    </div>
  )
}
