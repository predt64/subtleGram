# SubtleGram API Reference

Полная документация REST API для анализа субтитров с использованием AI моделей OpenRouter. Поддержка форматов SRT/VTT/TXT с автоматическим выбором оптимальных моделей.

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
- **Content-Type:** `application/json` для JSON запросов, `multipart/form-data` для загрузки файлов
- **Аутентификация:** Требуется API ключ OpenRouter в заголовке `Authorization` или переменной окружения
- **Rate Limiting:** 100 запросов / 15 минут с одного IP
- **CORS:** Разрешены запросы с `http://localhost:3000` (frontend)
- **Форматы субтитров:** SRT, VTT, TXT (до 10MB)

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

Комплексный анализ английских предложений с использованием современных AI моделей и интеграцией с Urban Dictionary.

### POST /api/subtitles/analyze

**Описание:** Выполняет комплексный лингвистический анализ предложения с использованием AI моделей OpenRouter.

**Content-Type:** `application/json`

**Headers:**

```
Content-Type: application/json
```

**Body (JSON):**

```typescript
{
  "sentenceText": "You're gonna have to stay out of the way, Liv.",  // Текст для анализа (обязательно)
  "context": {                           // Контекст из субтитров (опционально)
    "prev": "What are you doing?",       // Предыдущая реплика
    "next": "This is not your concern."  // Следующая реплика
  },
  "seriesName": "iZombie"                 // Название для контекста (опционально)
}
```

**Пример запроса:**

```bash
curl -X POST http://localhost:3001/api/subtitles/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "sentenceText": "I'\''m here, Ravi.",
    "context": {
      "prev": "Ravi, I need you to go to Major",
      "next": "and find out where the bodies are"
    },
    "seriesName": "The Walking Dead"
  }'
```

**Что происходит:**

1. **Автоматический выбор модели** - система выбирает оптимальную бесплатную AI модель
2. **Лингвистический анализ** - детальный разбор грамматики, конструкций и уровня сложности
3. **Проверка сленга** - запрос к Urban Dictionary API для определения идиом
4. **Генерация перевода** - создание естественного и дословного вариантов перевода
5. **Кэширование результатов** - повторные запросы обслуживаются из кэша

**Результат:**

- **segments[]** - массив сегментов с грамматическими правилами и уровнем сложности
- **translations[]** - варианты перевода (естественный и дословный) с объяснениями
- **slang[]** - определения сленговых выражений из Urban Dictionary
- **metadata** - время обработки, timestamp, используемая AI модель

**Возможные ответы:**

#### ✅ 200 OK

```json
{
  "success": true,
  "message": "Анализ с помощью AI завершен успешно",
  "data": {
    "analysis": {
      "segments": [
        {
          "text": "You're gonna have to stay out of the way, Liv.",
          "difficulty": {
            "cefr": "B2"
          },
          "features": [
            {
              "rule": "Present Simple",
              "russian": "Present Simple"
            },
            {
              "rule": "Contraction 'I am'",
              "russian": "Сокращение 'I am'"
            }
          ]
        }
      ],
      "translations": [
        {
          "variants": [
            {
              "style": "natural",
              "text": "Тебе придется не путаться под ногами, Лив."
            },
            {
              "style": "literal",
              "text": "Ты собираешься иметь необходимость оставаться вне пути, Лив."
            }
          ],
          "explanation": "Фраза 'You're gonna have to stay out of the way, Liv.' содержит разговорную конструкцию 'gonna' (going to), модальный глагол 'have to' для выражения необходимости, и повелительное наклонение. Уровень B2 из-за сложной грамматической структуры и идиоматического выражения."
        }
      ],
      "slang": [
        {
          "term": "gonna",
          "ud": {
            "definition": "Going to - contraction used in informal speech",
            "example": "I'm gonna stay home tonight",
            "permalink": "https://urbandictionary.com/define.php?term=gonna"
          }
        }
      ]
    },
    "metadata": {
      "processingTimeMs": 1250,
      "timestamp": "2025-01-24T10:30:00.000Z",
      "model": "mistral-small-3.2-24b-instruct + GPT-OSS-20B (fallback)",
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
  "message": "Неверный или отсутствующий токен OpenRouter"
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
  "message": "Служба AI сейчас занята. Попробуйте позже."
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
  "aiModel": "mistral-small-3.2-24b-instruct + GPT-OSS-20B (fallback)",
  "models": {
    "primary": {
      "name": "mistral/mistral-small-3.2-24b-instruct:free",
      "provider": "Mistral",
      "description": "Основная бесплатная модель Mistral с высоким качеством анализа"
    },
    "fallback": {
      "name": "openai/gpt-oss-20b:free",
      "provider": "OpenAI",
      "description": "Резервная модель на базе GPT для обеспечения доступности"
    }
  },
  "endpoints": [
    {
      "path": "POST /upload",
      "description": "Загрузка и парсинг файлов субтитров",
      "limits": "10MB, форматы: .srt, .vtt, .txt"
    },
    {
      "path": "POST /analyze",
      "description": "Анализ субтитров с помощью AI",
      "rateLimit": "100 запросов в 15 минут"
    }
  ],
  "features": ["Анализ сложности текста", "Оценка словарного запаса", "Проверка грамматики", "Комплексный анализ"]
}
```

---

## Типы данных

### SubtitleEntry

```typescript
{
  id: number; // Уникальный ID (1, 2, 3...)
  start: string; // Время начала "00:00:01,000"
  end: string; // Время окончания "00:00:04,000"
  text: string; // Текст субтитра
}
```

### GrammarFeature

```typescript
{
  rule: string; // Название грамматического правила на английском
  russian: string; // Название правила на русском
}
```

### TranslationVariant

```typescript
{
  style: 'natural' | 'literal'; // Стиль перевода
  text: string; // Текст перевода
}
```

### Difficulty

```typescript
{
  cefr: string; // Уровень сложности по CEFR (A1-C2)
}
```

### TranslationSegment

```typescript
{
  text: string;       // Текст сегмента
  difficulty: {
    cefr: string;     // Уровень сложности (B1, C1, etc.)
  };
  features: GrammarFeature[];
}
```

### TranslationData

```typescript
{
  variants: TranslationVariant[];     // Варианты перевода
  explanation: string;                // Объяснение грамматики
}
```

### TranslationGuide

```typescript
{
  segments: TranslationSegment[];     // Сегменты для перевода
  translations: TranslationData[];    // Переводы и объяснения
  slang: SlangCard[];                 // Определения сленга
}
```

### SlangCard

```typescript
{
  term: string; // Сленг (например, "gotta")
  ud: {
    definition: string; // Определение из UD
    example: string; // Пример использования
    permalink: string; // Ссылка на UD
  }
}
```

---

## Коды ошибок

| Код | Описание              | Причина                                       |
| --- | --------------------- | --------------------------------------------- |
| 200 | OK                    | Успешный запрос                               |
| 400 | Bad Request           | Неверные данные или обязательные поля         |
| 401 | Unauthorized          | Неверный или отсутствующий OPENROUTER_API_KEY |
| 404 | Not Found             | Эндпоинт не существует                        |
| 408 | Request Timeout       | Запрос занял слишком много времени            |
| 429 | Too Many Requests     | Превышен rate limit (100/15мин)               |
| 500 | Internal Server Error | Внутренняя ошибка сервера                     |
| 502 | Bad Gateway           | Ошибка ответа AI                              |
| 503 | Service Unavailable   | AI сервис недоступен                          |

---

## Лимиты и ограничения

### Файлы

- **Максимальный размер:** 10MB
- **Поддерживаемые форматы:** .srt, .vtt, .txt
- **MIME типы:** text/plain, application/octet-stream, text/vtt

### API

- **Rate Limiting:** 100 запросов / 15 минут с одного IP
- **Таймаут запроса:** 30 секунд
- **Максимум длины предложения:** 1000 символов

### AI Модель

- **Провайдер:** OpenRouter
- **Основная модель:** mistral/mistral-small-3.2-24b-instruct:free (mistral-small-3.2-24b-instruct - высокое качество)
- **Резервная модель:** openai/gpt-oss-20b:free (GPT-OSS 20B - для доступности)
- **Максимум токенов:** 2000 на ответ
- **Температура:** 0.4 (для точных переводов)
- **Таймаут:** 30 секунд на запрос
- **Повторные попытки:** 3 раза с fallback на другие модели

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
    "sentenceText": "You'\''re gonna have to stay out of the way, Liv.",
    "context": {
      "prev": "What are you doing?",
      "next": "This is not your concern."
    },
    "seriesName": "iZombie"
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
