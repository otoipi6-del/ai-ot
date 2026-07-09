'use client';

import { useState, useCallback } from 'react';

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
    <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1rem' }}>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Загрузка документа</h3>

      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragOver ? '#0284c7' : '#d1d5db'}`,
          borderRadius: '0.5rem',
          padding: '1.5rem',
          textAlign: 'center',
          backgroundColor: dragOver ? '#f0f9ff' : 'transparent',
        }}
      >
        <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.5rem' }}>
          Перетащите файл сюда или{' '}
          <label style={{ color: '#0284c7', cursor: 'pointer', textDecoration: 'underline' }}>
            выберите файл
            <input type="file" style={{ display: 'none' }} accept=".pdf,.docx,.xlsx,.txt" onChange={handleFileSelect} />
          </label>
        </p>
        <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>PDF, DOCX, XLSX, TXT</p>

        {file && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#374151' }}>
            {file.name}
            <button onClick={() => setFile(null)} style={{ marginLeft: '0.5rem', color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
          </div>
        )}
      </div>

      {file && (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Название документа</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Введите название..."
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Тип документа</label>
            <select
              value={documentType}
              onChange={e => setDocumentType(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
            >
              <option value="law">Закон / Кодекс</option>
              <option value="regulation">Постановление / Приказ / Инструкция</option>
              <option value="explanation">Разъяснение / Письмо / Методические указания</option>
              <option value="standard">Стандарт / ГОСТ / СанПиН</option>
              <option value="other">Другое</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Выдавший орган</label>
            <input
              type="text"
              value={authority}
              onChange={e => setAuthority(e.target.value)}
              placeholder="Например: Министерство труда..."
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={isUploading}
            style={{ width: '100%', padding: '0.5rem', backgroundColor: '#0284c7', color: 'white', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', opacity: isUploading ? 0.5 : 1 }}
          >
            {isUploading ? 'Загрузка...' : 'Загрузить документ'}
          </button>
        </div>
      )}

      {result && (
        <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '0.375rem', backgroundColor: result.success ? '#f0fdf4' : '#fef2f2', color: result.success ? '#166534' : '#991b1b' }}>
          {result.success
            ? `Документ "${result.title}" успешно загружен`
            : result.error}
        </div>
      )}
    </div>
  );
}
