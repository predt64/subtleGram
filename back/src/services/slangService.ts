import { SlangCard } from '../types';

/**
 * Сервис для интеграции с Urban Dictionary API
 *
 * Отвечает за:
 * - Запросы к неофициальному API Urban Dictionary
 * - Кэширование результатов для оптимизации
 * - Обработку ошибок и retry логику
 */
export class SlangService {
  private cache: Map<string, { data: SlangCard[]; timestamp: number; }> = new Map();
  private cacheTTL: number = 3600000; // 1 час в миллисекундах

  /**
   * Получает данные из Urban Dictionary для указанного термина
   */
  async fetchSlang(term: string): Promise<SlangCard[]> {
    const cached = this.getFromCache(term);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`https://unofficialurbandictionaryapi.com/api/search?term=${encodeURIComponent(term)}&limit=2`);
      if (!response.ok) {
        throw new Error(`UD API error: ${response.status}`);
      }
      const data: any = await response.json();

      const list = Array.isArray(data.data) ? data.data : [];
      const slangCards: SlangCard[] = list.slice(0, 2).map((item: any) => ({
        tokenId: -1,
        term,
        ud: {
          definition: item.meaning || 'No definition',
          example: item.example || 'No example',
          thumbs_up: 0, // Реальный API не имеет thumbs_up/thumbs_down, но оставим для совместимости
          thumbs_down: 0,
          permalink: `https://urbandictionary.com/define.php?term=${encodeURIComponent(term)}` // Генерируем, так как API не возвращает
        }
      }));

      this.setCache(term, slangCards);
      return slangCards;
    } catch (error) {
      console.error(`Ошибка при запросе к UD для "${term}":`, error);
      return [];
    }
  }

  /**
   * Парсит slang из AI-ответа и дергает UD
   */
  async enrichWithSlangFromAI(response: any): Promise<SlangCard[]> {
    const slang = response.slang || [];
    const cards = [];
    for (const term of slang) {
      const card = await this.fetchSlang(term);
      cards.push(...card);
    }
    return cards;
  }

  /**
   * Получает данные из кэша
   */
  private getFromCache(term: string): SlangCard[] | null {
    const entry = this.cache.get(term);
    if (entry && Date.now() - entry.timestamp < this.cacheTTL) {
      return entry.data;
    }
    if (entry) {
      this.cache.delete(term); // Удаляем устаревший
    }
    return null;
  }

  /**
   * Устанавливает данные в кэш
   */
  private setCache(term: string, data: SlangCard[]): void {
    this.cache.set(term, { data, timestamp: Date.now() });
  }

  /**
   * Очищает кэш
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Экземпляр сервиса сленга (singleton)
 */
export const slangService = new SlangService();
