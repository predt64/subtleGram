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
import { getAppConfig } from '../utils/config';
import { openRouterConfig, openRouterFallbackConfig, OpenRouterModelConfig } from '../utils/config';

/**
 * Сервис для работы с OpenRouter API с поддержкой fallback моделей
 */
export class OpenRouterService {
  constructor(private config: OpenRouterModelConfig = openRouterConfig) {}

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

        return response;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`❌ OpenRouter API attempt ${attempt}/${config.maxRetries} failed (${config.model}):`, lastError.message);

        // Если это последняя попытка, выходим из цикла
        if (attempt === config.maxRetries) {
          break;
        }

        // Ждем перед следующей попыткой (exponential backoff: 1s, 2s, 4s...)
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    // Если все попытки исчерпаны, выбрасываем финальную ошибку
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
   * Генерирует системный промпт для разных типов анализа субтитров
   */
  generateSystemPrompt(type: 'translation' | 'difficulty' | 'vocabulary' | 'grammar' | 'comprehensive' | 'topics'): string {
    const basePrompt = `Ты - ИИ для анализа английских субтитров. Твоя задача - анализировать фразы и возвращать результат строго в формате JSON.

ВАЖНЫЕ ПРАВИЛА:
1. Анализируй только предоставленный текст
2. Игнорируй артефакты субтитров (многоточия, тире, HTML-теги)
3. Будь точным и конкретным
4. ВСЕГДА отвечай ТОЛЬКО валидным JSON без дополнительного текста
5. НИКОГДА не добавляй объяснения или комментарии вне JSON

СТРОГИЙ ФОРМАТ ОТВЕТА:
- Начинай ответ непосредственно с {
- Заканчивай ответ непосредственно на }
- Никаких <think>, "Конечно" или других слов`;

    switch (type) {
      case 'translation':
        return `${basePrompt}


ПРАВИЛА АНАЛИЗА:
1. УРОВЕНЬ СЛОЖНОСТИ: Выбери один уровень CEFR (A1, A2, B1, B2, C1, C2) на основе грамматических конструкций
2. ГРАММАТИЧЕСКИЕ ОСОБЕННОСТИ: Найди 2-5 ключевых правил. КАЖДОЕ правило должно иметь:
   - "rule": краткое название на английском (max 50 символов)
   - "russian": название на русском (max 50 символов)
   - НЕ ДОБАВЛЯЙ другие поля в features!
3. ПЕРЕВОДЫ: Создай 2 варианта:
   - "natural": естественный разговорный перевод
   - "literal": дословный перевод
4. ОБЪЯСНЕНИЕ: Краткий текст (max 200 символов) о грамматике и переводе
5. СЛЕНГ: Массив слов на английском, которые являются сленгом или разговорными выражениями

СТРОГИЕ ТРЕБОВАНИЯ:
- НЕ добавляй поля, которых нет в примере
- НЕ добавляй объяснения к отдельным правилам в features
- НЕ добавляй confidence, priority, examples или другие поля
- Массивы features и translations НЕ должны быть пустыми
- Значение "cefr" должно быть одной из: A1, A2, B1, B2, C1, C2

ОБЯЗАТЕЛЬНО верни ТОЛЬКО этот JSON:

{
  "text": "If I were you, I'd stay home.",
  "difficulty": {
    "cefr": "B1"
  },
  "features": [
    {
      "rule": "Second Conditional",
      "russian": "Второе условное наклонение"
    },
    {
      "rule": "Subjunctive were",
      "russian": "Сослагательное наклонение were"
    },
    {
      "rule": "I'd contraction",
      "russian": "сокращение I would"
    }
  ],
  "translations": [
    {
      "style": "natural",
      "text": "Если бы я был на твоем месте, я бы остался дома."
    },
    {
      "style": "literal",
      "text": "Если я был тобой, я остался бы дома."
    }
  ],
  "explanation": "Второе условное наклонение описывает гипотетическую ситуацию в настоящем/будущем. Were используется вместо was для всех лиц. I'd = I would.",
  "slang": []
}`;

      default:
        return basePrompt;
    }
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
