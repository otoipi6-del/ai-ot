'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, X, Check, Loader2 } from 'lucide-react'
import { processTextDocument } from '@/lib/document-processor'
import { DOCUMENT_CATEGORIES, AUTHORITIES } from '@/lib/constants'

export default function DocumentUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('other')
  const [authority, setAuthority] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''))
      setError('')
      setUploaded(false)
    }
  }

  const handleUpload = async () => {
    if (!file || !title) {
      setError('Выберите файл и укажите название')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      const text = await file.text()
      const docId = await processTextDocument(title, text, {
        document_type: category,
        authority: authority || undefined,
      })

      if (docId) {
        setUploaded(true)
        setFile(null)
        setTitle('')
        setCategory('other')
        setAuthority('')
        if (fileInputRef.current) fileInputRef.current.value = ''
      } else {
        setError('Ошибка при загрузке документа')
      }
    } catch (err) {
      setError(`Ошибка: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5" />
        Загрузка документа
      </h2>

      <div className="space-y-4">
        {/* File input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Файл (.txt, .md, .html)</label>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.html,.json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 px-4 py-2 border border-gray-300 border-dashed rounded-lg text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {file ? file.name : 'Выберите файл...'}
            </button>
            {file && (
              <button onClick={() => { setFile(null); setTitle(''); if (fileInputRef.current) fileInputRef.current.value = '' }} className="p-2 text-gray-400 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Название документа</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Введите название..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {DOCUMENT_CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Authority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Орган власти</label>
          <select
            value={authority}
            onChange={(e) => setAuthority(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Не указан</option>
            {AUTHORITIES.map(auth => (
              <option key={auth} value={auth}>{auth}</option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* Success */}
        {uploaded && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <Check className="w-4 h-4" />
            Документ успешно загружен!
          </div>
        )}

        {/* Upload button */}
        <button
          onClick={handleUpload}
          disabled={isUploading || !file}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Загрузка...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Загрузить
            </>
          )}
        </button>
      </div>
    </div>
  )
}
