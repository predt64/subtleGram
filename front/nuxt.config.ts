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

  experimental: {
    payloadExtraction: false,
  },

  nitro: {
    compressPublicAssets: true,
    minify: true,
    prerender: {
      routes: ['/workspace']
    }
  },

  tailwindcss: {
    configPath: '~/tailwind.config.ts'
  },

  app: {
    baseURL: process.env.NODE_ENV === 'production' ? '/subtleGram/' : '/',
    head: {
      script: [
        {
          innerHTML: `
            window.$nuxt = {
              isDemo: '${process.env.NUXT_PUBLIC_IS_DEMO || 'false'}'
            }
          `
        }
      ]
    }
  },

  // Настройки для SPA на GitHub Pages
  router: {
    options: {
      hashMode: false
    }
  }
})
