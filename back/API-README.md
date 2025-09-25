# SubtleGram API Reference

Детальное описание всех API эндпоинтов SubtleGram Backend с примерами запросов и ответов.

## 📋 Содержание

- [Общая информация](#общая-информация)
- [Health Check](#health-check)
- [Health Check сервиса субтитров](#health-check-сервиса-субтитров)
- [Загрузка субтитров](#загрузка-субтитров)
- [Анализ предложений](#анализ-предложений)
- [Типы данных](#типы-данных)
- [Коды ошибок](#коды-ошибок)
- [Лимиты и ограничения](#лимиты-и-ограничения)

## Общая информация

- **Base URL:** `http://localhost:3001`
- **Content-Type:** `application/json` (для JSON запросов)
- **Аутентификация:** Не требуется (публичный API)
- **Rate Limiting:** 100 запросов / 15 минут с одного IP

## Health Check

Проверка статуса сервера и базовой конфигурации.

### GET /health

**Описание:** Проверка доступности сервера и базовых настроек.

**Headers:**
```
Content-Type: application/json
```

**Пример запроса:**
```bash
curl -X GET http://localhost:3001/health
```

**Возможные ответы:**

#### ✅ 200 OK
```json
{
  "status": "OK",
  "timestamp": "2025-01-24T10:30:00.000Z",
  "environment": "development"
}
```

#### ❌ 500 Internal Server Error
```json
{
  "error": "Внутренняя ошибка сервера",
  "message": "Произошла непредвиденная ошибка"
}
```

---

## Загрузка субтитров

Загрузка и парсинг файлов субтитров в формате SRT, VTT или TXT.

### POST /api/subtitles/upload

**Описание:** Загружает файл субтитров, парсит его и возвращает структурированные данные.

**Content-Type:** `multipart/form-data`

**Headers:**
```
Content-Type: multipart/form-data
```

**Body (form-data):**
| Параметр | Тип | Обязательный | Описание |
|----------|-----|-------------|----------|
| `subtitle` | File | Да | Файл субтитров (.srt, .vtt или .txt) |

**Пример запроса:**
```bash
curl -X POST http://localhost:3001/api/subtitles/upload \
  -F "subtitle=@example.srt"
```

**Возможные ответы:**

#### ✅ 200 OK
```json
{
  "success": true,
  "message": "Файл субтитров успешно обработан",
  "data": {
    "filename": "example.srt",
    "subtitlesCount": 3,
    "subtitles": [
      {
        "id": 1,
        "start": "00:00:01,000",
        "end": "00:00:04,000",
        "text": "Hello world!"
      },
      {
        "id": 2,
        "start": "00:00:05,000",
        "end": "00:00:08,000",
        "text": "This is a test."
      },
      {
        "id": 3,
        "start": "00:00:09,000",
        "end": "00:00:12,000",
        "text": "How are you?"
      }
    ]
  }
}
```

#### ❌ 400 Bad Request - Файл не загружен
```json
{
  "error": "Файл не загружен",
  "message": "Пожалуйста, загрузите файл субтитров (.srt, .vtt или .txt)"
}
```

#### ❌ 400 Bad Request - Неверный формат файла
```json
{
  "error": "Неверный формат субтитров",
  "message": "Загруженный файл не является валидным файлом субтитров"
}
```

#### ❌ 400 Bad Request - Файл слишком большой
```json
{
  "error": "Файл слишком большой",
  "message": "Размер файла превышает максимально допустимый лимит"
}
```

---

## Анализ предложений

Анализ предложения с помощью Qwen AI.

### POST /api/subtitles/analyze

**Описание:** Анализирует предложение и возвращает перевод, объяснения и определения сленга.

**Content-Type:** `application/json`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```typescript
{
  "subtitles": [
    {
      "id": number,
      "start": string,  // Формат: "00:00:00,000"
      "end": string,    // Формат: "00:00:00,000"
      "text": string
    }
  ],
  "sentenceText": "I gotta go home now.",  // Текст предложения для анализа
  "context": {         // Контекст предложения (опционально)
    "prev": "Hello there",
    "next": "See you later"
  }
}
```

**Пример запроса:**
```bash
curl -X POST http://localhost:3001/api/subtitles/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "subtitles": [
      {
        "id": 1,
        "start": "00:00:01,000",
        "end": "00:00:04,000",
        "text": "I gotta go home now."
      }
    ],
    "sentenceText": "I gotta go home now.",
    "context": {
      "prev": "Hello there",
      "next": "See you later"
    }
  }'
```

**Что происходит:**
1. **Анализ предложения** - Qwen анализирует предоставленный текст на русском языке
2. **Сленг** - извлекаем определения из Urban Dictionary
3. **Кэширование** - повторные запросы для того же предложения не вызывают повторный анализ

**Результат:**
- **Перевод** предложения целиком
- **Объяснение** грамматики и сленга
- **Определения** сленга из Urban Dictionary
- **Уровень сложности** (B1, C1 и т.д.)

**Возможные ответы:**

#### ✅ 200 OK
```json
{
  "success": true,
  "message": "Анализ с помощью Qwen завершен успешно",
  "data": {
    "analysisType": "translation",
    "subtitlesAnalyzed": 1,
    "analysis": {
      "tokens": [
        {
          "id": 0,
          "entryIndex": 0,
          "charStart": 0,
          "charEnd": 1,
          "text": "I",
        },
        {
          "id": 1,
          "entryIndex": 0,
          "charStart": 2,
          "charEnd": 7,
          "text": "gotta",
        },
        {
          "id": 2,
          "entryIndex": 0,
          "charStart": 8,
          "charEnd": 11,
          "text": "go",
        },
        {
          "id": 3,
          "entryIndex": 0,
          "charStart": 12,
          "charEnd": 17,
          "text": "home",
        },
        {
          "id": 4,
          "entryIndex": 0,
          "charStart": 18,
          "charEnd": 22,
          "text": "now",
        },
        {
          "id": 5,
          "entryIndex": 0,
          "charStart": 22,
          "charEnd": 23,
          "text": ".",
        }
      ],
      "segments": [
        {
          "id": "seg_1",
          "wordStart": 0,
          "wordEnd": 6,
          "text": "I gotta go home now.",
          "reasoning": [],
          "difficulty": {
            "cefr": "B1",
            "score": 5,
            "factors": []
          },
          "features": []
        }
      ],
      "translations": [
        {
          "segmentId": "seg_1",
          "variants": [
            {
              "style": "natural",
              "text": "Мне нужно идти домой сейчас.",
              "confidence": 0.8
            }
          ],
          "explanation": {
            "type": "simple",
            "summary": "Простое предложение в будущем времени",
            "details": "Выражает необходимость действия. 'Gotta' - сленг для 'have got to'.",
            "notes": ["Используется в разговорной речи"]
          }
        }
      ],
      "slang": [
        {
          "tokenId": -1,
          "term": "gotta",
          "ud": {
            "definition": "Have got to",
            "example": "I gotta go",
            "permalink": "https://urbandictionary.com/define.php?term=gotta"
          }
        }
      ]
    },
    "metadata": {
      "processingTimeMs": 1250,
      "timestamp": "2025-01-24T10:30:00.000Z",
      "model": "Qwen/Qwen3-Next-80B-A3B-Instruct",
      "validationWarnings": []
    }
  }
}
```

#### ❌ 400 Bad Request - sentenceText обязательна
```json
{
  "success": false,
  "message": "sentenceText (текст предложения) обязательна"
}
```

#### ❌ 400 Bad Request - Ошибка валидации
```json
{
  "error": "Ошибка валидации",
  "message": "Предоставлены некорректные данные субтитров",
  "details": {
    "errors": ["Поле 'text' обязательно"],
    "warnings": ["Некорректный формат времени"]
  }
}
```

#### ❌ 401 Unauthorized - Неверный токен
```json
{
  "error": "Ошибка аутентификации",
  "message": "Неверный или отсутствующий токен Hugging Face"
}
```

#### ❌ 429 Too Many Requests - Rate limit
```json
{
  "error": "Превышен лимит запросов",
  "message": "Слишком много запросов. Подождите перед повторной попыткой.",
  "retryAfter": 60
}
```

#### ❌ 408 Request Timeout - Таймаут
```json
{
  "error": "Таймаут запроса",
  "message": "Анализ занял слишком много времени. Попробуйте с меньшим количеством субтитров."
}
```

#### ❌ 503 Service Unavailable - AI недоступен
```json
{
  "error": "Сервис временно недоступен",
  "message": "Служба Qwen AI сейчас занята. Попробуйте позже."
}
```

#### ❌ 502 Bad Gateway - Ошибка AI
```json
{
  "error": "Ошибка ответа AI",
  "message": "Получен некорректный ответ от службы AI. Попробуйте еще раз."
}
```

---

## Health Check сервиса субтитров

Детальная информация о статусе сервиса субтитров.

### GET /api/subtitles/health

**Описание:** Проверка статуса сервиса субтитров, доступных эндпоинтов и функций.

**Headers:**
```
Content-Type: application/json
```

**Пример запроса:**
```bash
curl -X GET http://localhost:3001/api/subtitles/health
```

**Возможные ответы:**

#### ✅ 200 OK
```json
{
  "status": "OK",
  "service": "subtitles",
  "aiModel": "Qwen/Qwen3-Next-80B-A3B-Instruct",
  "endpoints": [
    {
      "path": "POST /upload",
      "description": "Загрузка и парсинг файлов субтитров",
      "limits": "10MB, форматы: .srt, .vtt, .txt"
    },
    {
      "path": "POST /analyze",
      "description": "Анализ субтитров с помощью Qwen AI",
      "rateLimit": "100 запросов в 15 минут"
    }
  ],
  "features": [
    "Анализ сложности текста",
    "Оценка словарного запаса",
    "Проверка грамматики",
    "Комплексный анализ"
  ]
}
```

---

## Типы данных

### SubtitleEntry
```typescript
{
  id: number;      // Уникальный ID (1, 2, 3...)
  start: string;   // Время начала "00:00:01,000"
  end: string;     // Время окончания "00:00:04,000"
  text: string;    // Текст субтитра
}
```

### TranslationGuide
```typescript
{
  tokens: Token[];                    // Все слова в предложении
  segments: TranslationSegment[];     // Сегменты для перевода
  translations: TranslationData[];    // Переводы и объяснения
  slang: SlangCard[];                 // Определения сленга
}
```

### SlangCard
```typescript
{
  tokenId: number;    // ID токена (-1 для сленга)
  term: string;       // Сленг (например, "gotta")
  ud: {
    definition: string;  // Определение из UD
    example: string;     // Пример использования
    permalink: string;   // Ссылка на UD
  }
}
```

### Token
```typescript
{
  id: number;         // ID токена
  entryIndex: number; // Индекс субтитра
  charStart: number;  // Начальная позиция в тексте
  charEnd: number;    // Конечная позиция в тексте
  text: string;       // Оригинальный текст
}
```

---

## Коды ошибок

| Код | Описание | Причина |
|-----|----------|---------|
| 200 | OK | Успешный запрос |
| 400 | Bad Request | Неверные данные или обязательные поля |
| 401 | Unauthorized | Неверный или отсутствующий HF_TOKEN |
| 404 | Not Found | Эндпоинт не существует |
| 408 | Request Timeout | Запрос занял слишком много времени |
| 429 | Too Many Requests | Превышен rate limit (100/15мин) |
| 500 | Internal Server Error | Внутренняя ошибка сервера |
| 502 | Bad Gateway | Ошибка ответа AI |
| 503 | Service Unavailable | AI сервис недоступен |

---

## Лимиты и ограничения

### Файлы
- **Максимальный размер:** 10MB
- **Поддерживаемые форматы:** .srt, .vtt, .txt
- **MIME типы:** text/plain, application/octet-stream, text/vtt

### API
- **Rate Limiting:** 100 запросов / 15 минут с одного IP
- **Таймаут запроса:** 30 секунд
- **Максимум субтитров:** Неограничено (зависит от памяти)

### AI Модель
- **Модель:** Qwen/Qwen3-Next-80B-A3B-Instruct
- **Максимум токенов:** 2000 на ответ
- **Температура:** 0.4 (для переводов)
- **Таймаут:** 30 секунд
- **Повторные попытки:** 3 раза

---

## Примеры использования

### 1. Полная последовательность работы

```bash
# 1. Загрузить файл
curl -X POST http://localhost:3001/api/subtitles/upload \
  -F "subtitle=@movie.srt"

# 2. Проанализировать предложение
curl -X POST http://localhost:3001/api/subtitles/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "subtitles": [{"id":1,"start":"00:00:01,000","end":"00:00:04,000","text":"I gotta go."}],
    "sentenceText": "I gotta go.",
    "context": {"prev": "Hello", "next": "Bye"}
  }'
```

### 2. Обработка ошибок

```bash
# Слишком много запросов
curl -X POST http://localhost:3001/api/subtitles/analyze \
  -H "Content-Type: application/json" \
  -d '{"subtitles":[],"sentenceText":"I gotta go."}'

# Ответ: 429 Too Many Requests
```

### 3. Проверка здоровья

```bash
curl http://localhost:3001/health
# Ответ: {"status":"OK","timestamp":"...","environment":"development"}
```

---

**Примечание:** Все примеры используют curl. В реальном приложении используйте HTTP клиент (fetch, axios и т.д.)
