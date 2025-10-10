import { useStorage } from '@vueuse/core'

/**
 * Создает storage с JSON сериализацией и обработкой ошибок
 * @param key - ключ sessionStorage
 * @param defaultValue - значение по умолчанию
 * @returns настроенный useStorage
 */
export function createJsonStorage<T>(key: string, defaultValue: T) {
  return useStorage<T>(key, defaultValue, sessionStorage, {
    serializer: {
      read: (v: string) => {
        try {
          return v ? JSON.parse(v) : defaultValue
        } catch (error) {
          console.warn(`Failed to parse storage key "${key}":`, error)
          return defaultValue
        }
      },
      write: (v: T) => JSON.stringify(v)
    }
  })
}

/**
 * Создает простой storage для примитивных значений
 * @param key - ключ sessionStorage
 * @param defaultValue - значение по умолчанию
 * @returns настроенный useStorage
 */
export function createSimpleStorage<T>(key: string, defaultValue: T) {
  return useStorage<T>(key, defaultValue, sessionStorage, {
    serializer: {
      read: (v: string) => (v as T) || defaultValue,
      write: (v: T) => String(v)
    }
  })
}
