# SubtleGram API Reference

REST API для анализа субтитров с использованием AI моделей OpenRouter.

📚 **Основная документация проекта**: [README.md](README.md)

## 📋 Содержание

- [Общая информация](#общая-информация)
- [Эндпоинты](#эндпоинты)
- [Типы данных](#типы-данных)
- [Коды ошибок](#коды-ошибок)
- [Лимиты](#лимиты)

## Общая информация

- **Base URL:** `http://localhost:3001`
- **Аутентификация:** OpenRouter API ключ (переменная окружения `OPENROUTER_API_KEY`)
- **Rate Limiting:** 100 запросов / 15 минут
- **Форматы субтитров:** SRT, VTT, TXT (до 10MB)

## Эндпоинты

### GET /health
Проверка статуса сервера.

**Ответ (200):**
```json
{
  "status": "OK",
  "timestamp": "2025-01-24T10:30:00.000Z",
  "environment": "development"
}
```

### POST /api/subtitles/upload
Загрузка и парсинг файлов субтитров.

**Content-Type:** `multipart/form-data`

**Параметры:**
- `subtitle` (File, required) - файл субтитров (.srt, .vtt, .txt)

**Ответ (200):**
```json
{
  "success": true,
  "data": {
    "filename": "example.srt",
    "subtitlesCount": 3,
    "subtitles": [
      { "id": 1, "start": "00:00:01,000", "end": "00:00:04,000", "text": "Hello!" },
      { "id": 2, "start": "00:00:05,000", "end": "00:00:08,000", "text": "How are you?" }
    ]
  }
}
```

### POST /api/subtitles/analyze
Комплексный анализ английских предложений с AI и Urban Dictionary.

**Content-Type:** `application/json`

**Параметры:**
```json
{
  "sentenceText": "You're gonna have to stay out.",  // Обязательно
  "context": { "prev": "...", "next": "..." },        // Опционально
  "seriesName": "Show Name"                           // Опционально
}
```

**Ответ (200):**
```json
{
  "success": true,
  "data": {
    "analysis": {
      "text": "...",
      "cefr": "B2",
      "features": [{ "rule": "...", "russian": "..." }],
      "translations": [{ "style": "natural", "text": "..." }],
      "explanation": "...",
      "slang": [{ "term": "...", "ud": { "definition": "...", "example": "..." } }]
    },
    "metadata": {
      "processingTimeMs": 1250,
      "timestamp": "2025-01-24T...",
      "model": "mistral-small-3.2-24b-instruct"
    }
  }
}
```

### GET /api/subtitles/health
Информация о статусе AI моделей и сервиса.

**Ответ (200):**
```json
{
  "status": "OK",
  "aiModel": "mistral-small-3.2-24b-instruct + GPT-OSS-20B",
  "models": { "primary": { "name": "...", "provider": "Mistral" }, "fallback": {...} },
  "endpoints": [{ "path": "POST /analyze", "description": "...", "rateLimit": "..." }]
}
```

## Типы данных

### Основные структуры
- **SubtitleEntry**: запись субтитра (id, start, end, text)
- **AnalysisResult**: результат анализа (text, cefr, features, translations, explanation, slang)
- **SlangCard**: карточка сленга из Urban Dictionary

## Коды ошибок

| Код | Описание | Причина |
|-----|----------|---------|
| 200 | OK | Успешный запрос |
| 400 | Bad Request | Неверные данные |
| 401 | Unauthorized | Неверный API ключ |
| 408 | Timeout | Запрос слишком долгий |
| 429 | Too Many Requests | Превышен rate limit |
| 502 | Bad Gateway | Ошибка AI |
| 503 | Service Unavailable | AI недоступен |

## Лимиты

- **Файлы:** 10MB, форматы .srt/.vtt/.txt
- **API:** 100 запросов/15мин, таймаут 30сек
- **AI:** 2000 токенов, температура 0.4