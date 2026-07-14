# AI-OT — AI Agent for Occupational Safety in Belarus

ИИ-ассистент по охране труда в Республике Беларусь с базой знаний (RAG), векторным поиском и подключением бесплатных языковых моделей.

## 🏗️ Архитектура

- **Frontend**: Next.js 15 (Static Export) → GitHub Pages
- **Backend**: Supabase (PostgreSQL + pgvector + Edge Functions)
- **AI Providers**: Groq, DeepSeek, OpenRouter, HuggingFace (fallback-цепочка)
- **Embeddings**: Jina AI, HuggingFace
- **Web Search**: DuckDuckGo, SearXNG (без API ключей)
- **Document Storage**: Google Drive
- **Deployment**: GitHub Pages + Supabase

## 📋 Нормативная база

Система работает с документами:
- Трудовой кодекс Республики Беларусь
- Закон об охране труда
- Постановления Министерства труда и социальной защиты
- Инструкции Госпромнадзора
- СанПиН и гигиенические нормативы
- Разъяснения Верховного Суда РБ
- Нормативы Белэнерго
- Строительные нормы и правила

## 🚀 Быстрый старт

### 1. Создание репозитория на GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-ot.git
git push -u origin main
```

### 2. Настройка Supabase

1. Перейдите на https://supabase.com
2. Создайте новый проект
3. Название: `ai-ot-belarus`
4. Регион: `East US (N. Virginia)`
5. Сохраните пароль базы данных

#### Выполнение миграций

В Supabase Dashboard → **SQL Editor** → New query:

```sql
-- Скопируйте содержимое supabase/migrations/001_initial.sql
```

Нажмите **Run**.

#### Получение ключей API

Project Settings → API:
- `URL` → `SUPABASE_URL`
- `anon public` → `SUPABASE_ANON_KEY`
- `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Настройка GitHub Secrets

В репозитории → Settings → Secrets and variables → Actions:

| Secret | Значение |
|--------|----------|
| `SUPABASE_URL` | URL из Supabase |
| `SUPABASE_ANON_KEY` | anon ключ |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role ключ |
| `GROQ_API_KEY` | Ключ Groq |
| `DEEPSEEK_API_KEY` | Ключ DeepSeek |
| `OPENROUTER_API_KEY` | Ключ OpenRouter |
| `JINA_API_KEY` | Ключ Jina AI |
| `GOOGLE_DRIVE_FOLDER_ID` | ID папки Google Drive |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | JSON сервисного аккаунта |

### 4. Включение GitHub Pages

Settings → Pages:
- Source: GitHub Actions

### 5. Получение API ключей AI провайдеров

**Groq** (рекомендуется — самый быстрый):
- https://console.groq.com → Create API Key
- Бесплатно: 1M tokens/day

**DeepSeek** (хорош для русского):
- https://platform.deepseek.com
- Бесплатный tier доступен

**OpenRouter** (резерв):
- https://openrouter.ai
- Есть бесплатные модели

**Jina AI** (эмбеддинги):
- https://jina.ai
- Бесплатно: 1M tokens

### 6. Настройка Google Drive

#### Создание Service Account
1. https://console.cloud.google.com
2. Новый проект → Включите Google Drive API
3. Создайте Service Account
4. Сгенерируйте JSON ключ
5. Скопируйте JSON в `GOOGLE_SERVICE_ACCOUNT_JSON`

#### Настройка папки
1. Создайте папку на Google Drive
2. Поделитесь с email Service Account
3. Скопируйте ID папки из URL

### 7. Локальная разработка

```bash
# Клонирование
git clone https://github.com/YOUR_USERNAME/ai-ot.git
cd ai-ot

# Установка
npm install

# Настройка окружения
cp .env.example .env.local
# Заполните .env.local

# Запуск
npm run dev
```

Откройте http://localhost:3000

### 8. Загрузка документов

#### Через админ-панель
Откройте `/admin` → вкладка "Загрузка"

#### Через API
```bash
curl -X POST https://your-app.github.io/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Какие СИЗ положены электромонтёру?"}'
```

#### Через Google Drive
Положите файлы в папку → система синхронизирует автоматически

### 9. Автоматическая синхронизация

Настройте cron job на вашем сервере или используйте GitHub Actions:

```yaml
# .github/workflows/sync.yml
name: Sync Google Drive
on:
  schedule:
    - cron: '0 2 * * *'  # Каждый день в 2:00
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger sync
        run: |
          curl -X PUT \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            ${{ secrets.SUPABASE_URL }}/functions/v1/sync-drive
```

## 🔍 API Endpoints (через Supabase Edge Functions)

| Endpoint | Method | Описание |
|----------|--------|----------|
| `/functions/v1/chat` | POST | Основной чат |
| `/functions/v1/search` | POST | Поиск |
| `/functions/v1/ingest` | POST | Загрузка документа |
| `/functions/v1/sync-drive` | PUT | Синхронизация Drive |

## 🧠 AI Providers (Priority Chain)

1. **Groq** — Llama 3.3 70B, 1M tokens/day бесплатно
2. **DeepSeek** — хорошее качество на русском
3. **OpenRouter** — множество моделей, есть бесплатные
4. **HuggingFace** — резервный вариант

## 📁 Структура проекта

```
ai-ot/
├── .github/workflows/
│   ├── ci.yml              # Проверка сборки
│   └── deploy.yml          # Деплой на GitHub Pages
├── src/
│   ├── app/                # Next.js App Router
│   ├── components/         # React компоненты
│   └── lib/                # Бизнес-логика
├── supabase/
│   ├── functions/            # Edge Functions
│   ├── migrations/           # SQL миграции
│   └── seed.sql             # Тестовые данные
├── public/
├── .env.example
├── next.config.js
├── package.json
└── README.md
```

## 🔄 Обновление системы

При изменении документов на Google Drive:
1. Автосинхронизация по cron
2. Или нажмите "Синхронизировать" в админ-панели
3. Или вызовите Edge Function

## 📄 Лицензия

MIT
 
