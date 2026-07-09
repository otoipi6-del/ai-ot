'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  provider?: string;
  isLoading?: boolean;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showSources, setShowSources] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const loadingId = (Date.now() + 1).toString();
    setMessages(prev => [
      ...prev,
      { id: loadingId, role: 'assistant', content: '', isLoading: true },
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId,
          useWebSearch: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      setMessages(prev =>
        prev.map(m =>
          m.id === loadingId
            ? {
                id: loadingId,
                role: 'assistant',
                content: data.response,
                sources: data.sources,
                provider: data.provider,
              }
            : m
        )
      );

      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }
    } catch (error) {
      setMessages(prev =>
        prev.map(m =>
          m.id === loadingId
            ? {
                id: loadingId,
                role: 'assistant',
                content: `Ошибка: ${error instanceof Error ? error.message : 'Не удалось получить ответ'}`,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadResponse = (message: Message) => {
    const userMsg = messages.find(m => m.id === String(Number(message.id) - 1));
    const blob = new Blob(
      [
        `Вопрос: ${userMsg?.content || ''}\n\n`,
        `Ответ:\n${message.content}\n\n`,
        message.sources ? `Источники:\n${message.sources.join('\n')}` : '',
      ],
      { type: 'text/plain;charset=utf-8' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ответ-охрана-труда-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(null);
  };

  const toggleSources = (id: string) => {
    setShowSources(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Sidebar */}
      <aside style={{ width: '16rem', backgroundColor: 'white', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827' }}>AI-OT</h1>
          <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Эксперт по охране труда РБ</p>
        </div>
        <button onClick={clearChat} style={{ padding: '0.5rem', textAlign: 'left', borderRadius: '0.375rem', border: 'none', background: 'none', cursor: 'pointer', color: '#374151' }}>
          + Новый чат
        </button>
        <div style={{ flex: 1, overflowY: 'auto', marginTop: '1rem' }}>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.5rem' }}>Примеры вопросов:</p>
          {[
            'Какие СИЗ положены электромонтёру?',
            'Порядок расследования несчастного случая',
            'Обучение по охране труда: сроки',
            'Аттестация рабочих мест',
            'Ответственность за нарушения',
          ].map((q, i) => (
            <button key={i} onClick={() => { setInput(q); textareaRef.current?.focus(); }}
              style={{ width: '100%', textAlign: 'left', padding: '0.5rem', fontSize: '0.875rem', color: '#4b5563', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '0.375rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {q}
            </button>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', color: '#111827' }}>AI-OT</span>
          {messages.length > 0 && (
            <button onClick={clearChat} style={{ color: '#9ca3af', border: 'none', background: 'none', cursor: 'pointer' }}>Очистить</button>
          )}
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {messages.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>AI-ассистент по охране труда</h2>
              <p style={{ color: '#6b7280', maxWidth: '28rem' }}>Задайте вопрос по охране труда в Республике Беларусь</p>
            </div>
          )}

          {messages.map(message => (
            <div key={message.id} style={{ display: 'flex', justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '1rem' }}>
              <div style={{ maxWidth: '80%', padding: '1rem', borderRadius: '0.5rem', backgroundColor: message.role === 'user' ? '#0284c7' : 'white', color: message.role === 'user' ? 'white' : '#111827', border: message.role === 'user' ? 'none' : '1px solid #e5e7eb' }}>
                {message.isLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem' }}>Анализирую...</span>
                  </div>
                ) : (
                  <>
                    {message.role === 'assistant' && (
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                        AI-OT {message.provider && `• ${message.provider}`}
                      </div>
                    )}
                    <div className="markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    {message.role === 'assistant' && (
                      <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button onClick={() => copyToClipboard(message.content, message.id)} style={{ fontSize: '0.75rem', color: '#6b7280', border: 'none', background: 'none', cursor: 'pointer' }}>
                          {copiedId === message.id ? 'Скопировано!' : 'Копировать'}
                        </button>
                        <button onClick={() => downloadResponse(message)} style={{ fontSize: '0.75rem', color: '#6b7280', border: 'none', background: 'none', cursor: 'pointer' }}>
                          Скачать
                        </button>
                        {message.sources && message.sources.length > 0 && (
                          <button onClick={() => toggleSources(message.id)} style={{ fontSize: '0.75rem', color: '#6b7280', border: 'none', background: 'none', cursor: 'pointer', marginLeft: 'auto' }}>
                            {message.sources.length} источник{message.sources.length > 1 ? 'а' : ''}
                          </button>
                        )}
                      </div>
                    )}
                    {showSources[message.id] && message.sources && (
                      <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>Источники:</p>
                        <ul style={{ fontSize: '0.75rem', color: '#4b5563', paddingLeft: '1rem' }}>
                          {message.sources.map((source, i) => (
                            <li key={i}>{source}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ backgroundColor: 'white', borderTop: '1px solid #e5e7eb', padding: '1rem' }}>
          <form onSubmit={handleSubmit} style={{ maxWidth: '48rem', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem', padding: '0.5rem' }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                placeholder="Задайте вопрос по охране труда..."
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontSize: '0.875rem', maxHeight: '8rem', padding: '0.5rem' }}
                rows={1}
                disabled={isLoading}
              />
              <button type="submit" disabled={isLoading || !input.trim()}
                style={{ padding: '0.5rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', opacity: isLoading || !input.trim() ? 0.5 : 1 }}>
                {isLoading ? '...' : '→'}
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center', marginTop: '0.5rem' }}>Enter для отправки, Shift+Enter для новой строки</p>
          </form>
        </div>
      </main>
    </div>
  );
}
