/**
 * Моковые данные для демонстрации AI анализа в демо-режиме
 */

export interface MockAnalysisResponse {
  translation: {
    natural: string;
    literal: string;
  };
  slang: Array<{
    term: string;
    definition: string;
    example: string;
  }>;
  explanation: string;
}

// Моковые ответы для демонстрации интерфейса в демо-режиме
export const mockAnalysisResponses: Record<string, MockAnalysisResponse> = {
  default: {
    translation: {
      natural: "Это тестовый перевод. В демо-режиме показываются примерные данные для демонстрации интерфейса.",
      literal: "Это тестовый перевод. В демо-режиме показываются примерные данные для демонстрации интерфейса."
    },
    slang: [
      {
        term: "test",
        definition: "Тестовый термин для демонстрации поиска сленга",
        example: "This is just a test example."
      }
    ],
    explanation: "Это демо-данные, которые не сохраняются. Для каждого анализа предложения будет браться случайный ответ."
  },

  complex: {
    translation: {
      natural: "Это другой пример тестового перевода. Демо-режим показывает примерные данные.",
      literal: "Это другой пример тестового перевода. Демо-режим показывает примерные данные."
    },
    slang: [],
    explanation: "Это демо-данные, которые не сохраняются. Для каждого анализа предложения будет браться случайный ответ."
  },

  slang: {
    translation: {
      natural: "Это третий пример тестового перевода. Демо-режим показывает примерный контент.",
      literal: "Это третий пример тестового перевода. Демо-режим показывает примерный контент."
    },
    slang: [
      {
        term: "demo",
        definition: "Демонстрационный режим работы приложения",
        example: "Demo mode is active = Демо-режим активен"
      },
      {
        term: "sample",
        definition: "Пример, образец для демонстрации",
        example: "This is a sample response = Это пример ответа"
      }
    ],
    explanation: "Это демо-данные, которые не сохраняются. Для каждого анализа предложения будет браться случайный ответ."
  }
};

/**
 * Получить случайный моковый ответ для демонстрации
 */
export function getRandomMockAnalysis(): MockAnalysisResponse {
  const keys = Object.keys(mockAnalysisResponses);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return mockAnalysisResponses[randomKey!]!;
}
