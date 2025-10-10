import { SlangCard } from '../types';
import { slangConfig } from '../utils/config';

/**
 * Структура ответа от Urban Dictionary API
 */
interface UrbanDictionaryResponse {
  data: Array<{
    meaning: string;
    example: string;
    // Другие поля могут быть добавлены по необходимости
  }>;
}

/**
 * Сервис для интеграции с Urban Dictionary API
 *
 * Основные возможности:
 * - Получение определений и примеров сленговых выражений
 * - Кеширование результатов для оптимизации производительности
 * - Graceful degradation при ошибках внешнего API
 * - Ограничение количества результатов для управляемости
 *
 * Особенности:
 * - Использует неофициальный API Urban Dictionary
 * - Кеширует результаты на 1 час для снижения нагрузки
 * - При ошибках возвращает пустой массив вместо выброса исключений
 * - Ограничивается одним лучшим результатом для простоты
 */
export class SlangService {
  /**
   * Кеш результатов запросов к Urban Dictionary
   * Ключ: термин сленга, Значение: массив карточек + timestamp
   */
  private cache: Map<string, { data: SlangCard[]; timestamp: number; }> = new Map();

  /**
   * Получает определение сленгового термина из Urban Dictionary
   *
   * Процесс:
   * 1. Проверяет наличие в кеше
   * 2. При отсутствии делает запрос к API
   * 3. Обрабатывает и структурирует ответ
   * 4. Сохраняет в кеш для будущих запросов
   *
   * @param term - сленговый термин для поиска
   * @returns массив карточек с определениями (обычно 1 элемент)
   * @throws никогда - при ошибках возвращает пустой массив
   */
  async fetchSlang(term: string): Promise<SlangCard[]> {
    // Валидация входных данных
    if (!term || typeof term !== 'string' || term.trim().length === 0) {
      return [];
    }

    const cleanTerm = term.trim().toLowerCase();

    const cached = this.getFromCache(cleanTerm);
    if (cached) {
      return cached;
    }

    try {
      const startTime = Date.now();

      const response = await fetch(`https://unofficialurbandictionaryapi.com/api/search?term=${encodeURIComponent(cleanTerm)}&limit=${slangConfig.apiLimit}`);
      if (!response.ok) {
        throw new Error(`UD API error: ${response.status}`);
      }
      const data = await response.json() as UrbanDictionaryResponse;

      const duration = Date.now() - startTime;
      console.log(`Urban Dictionary API call for "${cleanTerm}" completed in ${duration}ms, results: ${data.data?.length || 0}`);

      const list = Array.isArray(data.data) ? data.data : [];
      const slangCards: SlangCard[] = list.slice(0, 1).map((item) => ({
        term: cleanTerm,
        ud: {
          definition: item.meaning || 'No definition',
          example: item.example || 'No example',
          permalink: `https://urbandictionary.com/define.php?term=${encodeURIComponent(cleanTerm)}`
        }
      }));

      this.setCache(cleanTerm, slangCards);
      return slangCards;
    } catch (error) {
      console.error(`Ошибка при запросе к UD для "${cleanTerm}":`, error);
      return [];
    }
  }


  /**
   * Извлекает данные из кеша, если они не устарели
   * Автоматически очищает просроченные записи
   *
   * @param term - термин для поиска в кеше
   * @returns кешированные данные или null
   */
  private getFromCache(term: string): SlangCard[] | null {
    const entry = this.cache.get(term);
    if (entry && Date.now() - entry.timestamp < slangConfig.cacheTTL) {
      return entry.data;
    }
    if (entry) {
      this.cache.delete(term); // Удаляем устаревший
    }
    return null;
  }

  /**
   * Сохраняет данные в кеш с текущей меткой времени
   *
   * @param term - термин, для которого сохраняются данные
   * @param data - массив карточек для сохранения
   */
  private setCache(term: string, data: SlangCard[]): void {
    this.cache.set(term, { data, timestamp: Date.now() });
  }

}

/**
 * Глобальный экземпляр сервиса сленга (Singleton паттерн)
 *
 * Обеспечивает:
 * - Консистентность кеша между запросами
 * - Экономию ресурсов (один экземпляр на приложение)
 * - Удобный импорт в других сервисах
 */
export const slangService = new SlangService();
