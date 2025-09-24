import { split } from 'sentence-splitter';

/**
 * Утилита для работы с предложениями
 * Парсит текст на предложения и извлекает контекст
 */
export function extractSentences(text: string): string[] {
  if (!text || text.trim() === '') {
    return [];
  }
  const sentences = split(text).filter(node => node.type === 'Sentence').map(node => node.raw);
  return sentences.length > 0 ? sentences : [text]; // Fallback на весь текст
}

export function getSentenceContext(text: string, sentenceIndex: number): { prev: string; current: string; next: string } {
  const sentences = extractSentences(text);
  if (sentences.length === 0) {
    return { prev: '', current: text, next: '' };
  }
  const current = sentences[sentenceIndex] || text;
  const prev = sentenceIndex > 0 ? (sentences[sentenceIndex - 1] || '') : '';
  const next = sentenceIndex < sentences.length - 1 ? (sentences[sentenceIndex + 1] || '') : '';
  return { prev, current, next };
}
