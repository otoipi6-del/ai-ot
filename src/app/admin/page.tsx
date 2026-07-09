'use client';

import { useState, useEffect } from 'react';
import { SearchPanel } from '@/components/SearchPanel';
import { DocumentUploader } from '@/components/DocumentUploader';

interface Stats {
  totalDocuments: number;
  totalChunks: number;
  totalMessages: number;
  totalSessions: number;
}

interface SyncStatus {
  lastSync: string | null;
  isSyncing: boolean;
  result: {
    added: number;
    updated: number;
    removed: number;
    errors: string[];
  } | null;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({
    totalDocuments: 0,
    totalChunks: 0,
    totalMessages: 0,
    totalSessions: 0,
  });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: null,
    isSyncing: false,
    result: null,
  });
  const [activeTab, setActiveTab] = useState<'search' | 'upload' | 'stats'>('search');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setStats({
        totalDocuments: 156,
        totalChunks: 3247,
        totalMessages: 892,
        totalSessions: 234,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleSync = async () => {
    setSyncStatus(prev => ({ ...prev, isSyncing: true, result: null }));

    try {
      const response = await fetch('/api/ingest', {
        method: 'PUT',
      });

      const data = await response.json();

      setSyncStatus({
        lastSync: new Date().toISOString(),
        isSyncing: false,
        result: data.success ? data : null,
      });
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        result: {
          added: 0,
          updated: 0,
          removed: 0,
          errors: [error instanceof Error ? error.message : 'Sync failed'],
        },
      }));
    }
  };

  const tabs = [
    { id: 'search' as const, label: 'Поиск' },
    { id: 'upload' as const, label: 'Загрузка' },
    { id: 'stats' as const, label: 'Статистика' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>Панель управления AI-OT</h1>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Управление базой знаний и мониторинг системы</p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncStatus.isSyncing}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#0284c7', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', opacity: syncStatus.isSyncing ? 0.5 : 1 }}
          >
            {syncStatus.isSyncing ? 'Синхронизация...' : 'Синхронизировать Google Drive'}
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>{stats.totalDocuments}</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Документов</div>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>{stats.totalChunks}</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Чанков в базе</div>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>{stats.totalMessages}</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Сообщений</div>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>{stats.totalSessions}</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Сессий</div>
          </div>
        </div>

        {/* Sync Status */}
        {syncStatus.result && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', borderRadius: '0.5rem', backgroundColor: syncStatus.result.errors.length === 0 ? '#f0fdf4' : '#fefce8', border: `1px solid ${syncStatus.result.errors.length === 0 ? '#bbf7d0' : '#fde047'}` }}>
            <div style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
              {syncStatus.result.errors.length === 0 ? 'Синхронизация завершена' : 'Синхронизация завершена с ошибками'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.875rem' }}>
              <div>Добавлено: <span style={{ fontWeight: 500 }}>{syncStatus.result.added}</span></div>
              <div>Обновлено: <span style={{ fontWeight: 500 }}>{syncStatus.result.updated}</span></div>
              <div>Удалено: <span style={{ fontWeight: 500 }}>{syncStatus.result.removed}</span></div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #0284c7' : '2px solid transparent',
                  color: activeTab === tab.id ? '#0284c7' : '#6b7280',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: '1.5rem' }}>
            {activeTab === 'search' && <SearchPanel />}
            {activeTab === 'upload' && <DocumentUploader />}
            {activeTab === 'stats' && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                Статистика использования будет доступна в следующей версии
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
