'use client';

import { useState, useEffect } from 'react';
import { SearchPanel } from '@/components/SearchPanel';
import { DocumentUploader } from '@/components/DocumentUploader';
import {
  Database,
  FileText,
  MessageSquare,
  RefreshCw,
  Loader2,
  Check,
  AlertTriangle,
  TrendingUp,
  Clock,
} from 'lucide-react';

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
      // These would be real API calls in production
      // For now, using mock data
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Панель управления AI-OT</h1>
            <p className="text-sm text-gray-500">Управление базой знаний и мониторинг системы</p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncStatus.isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {syncStatus.isSyncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Синхронизировать Google Drive
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
                <p className="text-sm text-gray-500">Документов</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Database className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalChunks}</p>
                <p className="text-sm text-gray-500">Чанков в базе</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
                <p className="text-sm text-gray-500">Сообщений</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
                <p className="text-sm text-gray-500">Сессий</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Status */}
        {syncStatus.result && (
          <div className={`mb-6 p-4 rounded-lg ${
            syncStatus.result.errors.length === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {syncStatus.result.errors.length === 0 ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              )}
              <span className="font-medium">
                {syncStatus.result.errors.length === 0 ? 'Синхронизация завершена' : 'Синхронизация завершена с ошибками'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>Добавлено: <span className="font-medium">{syncStatus.result.added}</span></div>
              <div>Обновлено: <span className="font-medium">{syncStatus.result.updated}</span></div>
              <div>Удалено: <span className="font-medium">{syncStatus.result.removed}</span></div>
            </div>
            {syncStatus.result.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-yellow-700">Ошибки:</p>
                <ul className="text-sm text-yellow-600 mt-1">
                  {syncStatus.result.errors.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}
            {syncStatus.lastSync && (
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Последняя синхронизация: {new Date(syncStatus.lastSync).toLocaleString('ru-RB')}
              </p>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex border-b border-gray-200">
            {[
              { id: 'search', label: 'Поиск', icon: Search },
              { id: 'upload', label: 'Загрузка', icon: FileText },
              { id: 'stats', label: 'Статистика', icon: TrendingUp },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'search' && <SearchPanel />}
            {activeTab === 'upload' && <DocumentUploader />}
            {activeTab === 'stats' && (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Статистика использования будет доступна в следующей версии</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
