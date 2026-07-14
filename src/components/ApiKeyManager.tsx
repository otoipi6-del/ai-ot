'use client'

import { useState, useEffect } from 'react'
import { Key, Eye, EyeOff, Save, Check, AlertTriangle } from 'lucide-react'

const API_KEYS = [
  { name: 'Supabase URL', envKey: 'NEXT_PUBLIC_SUPABASE_URL', description: 'URL вашего проекта Supabase', required: true },
  { name: 'Supabase Anon Key', envKey: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', description: 'Публичный ключ Supabase', required: true },
  { name: 'Groq API Key', envKey: 'GROQ_API_KEY', description: 'Ключ для Groq (бесплатный тир)', required: false },
  { name: 'DeepSeek API Key', envKey: 'DEEPSEEK_API_KEY', description: 'Ключ для DeepSeek API', required: false },
  { name: 'OpenRouter API Key', envKey: 'OPENROUTER_API_KEY', description: 'Ключ для OpenRouter', required: false },
  { name: 'OpenAI API Key', envKey: 'OPENAI_API_KEY', description: 'Ключ OpenAI (для эмбеддингов)', required: false },
]

export default function ApiKeyManager() {
  const [keys, setKeys] = useState<Record<string, string>>({})
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const loaded: Record<string, string> = {}
    API_KEYS.forEach(config => {
      const value = localStorage.getItem(config.envKey)
      if (value) loaded[config.envKey] = value
    })
    setKeys(loaded)
  }, [])

  const handleSave = (envKey: string) => {
    const value = keys[envKey]
    if (value) {
      localStorage.setItem(envKey, value)
      setSaved(prev => ({ ...prev, [envKey]: true }))
      setTimeout(() => setSaved(prev => ({ ...prev, [envKey]: false })), 2000)
    }
  }

  const toggleShow = (envKey: string) => {
    setShowKeys(prev => ({ ...prev, [envKey]: !prev[envKey] }))
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Key className="w-6 h-6" />
          Настройка API ключей
        </h2>
        <p className="text-gray-500 mt-1">
          Введите ключи API для подключения к AI-моделям. Ключи хранятся локально в браузере.
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-yellow-800 font-medium">Важно!</p>
          <p className="text-sm text-yellow-700 mt-1">
            Для деплоя добавьте ключи в GitHub Secrets (Settings → Secrets → Actions).
            Локальные ключи работают только в вашем браузере.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {API_KEYS.map(config => (
          <div key={config.envKey} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div>
                <label className="font-medium text-gray-900 flex items-center gap-2">
                  {config.name}
                  {config.required && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Обязательный</span>
                  )}
                </label>
                <p className="text-sm text-gray-500 mt-0.5">{config.description}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type={showKeys[config.envKey] ? 'text' : 'password'}
                  value={keys[config.envKey] || ''}
                  onChange={(e) => setKeys(prev => ({ ...prev, [config.envKey]: e.target.value }))}
                  placeholder={`Введите ${config.name}...`}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => toggleShow(config.envKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKeys[config.envKey] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={() => handleSave(config.envKey)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  saved[config.envKey] ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {saved[config.envKey] ? <><Check className="w-4 h-4" /> Сохранено</> : <><Save className="w-4 h-4" /> Сохранить</>}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-medium text-blue-900 mb-2">Где получить ключи?</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li><strong>Groq:</strong> console.groq.com/keys — бесплатный тир</li>
          <li><strong>DeepSeek:</strong> platform.deepseek.com</li>
          <li><strong>OpenRouter:</strong> openrouter.ai/keys</li>
          <li><strong>OpenAI:</strong> platform.openai.com/api-keys</li>
        </ul>
      </div>
    </div>
  )
}
