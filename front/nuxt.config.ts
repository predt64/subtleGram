// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Модули для работы с Pinia, Tailwind и persisted state
  modules: [
    '@pinia/nuxt',
    'pinia-plugin-persistedstate',
    '@nuxtjs/tailwindcss'
  ],

  // Алиасы для FSD структуры
  alias: {
    "@": '../src',
  },

  // Указываем путь к страницам явно
  dir: {
    pages: './src/pages'
  },

  // Настройки TypeScript
  typescript: {
    strict: true,
  },

  // Настройки CSS и Tailwind
  css: ['~/assets/css/main.css'],

  // Настройки для SSR
  ssr: true,
})