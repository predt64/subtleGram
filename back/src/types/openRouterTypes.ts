/**
 * Типы данных для работы с OpenRouter API
 * Содержит интерфейсы для сообщений, ответов и конфигурации OpenRouter
 */

/**
 * Сообщение для OpenRouter API
 * Соответствует формату OpenAI Chat Completions API
 */
export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Ответ от OpenRouter API
 * Структура соответствует Chat Completions API
 */
export interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
    index: number;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

/**
 * Конфигурация для запросов к OpenRouter API
 * Параметры влияют на поведение AI модели
 */
export interface OpenRouterConfig {
  model: string;        // Название модели OpenRouter
  temperature: number;  // Креативность ответа (0.0 - 1.0)
  maxTokens: number;    // Максимальное количество токенов в ответе
  timeout: number;      // Таймаут запроса в миллисекундах
  maxRetries: number;   // Максимальное количество попыток при ошибках
}
