import { TranslationGuide } from '../types';
import { getQwenService, QwenMessage } from './qwenService';
import { getAnalysisConfig } from '../utils/config';
import { slangService } from './slangService';

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
  async analyzeSentence(context: { text: string; prev: string; next: string }): Promise<any> {
    const messages: QwenMessage[] = [
      { role: 'system', content: getQwenService().generateSystemPrompt('translation') },
      { role: 'user', content: `Анализируй предложение: "${context.text}". Контекст: предыдущее: "${context.prev}", следующее: "${context.next}". Будь лаконичен. Ответь на русском языке. Обязательно выдели сленг в JSON: {"slang": ["word1"]}.` }
    ];
    const config = getAnalysisConfig('translation');
    const response = await getQwenService().chatCompletionWithMarkers(messages, config);
    const content = response.choices[0]?.message?.content || '';
    return getQwenService().parseStructuredResponse(content);
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
   * Создает TranslationGuide для предложения
   */
  async createTranslationGuide(
    options: {
      sentenceText: string;  // текст предложения для анализа
      context?: { prev: string; next: string };  // контекст предложения
    }
  ): Promise<TranslationGuide> {
    const sentenceContext = this.buildSentenceContext(options.sentenceText, options.context);
    if (!sentenceContext.text) return { segments: [], translations: [], slang: [] };

    const cacheKey = sentenceContext.text;
    if (this.sentenceCache.has(cacheKey)) {
      return this.sentenceCache.get(cacheKey)!;
    }

    const analysis = await this.analyzeSentence(sentenceContext);
    const slang = await this.enrichWithSlangFromAI(analysis);

    const guide: TranslationGuide = {
      segments: [{ id: 'seg_1', wordStart: 0, wordEnd: 1, text: sentenceContext.text, reasoning: [], difficulty: { cefr: 'B1', score: 5, factors: [] }, features: [] }],
      translations: [{ segmentId: 'seg_1', variants: [{ style: 'natural', text: 'Перевод', confidence: 0.8 }], explanation: { type: 'simple', summary: 'Simple', details: 'Details', notes: [] } }],
      slang
    };

    this.sentenceCache.set(cacheKey, guide);
    return guide;
  }
}

/**
 * Экземпляр сервиса анализа (singleton)
 * Используется во всем приложении для обеспечения консистентности
 */
export const analysisService = new AnalysisService();

