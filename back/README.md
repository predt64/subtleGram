# SubtleGram Backend

AI-powered анализатор субтитров для изучения английского языка на базе OpenRouter с автоматическим выбором оптимальных моделей.

## Что делает

Приложение анализирует субтитры английских фильмов/сериалов и предоставляет детальный лингвистический анализ для изучения языка:

- **Полный перевод предложений** с вариантами стилей (естественный/дословный)
- **Объяснения грамматики** на русском языке с примерами
- **Определения сленга** из Urban Dictionary API
- **Уровень сложности** по шкале CEFR (A1-C2)
- **Контекстный анализ** с учетом предыдущих/следующих реплик

## Быстрый старт

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

## Архитектура

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

## API Документация

Полная спецификация API доступна в **[API-README.md](API-README.md)**

### Основные эндпоинты

- `GET /health` - проверка статуса сервера
- `POST /api/subtitles/upload` - загрузка субтитров (SRT/VTT/TXT)
- `POST /api/subtitles/analyze` - AI анализ предложений с Urban Dictionary
- `GET /api/subtitles/health` - статус AI моделей и сервиса

### Ключевые возможности

- **Лингвистический анализ** предложений с определением уровня сложности (CEFR)
- **Грамматический разбор** с объяснениями на русском языке
- **Переводы** с вариантами стилей (естественный/дословный)
- **Сленг определение** через Urban Dictionary API
- **Кеширование** для оптимизации производительности

## Запуск и разработка

```bash
npm run dev     # разработка с авто-перезагрузкой
npm run build   # сборка для продакшена
npm start       # запуск в продакшене
```

## Конфигурация

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `PORT` | Порт сервера | `3001` |
| `OPENROUTER_API_KEY` | API токен OpenRouter | _обязательно_ |
| `FRONTEND_URL` | URL фронтенда | `http://localhost:3000` |

## Стек технологий

- **Backend**: Node.js + Express.js + TypeScript
- **AI**: OpenRouter API (Mistral + GPT fallback)
- **Сленг**: Urban Dictionary API
- **Безопасность**: Rate limiting, CORS, Helmet.js
- **Файлы**: Multer для multipart загрузки
