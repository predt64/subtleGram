/**
 * Моковые данные Urban Dictionary для демо-режима
 */

export interface MockUrbanDictionaryEntry {
  term: string;
  definition: string;
  example: string;
  thumbs_up: number;
  thumbs_down: number;
}

// Популярные сленговые слова и фразы из английского
export const mockUrbanDictionaryData: Record<string, MockUrbanDictionaryEntry> = {
  awesome: {
    term: "awesome",
    definition: "Something that is really good, excellent, or impressive. Often used to express enthusiasm or approval.",
    example: "That new smartphone is awesome! I love all the features.",
    thumbs_up: 1250,
    thumbs_down: 45
  },

  dude: {
    term: "dude",
    definition: "A casual term for a person, usually male, similar to 'guy' or 'man'. Can be used as a greeting or to express surprise.",
    example: "Hey dude, what's up? Did you see that crazy goal in the game?",
    thumbs_up: 980,
    thumbs_down: 67
  },

  lit: {
    term: "lit",
    definition: "Exciting, fun, excellent, or intoxicated. Describes something that is amazing or a great time.",
    example: "That party last night was absolutely lit! Everyone was dancing.",
    thumbs_up: 875,
    thumbs_down: 23
  },

  ghost: {
    term: "ghost",
    definition: "To suddenly stop communicating with someone, especially in online dating or friendships.",
    example: "I thought we were getting along great, but then he just ghosted me.",
    thumbs_up: 654,
    thumbs_down: 89
  },

  yeet: {
    term: "yeet",
    definition: "To throw something with force and enthusiasm. Can also mean to discard or get rid of something quickly.",
    example: "He yeeted the ball across the field for a touchdown!",
    thumbs_up: 432,
    thumbs_down: 12
  }
};
