'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState } from 'react';

interface ChatMessageProps {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  provider?: string;
  isLoading?: boolean;
  onCopy?: (text: string) => void;
  onDownload?: (content: string, sources?: string[]) => void;
}

export function ChatMessage({
  id,
  role,
  content,
  sources,
  provider,
  isLoading,
  onCopy,
  onDownload,
}: ChatMessageProps) {
  const [showSources, setShowSources] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    onCopy?.(content);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    onDownload?.(content, sources);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem', maxWidth: '80%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Анализирую нормативную базу...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: role === 'user' ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '80%',
        padding: '1rem',
        borderRadius: '0.5rem',
        backgroundColor: role === 'user' ? '#0284c7' : 'white',
        color: role === 'user' ? 'white' : '#111827',
        border: role === 'user' ? 'none' : '1px solid #e5e7eb',
      }}>
        {role === 'assistant' && (
          <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
            AI-OT {provider && `• ${provider}`}
          </div>
        )}

        <div className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>

        {role === 'assistant' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb' }}>
            <button onClick={handleCopy} style={{ fontSize: '0.75rem', color: '#6b7280', border: 'none', background: 'none', cursor: 'pointer' }}>
              {copied ? 'Скопировано!' : 'Копировать'}
            </button>
            <button onClick={handleDownload} style={{ fontSize: '0.75rem', color: '#6b7280', border: 'none', background: 'none', cursor: 'pointer' }}>
              Скачать
            </button>

            {sources && sources.length > 0 && (
              <button onClick={() => setShowSources(!showSources)} style={{ fontSize: '0.75rem', color: '#6b7280', border: 'none', background: 'none', cursor: 'pointer', marginLeft: 'auto' }}>
                {sources.length} источник{sources.length > 1 ? 'а' : ''}
              </button>
            )}
          </div>
        )}

        {showSources && sources && (
          <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', marginBottom: '0.5rem' }}>Источники:</p>
            <ul style={{ fontSize: '0.75rem', color: '#4b5563', paddingLeft: '1rem' }}>
              {sources.map((source, i) => (
                <li key={i}>{source}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
