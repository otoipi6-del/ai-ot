'use client'

import { useState, useEffect } from 'react'
import { BookOpen, FileText, Search, RefreshCw, Database, Building2, Tag, Trash2 } from 'lucide-react'
import { getDocuments, getKnowledgeBaseStats } from '@/lib/supabase'
import { deleteDocument } from '@/lib/document-processor'
import { Document } from '@/lib/types'

export default function KnowledgeBase() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [stats, setStats] = useState({ totalDocuments: 0, totalChunks: 0, categories: [] as string[], authorities: [] as string[] })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [docs, statsData] = await Promise.all([getDocuments(), getKnowledgeBaseStats()])
      setDocuments(docs)
      setStats(statsData)
    } catch (error) { console.error('Error:', error) }
    finally { setIsLoading(false) }
  }

  const handleDelete = async (docId: string) => {
    if (!confirm('Удалить документ?')) return
    if (await deleteDocument(docId)) loadData()
  }

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = !searchQuery || doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || doc.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || doc.document_type === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><FileText className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p><p className="text-sm text-gray-500">Документов</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><Database className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{stats.totalChunks}</p><p className="text-sm text-gray-500">Фрагментов</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><Tag className="w-5 h-5 text-purple-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{stats.categories.length}</p><p className="text-sm text-gray-500">Категорий</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center"><Building2 className="w-5 h-5 text-orange-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{stats.authorities.length}</p><p className="text-sm text-gray-500">Органов</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Поиск по документам..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="">Все категории</option>
            {stats.categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <button onClick={loadData} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Обновить</button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12"><RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" /><p className="text-gray-500">Загрузка...</p></div>
      ) : (
        <div className="space-y-3">
          {filteredDocs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200"><BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">Документы не найдены</p></div>
          ) : (
            filteredDocs.map(doc => (
              <div key={doc.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedDoc(selectedDoc?.id === doc.id ? null : doc)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{doc.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {doc.document_type && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{doc.document_type}</span>}
                      {doc.authority && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{doc.authority}</span>}
                    </div>
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{doc.content.substring(0, 200)}...</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(doc.id) }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2"><Trash2 className="w-4 h-4" /></button>
                </div>
                {selectedDoc?.id === doc.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">{doc.content}</div>
                    {doc.source_url && <p className="text-xs text-gray-400 mt-4">Источник: {doc.source_url}</p>}
                    {doc.effective_date && <p className="text-xs text-gray-400">Действует с: {new Date(doc.effective_date).toLocaleDateString('ru-RU')}</p>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
