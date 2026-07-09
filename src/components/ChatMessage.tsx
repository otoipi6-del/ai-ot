'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Download, Check, BookOpen, ChevronDown, ChevronUp, Brain, Loader2 } from 'lucide-react';
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
      <div className="flex justify-start">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm max-w-[90%] md:max-w-[80%]">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
            <span className="text-sm text-gray-600">Анализирую нормативную базу...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`rounded-lg p-4 max-w-[90%] md:max-w-[80%] ${
          role === 'user'
            ? 'bg-primary-600 text-white'
            : 'bg-white border border-gray-200 shadow-sm'
        }`}
      >
        {role === 'assistant' && (
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-primary-600" />
            <span className="text-xs font-medium text-gray-500">
              AI-OT {provider && `• ${provider}`}
            </span>
          </div>
        )}

        <div className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>

        {role === 'assistant' && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={handleCopy}
              className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors"
              title="Копировать"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors"
              title="Скачать"
            >
              <Download className="w-4 h-4" />
            </button>

            {sources && sources.length > 0 && (
              <button
                onClick={() => setShowSources(!showSources)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600 transition-colors ml-auto"
              >
                <BookOpen className="w-3 h-3" />
                {sources.length} источник{sources.length > 1 ? 'а' : ''}
                {showSources ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            )}
          </div>
        )}

        {showSources && sources && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-500 mb-2">Источники:</p>
            <ul className="space-y-1">
              {sources.map((source, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                  <span className="text-primary-500 mt-0.5">•</span>
                  {source}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
