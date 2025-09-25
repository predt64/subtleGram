import { SubtitleEntry, Token } from '../types';

/**
 * Утилита для токенизации субтитров
 * Разбивает текст на токены
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
        tokens.push({
          id: globalId++,
          entryIndex,
          charStart: charOffset + localCharPos,
          charEnd: charOffset + localCharPos + word.length,
          text: word
        });
        localCharPos += word.length + 1;
      }
    });
    charOffset += entry.text.length + 1;
  });

  return tokens;
}

