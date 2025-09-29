
/**
 * Сообщение для Qwen API
 * Соответствует формату чата OpenAI/ChatML
 */
export interface QwenMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Ответ от Qwen API
 * Структура соответствует Chat Completions API
 */
export interface QwenResponse {
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Конфигурация для запросов к Qwen API
 * Параметры влияют на поведение AI модели
 */
export interface QwenConfig {
  model: string;        // Название модели Qwen
  temperature: number;  // Креативность ответа (0.0 - 1.0)
  maxTokens: number;    // Максимальное количество токенов в ответе
  timeout: number;      // Таймаут запроса в миллисекундах
  maxRetries: number;   // Максимальное количество попыток при ошибках
}

/**
 * Низкоуровневый сервис для взаимодействия с Qwen API через Hugging Face
 *
 * Отвечает за:
 * - Отправку HTTP запросов к Hugging Face API
 * - Retry логику с exponential backoff
 * - Парсинг структурированных ответов
 * - Генерацию системных промптов
 */
import { getAppConfig } from '../utils/config';

export class QwenService {
  private config: QwenConfig;

  /**
   * Конструктор сервиса Qwen
   * Инициализирует конфигурацию и проверяет наличие токена доступа
   */
  constructor() {
    // Получаем токен из централизованной конфигурации
    const appConfig = getAppConfig();
    const token = appConfig.hfToken;
    if (!token) {
      throw new Error('HF_TOKEN не найден в конфигурации приложения');
    }

    // Устанавливаем конфигурацию по умолчанию для Qwen 3 Next
    this.config = {
      model: 'Qwen/Qwen3-Next-80B-A3B-Instruct', // Лучшая модель Qwen для анализа текста
      temperature: 0.7,    // Средняя креативность для баланса точности и разнообразия
      maxTokens: 2000,     // Достаточно для подробных анализов
      timeout: 30000,      // 30 секунд таймаут
      maxRetries: 3        // 3 попытки при ошибках сети
    };
  }

  /**
   * Выполняет чат-запрос к Qwen API с автоматическими повторными попытками
   *
   * Особенности:
   * - Автоматические повторные попытки при ошибках (exponential backoff)
   * - Таймауты и отмена запросов
   * - Валидация ответов от API
   * - Детальное логирование процесса
   */
  async chatCompletion(
    messages: QwenMessage[],
    options: Partial<QwenConfig> = {}
  ): Promise<QwenResponse> {
    // Объединяем конфигурацию по умолчанию с опциями пользователя
    const config = { ...this.config, ...options };
    let lastError: Error | null = null;

    // Цикл повторных попыток при ошибках
    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        console.log(`Qwen API call attempt ${attempt}/${config.maxRetries}`);

        // Выполняем HTTP запрос к API
        const response = await this.makeAPIRequest(messages, config);

        // Проверяем, что API вернул валидный ответ
        if (!response.choices || response.choices.length === 0) {
          throw new Error('Qwen API не вернул вариантов ответа');
        }

        return response;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`❌ Qwen API попытка ${attempt} не удалась:`, lastError.message);

        // Если это последняя попытка, выходим из цикла
        if (attempt === config.maxRetries) {
          break;
        }

        // Ждем перед следующей попыткой (exponential backoff: 1s, 2s, 4s...)
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    // Если все попытки исчерпаны, выбрасываем финальную ошибку
    throw new Error(`Qwen API не удался после ${config.maxRetries} попыток: ${lastError?.message}`);
  }

  /**
   * Выполняет непосредственный HTTP запрос к Hugging Face API
   *
   * Использует:
   * - AbortController для отмены запросов по таймауту
   * - Bearer токен для аутентификации
   * - Структурированный JSON payload для Chat Completions API
   * - Детальную обработку ошибок HTTP
   */
  private async makeAPIRequest(messages: QwenMessage[], config: QwenConfig): Promise<QwenResponse> {
    // Получаем токен из централизованной конфигурации
    const appConfig = getAppConfig();
    const token = appConfig.hfToken;

    // Создаем контроллер для отмены запроса по таймауту
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      // Отправляем POST запрос к Hugging Face Chat Completions API
      const response = await fetch(
        'https://router.huggingface.co/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`, // Токен Hugging Face
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: `${config.model}:together`, // Qwen модель через Together AI
            messages,                           // Сообщения в формате чата
            temperature: config.temperature,    // Креативность модели
            max_tokens: config.maxTokens,       // Максимальная длина ответа
          }),
          signal: controller.signal, // Сигнал для отмены по таймауту
        }
      );

      // Очищаем таймаут после успешного получения ответа
      clearTimeout(timeoutId);

      // Проверяем статус HTTP ответа
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Qwen API ошибка ${response.status}: ${errorData}`);
      }

      // Парсим JSON ответ
      const data = await response.json();
      return data as QwenResponse;

    } catch (error) {
      // Очищаем таймаут в случае ошибки
      clearTimeout(timeoutId);

      // Конвертируем AbortError в более понятное сообщение
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Qwen API таймаут после ${config.timeout}мс`);
      }

      // Пробрасываем остальные ошибки выше
      throw error;
    }
  }

  /**
   * Генерирует системный промпт для разных типов анализа субтитров
   *
   * Каждый промпт содержит:
   * - Роль преподавателя английского языка
   * - Конкретные инструкции по типу анализа
   * - Формат ожидаемого JSON ответа
   * - Критерии оценки для консистентности
   */
  generateSystemPrompt(analysisType: 'translation'): string {
    // Базовый промпт, устанавливающий роль AI как преподавателя
    const basePrompt = 'You are an expert English language teacher analyzing subtitles for language learners. Provide detailed, accurate analysis.';

    switch (analysisType) {
      case 'translation':
        return `${basePrompt} Analyze the sentence: [text]. Context: previous: [prev], next: [next]. Be concise but comprehensive. Explain grammar, slang, and specifics. Obligatory: Highlight slang/idioms in end JSON: {"slang": ["word1", "word2"]}. Example JSON: {"slang": []}.`;

      default:
        return basePrompt;
    }
  }

  /**
   * Парсит структурированный JSON ответ от Qwen AI
   *
   * Особенности:
   * - Ищет JSON объект { ... } или массив [ ... ] в маркерах <json>...</json>
   * - Если маркеры не найдены, ищет без них (legacy)
   * - Вырезает и парсит только JSON часть
   * - Устойчив к дополнительному тексту вокруг JSON
   */
  parseStructuredResponse(content: string): any {
    try {
      // Сначала ищем JSON в маркерах <json>{ ... }</json>
      let jsonMatch = content.match(/<json>\s*(\{[\s\S]*?\})\s*<\/json>/) || content.match(/<json>\s*(\[[\s\S]*?\])\s*<\/json>/);

      // Если маркеры не найдены, ищем без них (legacy)
      if (!jsonMatch) {
        jsonMatch = content.match(/\{[\s\S]*\}/) || content.match(/\[[\s\S]*\]/);
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
      throw new Error(`Неверный JSON ответ от Qwen: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }

  /**
   * Выполняет чат-запрос с принудительным оборачиванием ответа в маркеры
   * Для новых типов анализа (segmentation, translation)
   */
  async chatCompletionWithMarkers(
    messages: QwenMessage[],
    options: Partial<QwenConfig> = {}
  ): Promise<QwenResponse> {
    // Добавляем инструкцию в последнее сообщение
    const modifiedMessages = [...messages];
    if (modifiedMessages.length > 0) {
      const lastMessage = modifiedMessages[modifiedMessages.length - 1];
      if (lastMessage) {
        lastMessage.content += '\n\nВажно: Оберни JSON в <json> и </json> теги для точного парсинга.';
      }
    }
    return this.chatCompletion(modifiedMessages, options);
  }

  /**
   * Вспомогательная функция задержки для retry логики
   * Используется для создания пауз между повторными попытками
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Проверяет валидность API токена Hugging Face
   *
   * Выполняет тестовый запрос к API с минимальными параметрами.
   * Возвращает true если токен работает, false в противном случае.
   */
  async validateToken(): Promise<boolean> {
    try {
      // Пробуем выполнить минимальный запрос для проверки токена
      await this.chatCompletion([
        { role: 'user', content: 'Hello' } // Простое тестовое сообщение
      ], { maxTokens: 10 }); // Минимальная длина ответа
      return true; // Если запрос прошел, токен валиден
    } catch (error) {
      return false; // Если запрос не прошел, токен невалиден
    }
  }
}

/**
 * SINGLETON ПАТТЕРН
 *
 * Ленивая инициализация - экземпляр сервиса создается только при первом использовании.
 * Это гарантирует, что:
 * - Только один экземпляр QwenService существует в приложении
 * - Экономится память и ресурсы
 * - Все части приложения используют один и тот же клиент API
 */
let qwenServiceInstance: QwenService | null = null;

/**
 * Получить единственный экземпляр сервиса Qwen
 * Используется во всем приложении для обеспечения консистентности
 */
export function getQwenService(): QwenService {
  if (!qwenServiceInstance) {
    qwenServiceInstance = new QwenService();
  }
  return qwenServiceInstance;
}
