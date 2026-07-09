'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, Loader2, Check, X } from 'lucide-react';

interface UploadResult {
  success: boolean;
  documentId?: string;
  title?: string;
  error?: string;
}

export function DocumentUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState('other');
  const [authority, setAuthority] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      if (!title) setTitle(droppedFile.name.replace(/\.[^/.]+$/, ''));
    }
  }, [title]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title || file.name);
    formData.append('documentType', documentType);
    if (authority) formData.append('authority', authority);

    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        setFile(null);
        setTitle('');
        setAuthority('');
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 text-primary-600" />
        Загрузка документа
      </h3>

      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
        }`}
      >
        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 mb-2">
          Перетащите файл сюда или{' '}
          <label className="text-primary-600 cursor-pointer hover:underline">
            выберите файл
            <input
              type="file"
              className="hidden"
              accept=".pdf,.docx,.xlsx,.txt"
              onChange={handleFileSelect}
            />
          </label>
        </p>
        <p className="text-xs text-gray-400">PDF, DOCX, XLSX, TXT</p>

        {file && (
          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-700">
            <FileText className="w-4 h-4" />
            {file.name}
            <button
              onClick={() => setFile(null)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {file && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название документа
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Введите название..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тип документа
            </label>
            <select
              value={documentType}
              onChange={e => setDocumentType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="law">Закон / Кодекс</option>
              <option value="regulation">Постановление / Приказ / Инструкция</option>
              <option value="explanation">Разъяснение / Письмо / Методические указания</option>
              <option value="standard">Стандарт / ГОСТ / СанПиН</option>
              <option value="other">Другое</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Выдавший орган
            </label>
            <input
              type="text"
              value={authority}
              onChange={e => setAuthority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Например: Министерство труда..."
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Загрузка...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Загрузить документ
              </>
            )}
          </button>
        </div>
      )}

      {result && (
        <div className={`mt-4 p-3 rounded-lg ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          <div className="flex items-center gap-2">
            {result.success ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            <span className="text-sm">
              {result.success
                ? `Документ "${result.title}" успешно загружен`
                : result.error}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
