/**
 * Утилиты для работы с таймлайном субтитров
 *
 * Этот модуль содержит функции для:
 * - Форматирования и парсинга временных меток
 * - Генерации меток таймлайна на основе геометрии DOM элементов
 * - Создания визуальных маркеров для навигации по субтитрам
 */

/**
 * Метка на таймлайне субтитров
 * Представляет временную точку с визуальным маркером для навигации
 */
export interface TimelineMark {
  timeMs: number;        // Время в миллисекундах от начала видео
  label: string;         // Текстовое представление времени (ММ:СС или ЧЧ:ММ:СС)
  isMajor: boolean;      // Является ли метка основной (major) или дополнительной (minor)
  subtitleIndex: number; // Индекс соответствующего субтитра в массиве
  realTopPx?: number;    // Реальная позиция метки в пикселях относительно контейнера
}

/**
 * Геометрическая информация о субтитре в DOM
 * Описывает позицию и размеры элемента субтитра для расчета меток таймлайна
 */
export interface SubtitleGeometry {
  index: number;  // Индекс субтитра в массиве
  top: number;    // Отступ от верха контейнера в пикселях
  height: number; // Высота элемента субтитра в пикселях
}

/**
 * Форматирует время из миллисекунд в строку
 * @param ms - время в миллисекундах
 * @param useHours - показывать ли часы в формате (для видео длиннее 1 часа)
 * @returns строка времени в формате "ММ:СС" или "ЧЧ:ММ:СС"
 */
export function formatTime(ms: number, useHours: boolean): string {
  const secs = Math.floor(ms / 1000);
  const s = secs % 60;
  const m = Math.floor(secs / 60) % 60;
  const h = Math.floor(secs / 3600);

  if (useHours) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Парсит строку времени в миллисекунды
 * Поддерживает различные форматы: "ММ:СС", "ЧЧ:ММ:СС", "ММ:СС.мс"
 * @param timeStr - строка времени (например: "01:23:45,678" или "12:34")
 * @returns время в миллисекундах
 */
export function parseTimeToMs(timeStr: string): number {
  if (!timeStr) return 0;

  // Заменяем запятую на точку для поддержки формата SRT
  timeStr = timeStr.replace(',', '.');

  // Разделяем на часть времени и миллисекунды
  const [timePart, msPartStr] = timeStr.split('.');
  const parts = (timePart ?? '').split(':').map(Number);
  const ms = msPartStr ? parseInt(msPartStr.padEnd(3, '0').slice(0, 3), 10) : 0;

  let seconds = 0;

  // Определяем формат и конвертируем в секунды
  if (parts.length === 3) {
    // Формат ЧЧ:ММ:СС
    seconds = (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
  } else if (parts.length === 2) {
    // Формат ММ:СС
    seconds = (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
  } else if (parts.length === 1) {
    // Формат СС
    seconds = parts[0] ?? 0;
  }

  return seconds * 1000 + ms;
}

/**
 * Настройки генерации меток таймлайна
 */
interface TimelineConfig {
  majorMarksCount: number;    // Количество основных меток
  minorMarksPerGap: number;   // Количество дополнительных меток между основными
}

/**
 * Конфигурация по умолчанию для генерации меток
 */
const DEFAULT_CONFIG: TimelineConfig = {
  majorMarksCount: 20,      // 20 основных меток (каждые 5%)
  minorMarksPerGap: 3       // 3 дополнительных метки между основными
};

/**
 * Находит индекс субтитра, ближайшего к заданной Y-координате
 * Использует предварительно вычисленные центры для оптимизации
 * @param targetY - целевая Y-координата
 * @param centers - массив центров субтитров
 * @returns индекс ближайшего субтитра
 */
function findClosestSubtitleIndex(targetY: number, centers: number[]): number {
  if (!centers.length) return 0;

  let closestIndex = 0;
  let minDistance = Math.abs((centers[0] ?? 0) - targetY);

  for (let i = 1; i < centers.length; i++) {
    const center = centers[i];
    if (center === undefined) continue;

    const distance = Math.abs(center - targetY);
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = i;
    }
  }

  return closestIndex;
}

/**
 * Генерирует метки таймлайна на основе геометрии субтитров в DOM
 *
 * Алгоритм работы:
 * 1. Проверяет корректность входных данных
 * 2. Вычисляет скроллируемую область контейнера
 * 3. Создает major метки через равные интервалы (по умолчанию 20 меток)
 * 4. Добавляет minor метки между major метками (по умолчанию 3 метки)
 * 5. Привязывает каждую метку к ближайшему субтитру
 *
 * @param subtitles - массив субтитров с временными метками
 * @param geometry - геометрия субтитров из DOM (позиции и размеры)
 * @param totalMs - общая длительность видео в миллисекундах
 * @param containerHeight - высота видимой области контейнера
 * @returns массив меток таймлайна для отображения
 */
export function generateMarksFromGeometry(
  subtitles: Array<{ start: string; end: string }>,
  geometry: SubtitleGeometry[],
  totalMs: number,
  containerHeight: number
): TimelineMark[] {
  // Валидация входных данных
  if (!subtitles?.length || !geometry?.length || totalMs <= 0 || containerHeight <= 0) {
    return [];
  }

  if (subtitles.length !== geometry.length) {
    console.warn(`Несоответствие количества субтитров и геометрии: ${subtitles.length} vs ${geometry.length}`);
    return [];
  }

  const useHours = totalMs >= 3600000; // Показывать часы для видео > 1 часа
  const marks: TimelineMark[] = [];

  // Вычисляем общую высоту контента и скроллируемую область
  const lastGeom = geometry[geometry.length - 1];
  if (!lastGeom) return [];

  const totalScrollHeight = lastGeom.top + lastGeom.height;
  const scrollableHeight = Math.max(0, totalScrollHeight - containerHeight);

  // Если нет скроллируемой области, возвращаем пустой массив
  if (scrollableHeight === 0) return [];

  // Предварительно вычисляем центры субтитров для оптимизации поиска
  const subtitleCenters = geometry.map(geom => geom.top + geom.height / 2);

  // Генерируем major метки через равные интервалы
  const majorPositions: number[] = [];
  for (let i = 0; i <= DEFAULT_CONFIG.majorMarksCount; i++) {
    const percentage = i / DEFAULT_CONFIG.majorMarksCount; // 0.0, 0.05, 0.10, ..., 1.0
    const targetY = scrollableHeight * percentage;
    majorPositions.push(targetY);

    // Находим ближайший субтитр к этой позиции
    const closestIndex = findClosestSubtitleIndex(targetY, subtitleCenters);
    const subtitle = subtitles[closestIndex];
    const geom = geometry[closestIndex];

    if (!subtitle || !geom) continue;

    // Создаем major метку
    marks.push({
      timeMs: parseTimeToMs(subtitle.start),
      label: formatTime(parseTimeToMs(subtitle.start), useHours),
      isMajor: true,
      subtitleIndex: closestIndex,
      realTopPx: geom.top
    });
  }

  // Добавляем minor метки между каждой парой major меток
  for (let i = 0; i < majorPositions.length - 1; i++) {
    const startY = majorPositions[i];
    const endY = majorPositions[i + 1];

    if (startY === undefined || endY === undefined) continue;

    const gap = endY - startY;

    // Создаем minor метки, равномерно распределенные между major метками
    for (let j = 1; j <= DEFAULT_CONFIG.minorMarksPerGap; j++) {
      // Распределяем minor метки равномерно между major метками
      // Для 3 minor меток: позиции 1/4, 2/4, 3/4 от расстояния между major
      const ratio = j / (DEFAULT_CONFIG.minorMarksPerGap + 1);
      const targetY = startY + gap * ratio;

      // Находим ближайший субтитр к этой позиции
      const closestIndex = findClosestSubtitleIndex(targetY, subtitleCenters);
      const subtitle = subtitles[closestIndex];
      const geom = geometry[closestIndex];

      if (!subtitle || !geom) continue;

      // Создаем minor метку (без текста, только позиция)
      marks.push({
        timeMs: parseTimeToMs(subtitle.start),
        label: '', // Minor метки не имеют текста
        isMajor: false,
        subtitleIndex: closestIndex,
        realTopPx: geom.top
      });
    }
  }

  return marks;
}
