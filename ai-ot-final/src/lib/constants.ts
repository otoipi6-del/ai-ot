// Константы приложения

export const APP_NAME = 'AI-OT'
export const APP_DESCRIPTION = 'AI Агент по охране труда Республики Беларусь'

// Категории документов
export const DOCUMENT_CATEGORIES = [
  { value: 'law', label: 'Законодательство' },
  { value: 'regulation', label: 'Нормативные акты' },
  { value: 'explanation', label: 'Разъяснения' },
  { value: 'standard', label: 'Стандарты' },
  { value: 'other', label: 'Прочее' },
] as const

// Органы власти
export const AUTHORITIES = [
  'Министерство труда и социальной защиты РБ',
  'Министерство здравоохранения РБ',
  'Центр гигиены и эпидемиологии',
  'Инспекция по труду',
  'Госпромнадзор',
  'Белэнерго',
  'Министерство строительства и архитектуры',
  'Пленум Верховного Суда РБ',
  'Другие',
] as const

// Типы документов
export const DOCUMENT_TYPES = [
  'Закон',
  'Кодекс',
  'Указ Президента',
  'Постановление',
  'Приказ',
  'Инструкция',
  'Правила',
  'Положение',
  'Методические рекомендации',
  'Разъяснение',
  'Другое',
] as const

// API провайдеры
export const AI_PROVIDERS = [
  { name: 'Groq', envKey: 'GROQ_API_KEY', url: 'https://console.groq.com/keys' },
  { name: 'DeepSeek', envKey: 'DEEPSEEK_API_KEY', url: 'https://platform.deepseek.com/' },
  { name: 'OpenRouter', envKey: 'OPENROUTER_API_KEY', url: 'https://openrouter.ai/keys' },
  { name: 'OpenAI', envKey: 'OPENAI_API_KEY', url: 'https://platform.openai.com/api-keys' },
] as const

// Supabase
export const SUPABASE_URL = 'https://cbsmjeaxrcgrxiplytll.supabase.co'
