# Руководство по развёртыванию AI-OT (GitHub + Supabase)

## Требования

- GitHub аккаунт
- Supabase аккаунт (бесплатный tier)
- API ключ хотя бы одного AI провайдера

## Шаг 1: Создание репозитория на GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-ot.git
git push -u origin main
```

## Шаг 2: Настройка Supabase

### Создание проекта
1. Перейдите на https://supabase.com
2. Нажмите "New Project"
3. Название: `ai-ot-belarus`
4. Регион: `East US (N. Virginia)`
5. Задайте пароль базы данных (сохраните!)
6. Дождитесь создания проекта (~2 минуты)

### Выполнение миграций

1. В Dashboard перейдите в **SQL Editor**
2. Создайте новый запрос (New query)
3. Скопируйте содержимое файла `supabase/migrations/001_initial.sql`
4. Нажмите **Run**

### Получение API ключей

1. Перейдите в **Project Settings → API**
2. Скопируйте:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` → `SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

## Шаг 3: Настройка GitHub Secrets

1. В репозитории перейдите: **Settings → Secrets and variables → Actions**
2. Нажмите **New repository secret**
3. Добавьте все необходимые секреты:

### Обязательные

| Название | Значение | Где получить |
|----------|----------|--------------|
| `SUPABASE_URL` | `https://cbsmjeaxrcgrxiplytll.supabase.co` | Supabase Settings → API |
| `SUPABASE_ANON_KEY` | `eyJ...` | Supabase Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Supabase Settings → API |

### AI провайдеры (минимум один)

| Название | Где получить | Бесплатный лимит |
|----------|--------------|------------------|
| `GROQ_API_KEY` | https://console.groq.com | 1M tokens/day |
| `DEEPSEEK_API_KEY` | https://platform.deepseek.com | Доступен |
| `OPENROUTER_API_KEY` | https://openrouter.ai | Есть бесплатные модели |

### Опциональные

| Название | Описание |
|----------|----------|
| `JINA_API_KEY` | Для эмбеддингов (https://jina.ai) |
| `HUGGINGFACE_API_KEY` | Резерв для эмбеддингов |
| `GOOGLE_DRIVE_FOLDER_ID` | ID папки Google Drive |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | JSON сервисного аккаунта |

## Шаг 4: Получение API ключей

### Groq (Рекомендуется)

1. Перейдите на https://console.groq.com
2. Зарегистрируйтесь (можно через Google)
3. Создайте API Key
4. Скопируйте ключ

**Лимиты бесплатного tier:**
- 1,000,000 tokens/day
- 20 requests/minute
- Доступные модели: Llama 3.3 70B, Mixtral 8x7B

### DeepSeek

1. https://platform.deepseek.com
2. Зарегистрируйтесь
3. Получите API Key
4. Хорошо работает с русским языком

### OpenRouter

1. https://openrouter.ai
2. Создайте аккаунт
3. Создайте API Key
4. Доступны бесплатные модели (с пометкой `:free`)

### Jina AI (для эмбеддингов)

1. https://jina.ai
2. Получите бесплатный API Key
3. 1M tokens бесплатно

## Шаг 5: Настройка Google Drive (опционально)

### Создание Service Account

1. Перейдите на https://console.cloud.google.com
2. Создайте новый проект
3. Включите **Google Drive API**:
   - APIs & Services → Library
   - Найдите "Google Drive API"
   - Нажмите "Enable"
4. Создайте Service Account:
   - IAM & Admin → Service Accounts
   - Create Service Account
   - Роль: "Editor"
5. Создайте ключ:
   - Откройте Service Account
   - Keys → Add Key → Create New Key → JSON
   - Скачайте JSON файл
6. Скопируйте содержимое JSON файла в секрет `GOOGLE_SERVICE_ACCOUNT_JSON`

### Настройка папки

1. Создайте папку на Google Drive
2. Откройте настройки доступа (Share)
3. Добавьте email Service Account с правами "Editor"
4. Скопируйте ID папки из URL:
   - URL: `https://drive.google.com/drive/folders/1ABC123xyz`
   - ID: `1ABC123xyz`
5. Сохраните ID в секрет `GOOGLE_DRIVE_FOLDER_ID`

## Шаг 6: Включение GitHub Pages

1. В репозитории: **Settings → Pages**
2. Source: выберите **GitHub Actions**
3. Сохраните

## Шаг 7: Первый деплой

1. Сделайте push в main ветку:
   ```bash
   git add .
   git commit -m "Setup project"
   git push origin main
   ```
2. Перейдите в **Actions** вкладку репозитория
3. Дождитесь завершения workflow "Deploy to GitHub Pages"
4. Сайт будет доступен по адресу: `https://YOUR_USERNAME.github.io/ai-ot/`

## Шаг 8: Загрузка документов

### Способ 1: Через Supabase Dashboard

1. Перейдите в Supabase Dashboard → Table Editor
2. Таблица `documents` → Insert row
3. Заполните поля:
   - title: "Трудовой кодекс РБ"
   - content: "[текст документа]"
   - document_type: "law"
   - authority: "Национальное собрание РБ"

### Способ 2: Через Edge Function

```bash
curl -X POST \
  "https://cbsmjeaxrcgrxiplytll.supabase.co/functions/v1/ingest" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -F "file=@document.pdf" \
  -F "title=Трудовой кодекс РБ"
```

### Способ 3: Через Google Drive

1. Положите файлы в настроенную папку
2. Вызовите синхронизацию:
   ```bash
   curl -X PUT \
     "https://cbsmjeaxrcgrxiplytll.supabase.co/functions/v1/sync-drive" \
     -H "Authorization: Bearer YOUR_ANON_KEY"
   ```

## Шаг 9: Проверка работы

1. Откройте сайт: `https://YOUR_USERNAME.github.io/ai-ot/`
2. Задайте тестовый вопрос:
   - "Какие СИЗ положены электромонтёру?"
   - "Порядок расследования несчастного случая"
3. Проверьте, что ответ содержит ссылки на источники

## Шаг 10: Настройка автоматической синхронизации

### Вариант 1: GitHub Actions Cron

Создайте файл `.github/workflows/sync.yml`:

```yaml
name: Sync Google Drive
on:
  schedule:
    - cron: '0 2 * * *'  # Каждый день в 2:00 UTC
  workflow_dispatch:       # Или вручную

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Sync Drive
        run: |
          curl -X PUT \
            "https://cbsmjeaxrcgrxiplytll.supabase.co/functions/v1/sync-drive" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

### Вариант 2: Локальный cron

На вашем компьютере или сервере:

```bash
# Добавьте в crontab (crontab -e)
0 2 * * * curl -X PUT \
  "https://cbsmjeaxrcgrxiplytll.supabase.co/functions/v1/sync-drive" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Вариант 3: Supabase Cron (если доступен)

В Supabase Dashboard → Database → Cron jobs:

```sql
SELECT cron.schedule(
  'sync-drive',
  '0 2 * * *',
  $$SELECT net.http_post(
    url:='https://cbsmjeaxrcgrxiplytll.supabase.co/functions/v1/sync-drive',
    headers:='{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  )$$
);
```

## Устранение неполадок

### Ошибка "All AI providers failed"
- Проверьте GitHub Secrets
- Убедитесь, что хотя бы один API ключ настроен
- Проверьте лимиты бесплатного tier

### Ошибка "Vector search failed"
- Убедитесь, что pgvector extension включён
- Проверьте, что миграции выполнены
- Проверьте наличие данных в таблице `document_chunks`

### GitHub Pages не обновляется
- Проверьте Actions вкладку на ошибки
- Убедитесь, что Secrets настроены правильно
- Проверьте настройки Pages (Source: GitHub Actions)

### Документы не загружаются из Google Drive
- Проверьте права доступа к папке
- Убедитесь, что Service Account имеет доступ
- Проверьте правильность `GOOGLE_DRIVE_FOLDER_ID`
- Проверьте формат `GOOGLE_SERVICE_ACCOUNT_JSON`

## Мониторинг

- **GitHub Actions**: Репозиторий → Actions
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Groq Console**: https://console.groq.com
- **GitHub Pages**: Settings → Pages (покажет URL)

## Обновление системы

При изменении кода:
```bash
git add .
git commit -m "Update"
git push origin main
```

GitHub Actions автоматически пересоберёт и задеплоит сайт.

При изменении документов на Google Drive:
- Система синхронизируется автоматически по cron
- Или нажмите "Синхронизировать" в админ-панели
- Или вызовите Edge Function вручную
