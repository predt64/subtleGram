/**
 * Моковые данные субтитров для демо-режима
 */

export interface MockSubtitle {
  id: number;
  text: string;
  start: string;
  end: string;
}

// Пул слов из lorem ipsum для генерации случайных предложений
const loremWords = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do",
  "eiusmod", "tempor", "incididunt", "ut", "labore", "dolore", "magna", "aliqua", "enim", "ad",
  "minim", "veniam", "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi", "aliquip",
  "ex", "ea", "commodo", "consequat", "duis", "aute", "irure", "reprehenderit", "voluptate",
  "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "occaecat", "cupidatat",
  "non", "proident", "sunt", "culpa", "deserunt", "mollit", "anim", "est", "laborum", "unde",
  "omnis", "iste", "natus", "error", "voluptatem", "accusantium", "doloremque", "laudantium",
  "totam", "rem", "aperiam", "eaque", "ipsa", "quae", "illo", "inventore", "veritatis", "quasi",
  "architecto", "beatae", "vitae", "dicta", "explicabo", "nemo", "quia", "voluptas", "aspernatur",
  "aut", "odit", "fugit", "consequuntur", "magni", "dolores", "eos", "neque", "porro", "quisquam",
  "adipisci", "vero", "accusamus", "iusto", "odio", "dignissimos", "ducimus", "blanditiis",
  "praesentium", "voluptatum", "deleniti", "corrupti", "harum", "quidem", "rerum", "facilis",
  "expedita", "distinctio", "libero", "tempore", "soluta", "nobis", "eligendi", "temporibus",
  "autem", "quibusdam", "officiis", "debitis", "necessitatibus", "saepe", "eveniet", "repudiandae",
  "molestiae", "recusandae", "earum", "tenetur", "sapiente", "delectus", "reiciendis", "voluptatibus",
  "maiores", "alias", "consequatur", "perferendis", "asperiores", "repellat", "itaque", "ratione",
  "sequi", "nesciunt", "illum", "quem", "fugiam", "quo", "nostrum", "exercitationem", "ullam",
  "corporis", "suscipit", "laboriosam", "nisi", "aliquid", "modi", "tempora", "incidunt", "magnam",
  "aliquam", "quaerat", "minima", "nostra", "expedita", "distinctio", "nam", "libero", "tempore",
  "soluta", "nobis", "eligendi", "option", "quod", "maxime", "placeat", "facere", "possimus",
  "assumenda", "repellendus", "temporibus", "quibusdam", "officiis", "debitis", "autem", "necessitatibus"
];

/**
 * Генерирует случайное предложение из пула слов lorem ipsum
 * @param minWords - минимальное количество слов (по умолчанию 3)
 * @param maxWords - максимальное количество слов (по умолчанию 12)
 */
function generateRandomLoremSentence(minWords: number = 3, maxWords: number = 12): string {
  const wordCount = Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
  const words: string[] = [];

  for (let i = 0; i < wordCount; i++) {
    const randomWord = loremWords[Math.floor(Math.random() * loremWords.length)]!;
    words.push(randomWord);
  }

  // Первое слово с заглавной буквы, последнее с точкой
  if (words.length > 0) {
    words[0] = words[0]!.charAt(0).toUpperCase() + words[0]!.slice(1);
    words[words.length - 1] = words[words.length - 1]! + '.';
  }

  return words.join(' ');
}

// Генерация 500 субтитров со случайными lorem ipsum предложениями
export const mockSubtitles: MockSubtitle[] = Array.from({ length: 500 }, (_, index) => {
  const id = index + 1;
  const text = generateRandomLoremSentence(4, 15); // 4-15 слов в предложении

  // Рассчитываем время: каждый субтитр длится 3-5 секунд
  const startSeconds = id * 5; // 5 секунд между субтитрами
  const duration = 3 + Math.random() * 2; // 3-5 секунд длительности
  const endSeconds = startSeconds + duration;

  // Форматируем время в SRT формат (HH:MM:SS,mmm)
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  };

  return {
    id,
    text,
    start: formatTime(startSeconds),
    end: formatTime(endSeconds)
  };
});

/**
 * Преобразовать моковые субтитры в формат SentenceCard для совместимости
 */
export function convertMockToSentenceCards(mockSubs: MockSubtitle[]) {
  return mockSubs.map(sub => ({
    id: sub.id,
    text: sub.text,
    start: sub.start,
    end: sub.end,
    sourceIds: [sub.id]
  }));
}

/**
 * Получить демо-субтитры в формате SentenceCard
 */
export const mockSentenceCards = convertMockToSentenceCards(mockSubtitles);
