'use client'

import { useState } from 'react'
import { Shield, Upload, Database } from 'lucide-react'
import DocumentUploader from '@/components/DocumentUploader'
import SearchPanel from '@/components/SearchPanel'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'search'>('upload')

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Админ-панель
        </h1>
        <p className="text-gray-500 mt-1">Управление базой знаний</p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button onClick={() => setActiveTab('upload')} className={`px-4 py-2 flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'upload' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <Upload className="w-4 h-4" /> Загрузка
        </button>
        <button onClick={() => setActiveTab('search')} className={`px-4 py-2 flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'search' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <Database className="w-4 h-4" /> Поиск
        </button>
      </div>

      {activeTab === 'upload' && <DocumentUploader />}
      {activeTab === 'search' && <SearchPanel />}
    </div>
  )
}
