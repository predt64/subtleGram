import { fileURLToPath } from 'url'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss'
  ],

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

  ssr: true,

  // Ниже попытка пофиксить/уменьшить FOUC

  vite: {
    css: {
      devSourcemap: true
    }
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'ru'
      },
      link: [
        { rel: 'preload', as: 'style', href: '/_nuxt/entry.css' },
      ]
    }
  },

  experimental: {
    payloadExtraction: false,
  },

  nitro: {
    compressPublicAssets: true,
    minify: true,
  },

  tailwindcss: {
    configPath: '~/tailwind.config.ts'
  }
})
