import { TranslationGuide, TranslationSegment, TranslationVariant } from '../types';
import { getOpenRouterService, OpenRouterMessage } from './openRouterService';
import { getAnalysisConfig } from '../utils/config';
import { slangService } from './slangService';

/**
 * Структура ответа от Qwen AI анализа
 */
// Удален - теперь используем прямой парсинг нового формата

/**
 * Высокоуровневый сервис анализа субтитров с использованием Qwen AI
 *
 * Предоставляет комплексный анализ английских субтитров для изучения языка:
 * - Определение уровня сложности текста
 * - Анализ словарного запаса
 * - Проверка грамматики
 * - Извлечение тем и рекомендаций
 */
export class AnalysisService {
  private sentenceCache: Map<string, TranslationGuide> = new Map();

  /**
   * Строит контекст предложения
   */
  private buildSentenceContext(sentenceText: string, context?: { prev: string; next: string }): { text: string; prev: string; next: string } {
    return {
      text: sentenceText,
      prev: context?.prev || '',
      next: context?.next || ''
    };
  }

  /**
   * Анализирует предложение
   */
  async analyzeSentence(context: { text: string; prev: string; next: string }, seriesName?: string): Promise<any> {
    const seriesInfo = seriesName ? ` из сериала "${seriesName}"` : '';
    const messages: OpenRouterMessage[] = [
      { role: 'system', content: getOpenRouterService().generateSystemPrompt('translation') },
      {
        role: 'user', content: `Проанализируй эту фразу${seriesInfo}: "${context.text}". Контекст: предыдущая фраза "${context.prev}", следующая "${context.next}".

Дай подробный разбор грамматики: объясни каждое правило, почему именно оно используется здесь. Особое внимание удели сложным конструкциям. Ответь на русском языке.` }
    ];
    const config = getAnalysisConfig('translation');
    const response = await getOpenRouterService().chatCompletion(messages, config);
    const content = response.choices[0]?.message?.content || '';
    const parsedResponse = getOpenRouterService().parseStructuredResponse(content);

    // Возвращаем в формате совместимом с transformAiResponse
    return {
      text: parsedResponse.text,
      difficulty: parsedResponse.difficulty,
      features: parsedResponse.features,
      translations: parsedResponse.translations || [],
      explanation: parsedResponse.explanation,
      slang: parsedResponse.slang || []
    };
  }

  /**
   * Обогащает сленгом из AI-ответа
   */
  async enrichWithSlangFromAI(response: any): Promise<any[]> {
    const slang = response.slang || [];
    const cards = [];
    for (const term of slang) {
      const card = await slangService.fetchSlang(term);
      cards.push(...card);
    }
    return cards;
  }

  /**
   * Преобразует ответ AI в структуру TranslationGuide
   */
  private transformAiResponse(aiResponse: any, sentenceText: string): TranslationGuide {
    // Создаем упрощенную структуру на основе AI ответа
    const segment: TranslationSegment = {
      text: aiResponse.text || sentenceText,
      difficulty: aiResponse.difficulty || { cefr: 'B1' },
      features: (aiResponse.features || []).map((f: any) => ({
        rule: f.rule,
        russian: f.russian
      }))
    };

    // Преобразуем translations в нужный формат
    const translation = {
      variants: (aiResponse.translations || []).map((t: any) => ({
        style: t.style || 'natural',
        text: t.text || ''
      })) as TranslationVariant[],
      explanation: aiResponse.explanation || 'Объяснение недоступно'
    };

    // Slang будет добавлен отдельно через enrichWithSlangFromAI
    return {
      segments: [segment],
      translations: [translation],
      slang: []
    };
  }

  /**
   * Создает TranslationGuide для предложения
   */
  async createTranslationGuide(
    options: {
      sentenceText: string;  // текст предложения для анализа
      context?: { prev: string; next: string };  // контекст предложения
      seriesName?: string;   // название сериала для контекста
    }
  ): Promise<TranslationGuide> {
    const sentenceContext = this.buildSentenceContext(options.sentenceText, options.context);
    if (!sentenceContext.text) return { segments: [], translations: [], slang: [] };

    const cacheKey = sentenceContext.text;
    if (this.sentenceCache.has(cacheKey)) {
      return this.sentenceCache.get(cacheKey)!;
    }

    const analysis = await this.analyzeSentence(sentenceContext, options.seriesName);

    // Преобразуем ответ AI в TranslationGuide
    const guide = this.transformAiResponse(analysis, options.sentenceText);

    // Добавляем сленг из Urban Dictionary (используем slang термины из AI ответа)
    guide.slang = await this.enrichWithSlangFromAI({ slang: analysis.slang });

    this.sentenceCache.set(cacheKey, guide);
    return guide;
  }
}

/**
 * Экземпляр сервиса анализа (singleton)
 * Используется во всем приложении для обеспечения консистентности
 */
export const analysisService = new AnalysisService();

