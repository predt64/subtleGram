# SubtleGram Backend

AI-powered переводчик субтитров для изучения английского языка на базе OpenRouter (Qwen/GPT моделей).

## 🎯 Что делает

Приложение анализирует субтитры и позволяет полученить:
- **Полный перевод предложения**
- **Объяснения грамматики** на русском языке
- **Определений сленга** из Urban Dictionary
- **Уровня сложности** (B1, C1 и т.д.)

## 🚀 Быстрый старт

### Установка
```bash
cd back
npm install
```

### Настройка

#### 1. Получите API ключ OpenRouter
- Перейдите на [openrouter.ai](https://openrouter.ai/keys)
- Создайте аккаунт и получите API ключ
- **Основная модель:** `mistral/mistral-small-3.2-24b-instruct:free` (mistral-small-3.2-24b-instruct)
- **Резервная модель:** `openai/gpt-oss-20b:free` (GPT-OSS 20B)

#### 2. Создайте `.env` файл:
```env
PORT=3001
NODE_ENV=development
OPENROUTER_API_KEY=your_openrouter_api_key_here
FRONTEND_URL=http://localhost:3000

# Опционально (для обратной совместимости)
HF_TOKEN=your_hugging_face_token_here
```

### Запуск
```bash
npm run dev  # разработка
npm start    # продакшн
```

Сервер: `http://localhost:3001`

## 📁 Архитектура

```
src/
├── controllers/         # Обработка API запросов
│   ├── uploadController.ts    # Загрузка файлов
│   └── analyzeController.ts   # Анализ предложений по клику
├── routes/              # API маршруты
│   └── subtitles.ts           # Эндпоинты субтитров
├── services/            # Бизнес-логика
│   ├── openRouterService.ts   # Клиент OpenRouter AI (с fallback)
│   ├── analysisService.ts     # Логика анализа предложений
│   └── slangService.ts        # Интеграция с Urban Dictionary
├── utils/               # Утилиты
│   ├── config.ts              # Централизованная конфигурация
│   └── validation.ts          # Валидация данных
├── types/               # TypeScript типы
│   └── index.ts               # Все определения типов
└── index.ts             # Точка входа Express сервера
```

## 🔧 API

### Health Check
```http
GET /health
```

### Загрузка субтитров
```http
POST /api/subtitles/upload
Content-Type: multipart/form-data

file: subtitle.srt
```

**Поддержка:** SRT, VTT, TXT файлы до 10MB

### Анализ предложения
```http
POST /api/subtitles/analyze
Content-Type: application/json

{
  "subtitles": [...],  // массив субтитров
  "sentenceText": "I gotta go home now.",  // текст предложения для анализа
  "context": {         // контекст предложения (опционально)
    "prev": "Hello there",
    "next": "See you later"
  }
}
```

**Что происходит:**
1. **Анализ AI** - Qwen анализирует предложение на русском языке
2. **Сленг** - извлекаем определения из Urban Dictionary
3. **Кэширование** - повторные запросы для того же предложения не вызывают повторный анализ

**Результат:**
- **Перевод** предложения целиком
- **Объяснение** грамматики и сленга
- **Определения** сленга из Urban Dictionary
- **Уровень сложности** (B1, C1 и т.д.)

## 🛠️ Команды

```bash
npm run dev               # разработка с авто-перезагрузкой
npm run build             # сборка для продакшена
npm start                 # запуск в продакшене
npm run test-integration  # интеграционные тесты с мокированием
npm run test-ud-api       # тестирование Urban Dictionary API
npm run lint              # проверка кода
npm run type-check        # проверка типов
```

## ⚙️ Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|-------------|
| `PORT` | Порт сервера | `3001` |
| `OPENROUTER_API_KEY` | OpenRouter API токен | *обязательно* |
| `FRONTEND_URL` | URL фронтенда | `http://localhost:3000` |
| `NODE_ENV` | Среда | `development` |

## 🔒 Безопасность

- Rate limiting (100 запросов/15мин)
- Валидация файлов (SRT, VTT, TXT до 10MB)
- CORS защита
- Helmet.js HTTP заголовки
- Кэширование результатов анализа

## 🧪 Тестирование

```bash
npm run test-integration  # тестирование анализа предложений
npm run test-ud-api       # проверка интеграции с Urban Dictionary
```

**Что тестируется:**
- Анализ предложений с контекстом
- Интеграция с Urban Dictionary API
- Кэширование результатов
- Токенизация и разбиение на предложения

## 🛠️ Стек технологий

- **Node.js + Express** - API сервер
- **TypeScript** - типобезопасность
- **OpenRouter API** - AI анализ с Qwen/GPT моделями
- **Urban Dictionary API** - определения сленга
- **Multer** - загрузка файлов
- **Rate limiting + CORS + Helmet** - безопасность
