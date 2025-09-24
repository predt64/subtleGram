import { SubtitleEntry, Token } from '../types';
import { extractSentences } from './sentenceUtils';

/**
 * Утилита для токенизации субтитров
 * Разбивает текст на токены и работает с предложениями
 */
export function tokenizeSubtitles(subtitles: SubtitleEntry[]): Token[] {
  const tokens: Token[] = [];
  let globalId = 0;
  let charOffset = 0;

  subtitles.forEach((entry, entryIndex) => {
    const words = entry.text.split(/\s+/);
    let localCharPos = 0;

    words.forEach(word => {
      if (word.trim()) {
        const norm = word.replace(/'m$/, ' am').replace(/'s$/, ' is').replace(/'re$/, ' are').replace(/'ll$/, ' will');
        tokens.push({
          id: globalId++,
          entryIndex,
          charStart: charOffset + localCharPos,
          charEnd: charOffset + localCharPos + word.length,
          text: word,
          norm
        });
        localCharPos += word.length + 1;
      }
    });
    charOffset += entry.text.length + 1;
  });

  return tokens;
}

export function extractSentenceFromPosition(subtitles: SubtitleEntry[], position: number): string {
  const tokens = tokenizeSubtitles(subtitles);
  const token = tokens.find(t => position >= t.charStart && position < t.charEnd);
  if (!token) return '';

  const entry = subtitles[token.entryIndex];
  if (!entry) return '';

  const sentences = extractSentences(entry.text);
  const sentenceIndex = sentences.findIndex(s => s.includes(token.text));
  return sentenceIndex >= 0 ? (sentences[sentenceIndex] || entry.text) : entry.text;
}
