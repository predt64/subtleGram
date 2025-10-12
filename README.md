# SubtleGram 🎬

Pet проект, созданный для решения личной проблемы постоянного переключения в GPT во время просмотра сериалов при встрече непонятных грамматических конструкций. Процесс ручного набора интересующего предложения в чат с нейронкой посчитал неоптимальным и решил разработать решение данной проблемы.

AI анализатор субтитров для изучения английского языка. Загружайте субтитры фильмов/сериалов, кликайте на фразы и получайте комплексный лингвистический анализ с помощью современных AI моделей.

## 🌐 Демо

🚀 **Посмотреть в демо-режиме:** [https://predt64.github.io/subtleGram/](https://predt64.github.io/subtleGram/)

*Чтобы получить примерное представление о проекте, посмотрите его демо-версию с тестовыми данными*

![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82?style=for-the-badge&logo=nuxt.js&logoColor=white)
![Vue](https://img.shields.io/badge/Vue-3-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)

## 🚀 Стек технологий

### Frontend

- **Nuxt 4** - Vue.js фреймворк с SSR/SSG
- **Vue 3** - Прогрессивный JavaScript фреймворк
- **TypeScript** - Типизированный JavaScript
- **Tailwind CSS** - Utility-first CSS фреймворк
- **Pinia** - Современное управление состоянием для Vue
- **VueUse** - Утилиты для Vue (sessionStorage)
- **Sentence Splitter** - Разделение текста на предложения

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - REST API сервер
- **TypeScript** - Типизированный JavaScript
- **OpenRouter API** - Множество AI моделей (Mistral, GPT, Qwen, etc.)
- **Urban Dictionary API** - Определения сленга
- **Multer** - Загрузка файлов
- **Express Rate Limit** - Защита от перегрузки
- **Helmet** - Безопасность HTTP заголовков

### Архитектура

- **Feature-Sliced Design (FSD)** - Архитектурная методология
- **Composition API** - Современные Vue 3 composables для переиспользования логики
- **Монолитный frontend** - Vue.js приложение
- **Pinia stores** - Централизованное управление состоянием
- **Session Storage** - Сохранение данных через VueUse
- **TypeScript** - Полная типизация для надежности

## 📁 Структура проекта

```
subtleGram/
├── front/                          # Nuxt.js приложение (FSD архитектура)
│   ├── entities/
│   │   └── subtitle/               # Сущность субтитров
│   │       ├── lib/                # Логика обработки субтитров
│   │       └── stores/             # Pinia store субтитров
│   ├── features/
│   │   └── file-upload/            # Функция загрузки файлов
│   │       ├── lib/                # Бизнес-логика загрузки
│   │       └── stores/             # Store состояния загрузки
│   ├── shared/
│   │   ├── api/                    # API клиенты
│   │   ├── lib/                    # Утилиты (таймлайн, форматирование, clamp)
│   │   └── types/                  # TypeScript типы
│   ├── widgets/                    # UI компоненты
│   │   ├── analysis-panel/         # Панель анализа текста
│   │   ├── subtitle-timeline/      # Таймлайн субтитров
│   │   │   ├── composables/        # Переиспользуемая логика компонента
│   │   └── workspace-*/            # Компоненты страницы с анализом
│   ├── pages/                      # Страницы приложения
│   │   ├── index.vue               # Главная страница
│   │   └── workspace.vue           # Страница с анализом
│   ├── nuxt.config.ts              # Конфигурация Nuxt
│   ├── tailwind.config.ts          # Конфигурация Tailwind
│   └── package.json
└── back/                           # Express.js API сервер
    ├── controllers/                 # Обработчики HTTP запросов
    │   ├── analyzeController.ts     # Анализ текста
    │   └── uploadController.ts      # Загрузка файлов
    ├── routes/
    │   └── subtitles.ts             # API маршруты субтитров
    ├── services/                    # Бизнес-логика
    │   ├── analysisService.ts       # AI анализ
    │   ├── openRouterService.ts     # OpenRouter API
    │   ├── slangService.ts          # Urban Dictionary
    │   └── subtitleParserService.ts # Парсинг субтитров
    ├── types/                       # TypeScript определения
    │   ├── index.ts                 # Основные типы
    │   └── openRouterTypes.ts       # Типы OpenRouter
    ├── utils/                       # Утилиты
    │   ├── config.ts                # Конфигурация
    │   ├── errorHandler.ts          # Обработка ошибок
    │   └── validation.ts            # Валидация данных
    ├── API-README.md                # Подробная документация API
    └── package.json
```

## 🛠 Установка и запуск

### Frontend

```bash
cd front
npm install
npm run dev
```

Приложение будет доступно на http://localhost:3000

### Backend

```bash
cd back
# Создайте .env файл с API ключом
# Добавьте OPENROUTER_API_KEY=ваш_ключ_здесь

npm install
npm run dev
```

API сервер будет доступен на http://localhost:3001

**Получение API ключа:**
- Перейдите на [OpenRouter.ai](https://openrouter.ai/keys)
- Зарегистрируйтесь и получите бесплатный API ключ
- Добавьте ключ в переменную `OPENROUTER_API_KEY`

⚠️ **Важно:** Без API ключа анализ предложений не будет работать. Загрузка и отображение субтитров работают без ключа.

### Сборка для продакшена

```bash
# Frontend
cd front
npm run build

# Backend
cd back
npm run build
npm start
```

## 🎯 Ключевые возможности

- ✅ **Загрузка субтитров** - поддержка SRT/VTT/TXT форматов
- ✅ **Интерактивный анализ** - клик на любое предложение для AI анализа
- ✅ **Грамматический разбор** - объяснение грамматики и правил
- ✅ **Переводы** - естественные и дословные варианты
- ✅ **Сленг** - определения из Urban Dictionary
- ✅ **Session Storage** - сохранение данных через VueUse
- ✅ **Поиск и фильтрация** - быстрый поиск по субтитрам
- ✅ **Таймлайн** - визуальные метки на полосе прокрутки

## 📸 Скриншоты

Перевод от ИИ на скринах не самый лучший, но тут всё зависит от качества модели. Я использовал бесплатные, поэтому и результат соответствующий)

### Загрузка субтитров
![Загрузка субтитров](screenshots/upload.png)
*Главная страница с drag & drop загрузкой субтитров*

### Анализ предложения
![Анализ предложения](screenshots/analysis.png)
*AI анализ выбранного предложения с грамматикой и переводами*

### Поиск по субтитрам
![Поиск по субтитрам](screenshots/search.png)
*Поиск с подсветкой результатов и навигация по таймлайну*

## 📝 Roadmap

### ✅ Выполнено
- [x] FSD архитектура проекта
- [x] Парсинг субтитров (SRT/VTT/TXT)
- [x] Pinia для управления состоянием
- [x] Session storage через VueUse
- [x] Drag & drop загрузка файлов
- [x] Интерактивный UI компонентов
- [x] Поиск по субтитрам с подсветкой
- [x] Express.js API сервер
- [x] OpenRouter AI интеграция
- [x] Грамматический анализ предложений
- [x] Urban Dictionary интеграция
- [x] Нормализация текста на предложения
- [x] Таймлайн с визуальными метками
- [x] Rate limiting и безопасность API
- [x] SSR оптимизация производительности