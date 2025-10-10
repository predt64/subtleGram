
/**
 * Низкоуровневый сервис для взаимодействия с OpenRouter API
 *
 * Отвечает за:
 * - Отправку HTTP запросов к OpenRouter API
 * - Retry логику с exponential backoff
 * - Парсинг структурированных ответов
 * - Генерацию системных промптов
 * - Fallback логику между моделями
 */
import { OpenRouterMessage, OpenRouterResponse, OpenRouterConfig } from '../types/openRouterTypes';
import { getAppConfig } from '../utils/config';
import { openRouterConfig, openRouterFallbackConfig, OpenRouterModelConfig } from '../utils/config';
import { basePrompt, translationPrompt } from './prompts';

/**
 * Сервис для работы с OpenRouter API с поддержкой fallback моделей
 */
export class OpenRouterService {
  constructor(private config: OpenRouterModelConfig = openRouterConfig) { }

  /**
   * Выполняет чат-запрос с поддержкой fallback моделей
   */
  async chatCompletion(
    messages: OpenRouterMessage[],
    options: Partial<OpenRouterConfig> = {}
  ): Promise<OpenRouterResponse> {
    // Если указана конкретная модель в options, используем только её
    if (options.model) {
      const customConfig = { ...this.config, ...options };
      return await this.chatCompletionWithModel(messages, customConfig, {});
    }

    // Пробуем основную модель
    try {
      return await this.chatCompletionWithModel(messages, this.config, options);
    } catch (error) {
      // Пробуем fallback модель
      try {
        return await this.chatCompletionWithModel(messages, openRouterFallbackConfig, options);
      } catch (fallbackError) {
        throw new Error(`Все модели не удались. Основная: ${error}. Fallback: ${fallbackError}`);
      }
    }
  }

  /**
   * Выполняет чат-запрос с конкретной моделью
   */
  private async chatCompletionWithModel(
    messages: OpenRouterMessage[],
    modelConfig: OpenRouterModelConfig,
    options: Partial<OpenRouterConfig> = {}
  ): Promise<OpenRouterResponse> {
    const startTime = Date.now();

    // Объединяем конфигурацию по умолчанию с опциями пользователя
    const config = { ...modelConfig, ...options };
    let lastError: Error | null = null;

    // Цикл повторных попыток при ошибках
    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        console.log(`OpenRouter API call attempt ${attempt}/${config.maxRetries} with model ${config.model}`);

        // Выполняем HTTP запрос к API
        const response = await this.makeAPIRequest(messages, config);

        // Проверяем, что API вернул валидный ответ
        if (!response.choices || response.choices.length === 0) {
          throw new Error('OpenRouter API не вернул вариантов ответа');
        }

        // Проверяем, что ответ содержит непустой контент
        const content = response.choices[0]?.message?.content;
        if (!content || content.trim().length === 0) {
          throw new Error('OpenRouter API вернул пустой ответ');
        }

        // Логируем успешное выполнение с метриками
        const duration = Date.now() - startTime;
        console.log(`OpenRouter API call completed successfully in ${duration}ms, model: ${config.model}, tokens: ${response.usage?.total_tokens || 'unknown'}`);

        return response;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`❌ OpenRouter API attempt ${attempt}/${config.maxRetries} failed (${config.model}):`, lastError.message);

        // Если это последняя попытка, выходим из цикла
        if (attempt === config.maxRetries) {
          break;
        }

        // Ждем перед следующей попыткой с jitter для предотвращения одновременных запросов
        const baseDelay = config.retryDelayMs * Math.pow(2, attempt);
        const jitter = Math.random() * config.retryJitterMs;
        await this.delay(baseDelay + jitter);
      }
    }

    // Если все попытки исчерпаны, логируем и выбрасываем финальную ошибку
    const totalDuration = Date.now() - startTime;
    console.error(`❌ OpenRouter API (${config.model}) failed after ${config.maxRetries} attempts in ${totalDuration}ms: ${lastError?.message}`);
    throw new Error(`OpenRouter API (${config.model}) failed after ${config.maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Выполняет непосредственный HTTP запрос к OpenRouter API
   */
  private async makeAPIRequest(messages: OpenRouterMessage[], config: OpenRouterModelConfig): Promise<OpenRouterResponse> {
    // Получаем токен из централизованной конфигурации
    const appConfig = getAppConfig();
    const token = appConfig.openRouterToken;

    // Создаем контроллер для отмены запроса по таймауту
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      // Отправляем POST запрос к OpenRouter Chat Completions API
      const response = await fetch(
        config.baseUrl,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`, // Токен OpenRouter
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://subtlegram.local', // Для ранжирования
            'X-Title': 'SubtleGram Subtitle Analyzer'   // Название приложения
          },
          body: JSON.stringify({
            model: config.model,              // Модель OpenRouter
            messages,                         // Сообщения в формате чата
            temperature: config.temperature,  // Креативность модели
            max_tokens: config.maxTokens,     // Максимальная длина ответа
          }),
          signal: controller.signal, // Сигнал для отмены по таймауту
        }
      );

      // Очищаем таймаут после успешного получения ответа
      clearTimeout(timeoutId);

      // Проверяем статус HTTP ответа
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenRouter API ошибка ${response.status}: ${errorData}`);
      }

      // Парсим JSON ответ
      const data = await response.json();
      return data as OpenRouterResponse;

    } catch (error) {
      // Очищаем таймаут в случае ошибки
      clearTimeout(timeoutId);

      // Конвертируем AbortError в более понятное сообщение
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`OpenRouter API таймаут после ${config.timeout}мс`);
      }

      // Пробрасываем остальные ошибки выше
      throw error;
    }
  }

  /**
   * Генерирует системный промпт для анализа перевода субтитров
   * @param type - тип анализа (пока поддерживается только 'translation')
   * @returns полный системный промпт для AI
   */
  generateSystemPrompt(): string {
    return `${basePrompt}${translationPrompt}`;
  }

  /**
   * Парсит структурированный ответ из текста AI
   * Ищет JSON в тексте, поддерживает маркеры <json> и обычный JSON
   */
  parseStructuredResponse(content: string): any {
    try {
      // Убираем <think> блоки, если они есть (некоторые модели думают вслух)
      let cleanContent = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

      // Сначала ищем JSON в маркерах <json>{ ... }</json>
      let jsonMatch = cleanContent.match(/<json>\s*(\{[\s\S]*?\})\s*<\/json>/) || cleanContent.match(/<json>\s*(\[[\s\S]*?\])\s*<\/json>/);

      // Если маркеры не найдены, ищем без них (legacy)
      if (!jsonMatch) {
        jsonMatch = cleanContent.match(/\{[\s\S]*\}/) || cleanContent.match(/\[[\s\S]*\]/);
      }

      // Если JSON не найден
      if (!jsonMatch) {
        throw new Error('JSON не найден в ответе');
      }

      // Извлекаем JSON строку
      const jsonString = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('Не удалось распарсить JSON ответ:', content);
      throw new Error(`Неверный JSON ответ от OpenRouter: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }

  /**
   * Вспомогательная функция задержки для retry логики
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * SINGLETON ПАТТЕРН для OpenRouter сервиса
 */
let openRouterServiceInstance: OpenRouterService | null = null;

/**
 * Получить единственный экземпляр OpenRouter сервиса
 */
export function getOpenRouterService(): OpenRouterService {
  if (!openRouterServiceInstance) {
    openRouterServiceInstance = new OpenRouterService();
  }
  return openRouterServiceInstance;
}
