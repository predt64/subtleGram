export * from './timelineMarks'
export * from './storage'

/**
 * Ограничивает значение в заданных пределах
 * @param value - значение для ограничения
 * @param min - минимальное значение
 * @param max - максимальное значение
 * @returns ограниченное значение
 */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))