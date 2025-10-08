# SubtleGram Backend

AI-powered анализатор субтитров для изучения английского языка на базе OpenRouter с автоматическим выбором оптимальных моделей.

## 🎯 Что делает

Приложение анализирует субтитры английских фильмов/сериалов и предоставляет детальный лингвистический анализ для изучения языка:

- **Полный перевод предложений** с вариантами стилей (естественный/дословный)
- **Объяснения грамматики** на русском языке с примерами
- **Определения сленга** из Urban Dictionary API
- **Уровень сложности** по шкале CEFR (A1-C2)
- **Контекстный анализ** с учетом предыдущих/следующих реплик

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
- **Модели:** Бесплатные модели из топа OpenRouter

#### 2. Создайте `.env` файл:

```env
PORT=3001
NODE_ENV=development
OPENROUTER_API_KEY=your_openrouter_api_key_here
FRONTEND_URL=http://localhost:3000

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
├── controllers/         # HTTP обработчики API
│   ├── analyzeController.ts   # Анализ предложений
│   └── uploadController.ts    # Загрузка и парсинг файлов
├── routes/              # Express маршруты
│   └── subtitles.ts           # API субтитров (/api/subtitles/*)
├── services/            # Бизнес-логика и интеграции
│   ├── analysisService.ts     # Оркестрация анализа предложений
│   ├── openRouterService.ts   # OpenRouter AI клиент с fallback
│   ├── slangService.ts        # Urban Dictionary API
│   └── subtitleParserService.ts # Парсинг SRT/VTT/TXT файлов
├── types/               # TypeScript определения типов
│   └── index.ts               # Все типы проекта
├── utils/               # Утилиты и конфигурация
│   ├── config.ts              # Настройки моделей и API
│   ├── errorHandler.ts        # Централизованная обработка ошибок
│   └── validation.ts          # Валидация данных
└── index.ts             # Express сервер и middleware
```

## 🔧 API

### Health Check

```http
GET /health
```

**Ответ:** Статус сервера, timestamp, окружение

### Загрузка субтитров

```http
POST /api/subtitles/upload
Content-Type: multipart/form-data

subtitle: файл субтитров
```

**Поддержка:** SRT, VTT, TXT до 10MB
**Ответ:** Распарсенные субтитры с метаданными

### Анализ предложения

```http
POST /api/subtitles/analyze
Content-Type: application/json

{
  "sentenceText": "I'm here, Ravi.",
  "context": {
    "prev": "Ravi, I need you to go to Major",
    "next": "and find out where the bodies are"
  },
  "seriesName": "The Walking Dead"
}
```

**Процесс анализа:**

1. **AI анализ** - OpenRouter анализирует предложение
2. **Грамматика** - извлекает правила и конструкции
3. **Сленг** - делает запрос в Urban Dictionary API, если до этого был найден сленг
4. **Уровень сложности** - определяет по CEFR шкале

**Результат:**

- Полный перевод с вариантами стилей
- Детальный разбор грамматики
- Определения сленговых выражений
- Уровень сложности (A1-C2)
- Время обработки и используемая модель

### Health Check сервиса

```http
GET /api/subtitles/health
```

**Ответ:** Детальная информация о статусе AI моделей, лимитах, эндпоинтах

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

| Переменная           | Описание             | По умолчанию            |
| -------------------- | -------------------- | ----------------------- |
| `PORT`               | Порт сервера         | `3001`                  |
| `OPENROUTER_API_KEY` | OpenRouter API токен | _обязательно_           |
| `FRONTEND_URL`       | URL фронтенда        | `http://localhost:3000` |
| `NODE_ENV`           | Среда                | `development`           |

## 🔒 Безопасность

- Rate limiting (100 запросов/15мин)
- Валидация файлов (SRT, VTT, TXT до 10MB)
- CORS защита
- Helmet.js HTTP заголовки
- Кэширование результатов анализа

## 🧪 Тестирование

```bash
npm run test-integration  # Интеграционные тесты с моками AI
npm run test-ud-api       # Тесты Urban Dictionary API
npm run type-check        # Проверка TypeScript типов
npm run lint              # Проверка кода линтером
```

**Что тестируется:**

- Анализ предложений с контекстом
- Интеграция с Urban Dictionary API
- Fallback между AI моделями
- Парсинг субтитров разных форматов
- Обработка ошибок и rate limiting

## 🛠️ Стек технологий

- **Node.js + Express.js** - REST API сервер с middleware
- **TypeScript** - типобезопасность и современный JS
- **OpenRouter API** - AI модели с автоматическим fallback
- **Urban Dictionary API** - определения сленга и идиом
- **Multer** - парсинг multipart/form-data файлов
- **Express Rate Limit** - защита от перегрузки API
- **CORS + Helmet.js** - безопасность и заголовки
