import { fileURLToPath } from 'url'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss'
  ],

  vite: {
    plugins: []
  },

  pinia: {
    storesDirs: ['@/shared/stores/**']
  },

  // Nuxt 4.1.2 формат алиасов
  alias: {
    "@": fileURLToPath(new URL('./src', import.meta.url))
  },

  dir: {
    pages: '@/pages'
  },

  typescript: {
    strict: true,
  },

  css: ['@/app/styles/main.css'],

})
