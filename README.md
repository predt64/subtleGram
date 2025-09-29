# SubtleGram 🎬

Интерактивный анализатор субтитров для изучения английского языка. Загружайте субтитры, кликайте на фразы и получайте детальный анализ с объяснениями грамматики, переводов и стилевых вариантов.

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

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web фреймворк
- **TypeScript** - Типизированный JavaScript
- **Multer** - Загрузка файлов

### Архитектура

- **Feature-Sliced Design (FSD)** - Архитектурная методология
- **Монолитный frontend** - Vue.js приложение
- **Pinia stores** - Централизованное управление состоянием
- **SSR/SSG** - Серверный рендеринг для производительности
- **TypeScript** - Полная типизация для надежности

## 📁 Структура проекта

```
subtleGram/
├── front/
│   ├── src/
│   │   ├── app/
│   │   ├── entities/
│   │   ├── features/
│   │   ├── shared/
│   │   ├── widgets/
│   │   └── pages/
│   ├── nuxt.config.ts
│   ├── tailwind.config.ts
│   └── package.json
└── back/
    ├── src/
    │   ├── controllers/
    │   ├── routes/
    │   ├── services/
    │   ├── types/
    │   └── utils/
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
npm install
npm run dev
```

API сервер будет доступен на http://localhost:3001

### Сборка для продакшена

```bash
# Frontend
cd front
npm run build
npm run preview

# Backend
cd back
npm run build
npm start
```

## 📝 Roadmap

- [x] Базовая структура проекта (FSD архитектура)
- [x] Парсинг SRT файлов
- [x] Интерактивный UI с компонентами
- [x] Поиск по субтитрам с подсветкой
- [x] Drag & drop загрузка файлов
- [x] Оптимизации производительности (FOUC, SSR)
- [ ] Интеграция с ИИ для анализа (планируется)
- [ ] Кэширование анализов
