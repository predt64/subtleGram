import { SlangCard, AIAnalysisResponse, AnalysisResult, OpenRouterMessage } from '../types';
import { getOpenRouterService } from './openRouterService';
import { getAnalysisConfig } from '../utils/config';
import { slangService } from './slangService';


/**
 * Высокоуровневый сервис анализа субтитров с использованием ИИ
 *
 * Основные возможности:
 * - Определение уровня сложности текста по шкале CEFR (A1-C2)
 * - Анализ грамматических особенностей с объяснениями на русском
 * - Генерация вариантов перевода (естественный и дословный)
 * - Извлечение и объяснение сленга из Urban Dictionary
 * - Кеширование результатов для оптимизации производительности
 *
 * Архитектура:
 * - Интегрируется с OpenRouter API для анализа текста ИИ
 * - Использует Urban Dictionary для обогащения сленгом
 * - Предоставляет плоскую структуру данных для фронтенда
 * - Реализует паттерн Singleton для консистентности
 */
export class AnalysisService {
  /**
   * Кеш проанализированных предложений для избежания повторных запросов к ИИ
   * Ключ: комбинация текста предложения и контекста, Значение: полный результат анализа
   */
  private sentenceCache: Map<string, AnalysisResult> = new Map();

  /**
   * Строит контекст предложения для анализа
   * @param sentenceText - основной текст предложения для анализа
   * @param context - опциональный контекст с предыдущим и следующим предложениями
   * @returns объект с текстом и окружающими предложениями для лучшего анализа ИИ
   */
  private buildSentenceContext(sentenceText: string, context?: { prev: string; next: string }): { text: string; prev: string; next: string } {
    return {
      text: sentenceText,
      prev: context?.prev || '',
      next: context?.next || ''
    };
  }

  /**
   * Создает пустой результат анализа для случаев когда текст отсутствует
   */
  private createEmptyResult(): AnalysisResult {
    return {
      text: '',
      cefr: 'A1',
      features: [],
      translations: [],
      explanation: '',
      slang: []
    };
  }

  /**
   * Генерирует уникальный ключ кеша на основе текста и контекста
   * @param sentenceContext - контекст предложения с текстом и окружающими репликами
   * @returns строка-ключ для кеширования
   */
  private generateCacheKey(sentenceContext: { text: string; prev: string; next: string }): string {
    return `${sentenceContext.text.trim()}|${sentenceContext.prev.trim()}|${sentenceContext.next.trim()}`;
  }

  /**
   * Выполняет анализ отдельного предложения с использованием ИИ
   *
   * Процесс анализа включает:
   * 1. Формирование системного промпта для ИИ
   * 2. Отправка запроса к OpenRouter API
   * 3. Парсинг структурированного ответа
   * 4. Преобразование в унифицированный формат
   *
   * @param context - контекст предложения с текстом и окружающими репликами
   * @param seriesName - название сериала для улучшения контекста анализа
   * @returns нормализованная структура анализа с данными от ИИ
   */
  async analyzeSentence(
    context: { text: string; prev: string; next: string },
    seriesName?: string
  ): Promise<AIAnalysisResponse> {
    const seriesInfo = seriesName ? ` из сериала "${seriesName}"` : '';
    const messages: OpenRouterMessage[] = [
      { role: 'system', content: getOpenRouterService().generateSystemPrompt() },
      {
        role: 'user', content: `Проанализируй эту фразу${seriesInfo}: "${context.text}". Контекст: предыдущая фраза "${context.prev}", следующая "${context.next}".`
      }
    ];

    const config = getAnalysisConfig('translation');
    const response = await getOpenRouterService().chatCompletion(messages, config);
    const content = response.choices[0]?.message?.content || '';
    const parsedResponse = getOpenRouterService().parseStructuredResponse(content);

    return {
      text: parsedResponse.text,
      cefr: parsedResponse.cefr,
      features: parsedResponse.features || [],
      translations: parsedResponse.translations || [],
      explanation: parsedResponse.explanation,
      slang: parsedResponse.slang || []
    };
  }

  /**
   * Обогащает сленгом из AI-ответа с обработкой ошибок
   * @param response - ответ AI содержащий массив терминов сленга
   * @returns массив карточек сленга из Urban Dictionary
   */
  async enrichWithSlangFromAI(response: string[]): Promise<SlangCard[]> {
    const slang = response || [];
    const cards: SlangCard[] = [];

    for (const term of slang) {
      try {
        const card = await slangService.fetchSlang(term);
        cards.push(...card);
      } catch (error) {
        console.warn(`Не удалось получить данные по сленгу "${term}":`, error);
        // Продолжаем обработку других терминов даже при ошибке одного
      }
    }

    return cards;
  }


  /**
   * Создает полную структуру анализа предложения для фронтенда с кешированием
   *
   * Основной публичный метод сервиса, который:
   * 1. Проверяет корректность входных данных
   * 2. Ищет результат в кеше для избежания повторных запросов
   * 3. Выполняет анализ через ИИ при необходимости
   * 4. Обогащает результат данными о сленге
   * 5. Сохраняет результат в кеш для будущих запросов
   *
   * @param options - параметры анализа предложения
   * @returns полная структура анализа с переводом и сленгом для фронтенда
   * @throws Error при неудачном анализе или обработке данных
   */
  async createTranslationGuide(
    options: {
      sentenceText: string;  // текст предложения для анализа
      context?: { prev: string; next: string };  // контекст предложения
      seriesName?: string;   // название сериала для контекста
    }
  ): Promise<AnalysisResult> {
    try {
      const sentenceContext = this.buildSentenceContext(options.sentenceText, options.context);

      // Ранний возврат для пустого текста без кеширования
      if (!sentenceContext.text.trim()) {
        return this.createEmptyResult();
      }

      const cacheKey = this.generateCacheKey(sentenceContext);
      if (this.sentenceCache.has(cacheKey)) {
        return this.sentenceCache.get(cacheKey)!;
      }

      const analysis = await this.analyzeSentence(sentenceContext, options.seriesName);

      // Добавляем сленг из Urban Dictionary
      const slangCards = await this.enrichWithSlangFromAI(analysis.slang);

      // Модифицируем analysis объект для фронтенда
      const result: AnalysisResult = {
        ...analysis,
        slang: slangCards
      };

      this.sentenceCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Ошибка создания гида перевода:', error);
      throw new Error(`Не удалось создать гид перевода: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }
}

/**
 * Глобальный экземпляр сервиса анализа (Singleton паттерн)
 *
 * Обеспечивает:
 * - Консистентность кеширования между запросами
 * - Экономию ресурсов (один экземпляр на приложение)
 * - Удобный импорт в контроллерах и других сервисах
 */
export const analysisService = new AnalysisService();

