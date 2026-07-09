# AI-OT API Documentation

## Base URL
```
https://your-app.vercel.app/api
```

## Authentication
В текущей версии API открыт (public). Для production рекомендуется добавить API ключ.

## Endpoints

### 1. Chat

**POST** `/chat`

Основной endpoint для чата с AI.

#### Request Body
```json
{
  "message": "Какие СИЗ положены электромонтёру?",
  "sessionId": "uuid-optional",
  "useWebSearch": true
}
```

#### Response
```json
{
  "response": "Согласно Трудовому кодексу РБ и постановлениям Минтруда...",
  "sources": [
    "Трудовой кодекс РБ (Национальное собрание РБ)",
    "Постановление Минтруда №37 (Министерство труда)"
  ],
  "provider": "Groq",
  "model": "llama-3.3-70b-versatile",
  "vectorResults": 3,
  "webResults": 2
}
```

#### Error Response
```json
{
  "error": "Failed to generate response",
  "details": "All AI providers failed"
}
```

---

### 2. Search

**POST** `/search`

Векторный и гибридный поиск по нормативной базе.

#### Request Body
```json
{
  "query": "электробезопасность",
  "type": "hybrid",
  "limit": 5,
  "threshold": 0.7
}
```

#### Response
```json
{
  "query": "электробезопасность",
  "type": "hybrid",
  "count": 5,
  "results": [
    {
      "id": "uuid",
      "content": "Текст найденного фрагмента...",
      "documentTitle": "Правила по охране труда при работе с электроустановками",
      "documentType": "regulation",
      "authority": "Министерство труда",
      "similarity": 0.89
    }
  ]
}
```

---

### 3. Web Search

**POST** `/web-search`

Поиск в интернете (DuckDuckGo + SearXNG).

#### Request Body
```json
{
  "query": "Беларусь охрана труда 2026",
  "maxResults": 5
}
```

#### Response
```json
{
  "query": "Беларусь охрана труда 2026",
  "count": 5,
  "results": [
    {
      "title": "Новые правила охраны труда в РБ",
      "url": "https://example.com/article",
      "description": "Описание статьи...",
      "source": "DuckDuckGo"
    }
  ]
}
```

---

### 4. Document Ingestion

**POST** `/ingest`

Загрузка документа в базу знаний.

#### Request Body (multipart/form-data)
```
file: <binary>
title: "Название документа"
documentType: "law" | "regulation" | "explanation" | "standard" | "other"
authority: "Министерство труда"
effectiveDate: "2024-01-01"
```

#### Response
```json
{
  "success": true,
  "documentId": "uuid",
  "title": "Название документа",
  "documentType": "law",
  "authority": "Министерство труда",
  "contentLength": 15000
}
```

---

### 5. Google Drive Sync

**PUT** `/ingest`

Синхронизация с Google Drive.

#### Response
```json
{
  "success": true,
  "added": 2,
  "updated": 1,
  "removed": 0,
  "errors": []
}
```

## Rate Limits

- Chat: 60 requests/minute
- Search: 120 requests/minute
- Web Search: 30 requests/minute
- Ingest: 10 requests/minute

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - неверные параметры |
| 401 | Unauthorized - нет доступа |
| 429 | Too Many Requests - превышен лимит |
| 500 | Internal Server Error |
| 503 | Service Unavailable - все AI провайдеры недоступны |
