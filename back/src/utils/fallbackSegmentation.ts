import { Token, TranslationSegment } from '../types';

/**
 * Fallback сегментация без AI
 * Использует эвристики для объединения реплик
 */
export function fallbackSegment(tokens: Token[], _text: string): TranslationSegment[] { // _text unused
  const segments: TranslationSegment[] = [];
  let currentSegment: Token[] = [];
  const linkWords = new Set(['and', 'but', 'so', 'because', 'then', 'however', 'moreover']);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token) continue; // Пропускаем undefined
    currentSegment.push(token);

    // Проверяем, короткий ли сегмент и связующий ли следующий
    if (currentSegment.length < 5 && i < tokens.length - 1) {
      const nextToken = tokens[i + 1];
      if (nextToken && (linkWords.has(nextToken.text.toLowerCase()) || nextToken.text.match(/^(this|that|it)$/i))) {
        continue; // Продолжаем сегмент
      }
    }

    // Создаем сегмент
    if (currentSegment.length > 0) {
      const first = currentSegment[0];
      const last = currentSegment[currentSegment.length - 1];
      if (first && last) {
        segments.push({
          id: `fallback_${segments.length}`,
          wordStart: first.id, // Используем id вместо wordStart
          wordEnd: last.id + 1, // +1 для end
          text: currentSegment.map(t => t.text).join(' '),
          reasoning: ['fallback_heuristic'],
          difficulty: { cefr: 'B1', score: 5, factors: [] },
          features: []
        });
      }
      currentSegment = [];
    }
  }

  return segments;
}
