export interface TimelineMark {
  timeMs: number;
  label: string;
  isMajor: boolean;
  subtitleIndex: number; // индекс субтитра в массиве
  realTopPx?: number; // реальная позиция в пикселях из DOM
}

export interface SubtitleGeometry {
  index: number;
  top: number;
  height: number;
}

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

export function parseTimeToMs(timeStr: string): number {
  if (!timeStr) return 0;
  timeStr = timeStr.replace(',', '.');
  const [timePart, msPartStr] = timeStr.split('.');
  const parts = (timePart ?? '').split(':').map(Number);
  const ms = msPartStr ? parseInt(msPartStr.padEnd(3, '0').slice(0, 3), 10) : 0;
  let seconds = 0;
  if (parts.length === 3) {
    seconds = (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
  } else if (parts.length === 2) {
    seconds = (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
  } else if (parts.length === 1) {
    seconds = parts[0] ?? 0;
  }
  return seconds * 1000 + ms;
}

/**
 * Генерирует метки таймлайна на основе реальной геометрии субтитров из DOM
 * Major метки каждые 5% от высоты, между ними по 3 minor метки
 * @param subtitles - массив субтитров с полями start/end
 * @param geometry - реальная геометрия элементов из DOM
 * @param totalMs - общая длительность в миллисекундах
 * @param containerHeight - высота видимой области контейнера
 */
export function generateMarksFromGeometry(
  subtitles: Array<{ start: string; end: string }>,
  geometry: SubtitleGeometry[],
  totalMs: number,
  containerHeight: number
): TimelineMark[] {
  console.log('generateMarksFromGeometry', subtitles, geometry, totalMs, containerHeight);
  if (subtitles.length === 0 || geometry.length === 0) return [];

  const useHours = totalMs >= 3600000;
  const marks: TimelineMark[] = [];

  // Вычисляем общую высоту контента и скроллируемую область
  const lastGeom = geometry[geometry.length - 1];
  if (!lastGeom) return [];
  const totalScrollHeight = lastGeom.top + lastGeom.height;
  const scrollableHeight = Math.max(1, totalScrollHeight - containerHeight);

  console.log('totalScrollHeight', totalScrollHeight, 'scrollableHeight', scrollableHeight);

  if (scrollableHeight === 0) return [];
  
  // Major метки каждые 5% (20 major меток на весь таймлайн)
  const majorCount = 20;
  const majorPositions: number[] = [];

  // Генерируем major метки в диапазоне скроллируемой области
  for (let i = 0; i <= majorCount; i++) {
    const targetY = (scrollableHeight / majorCount) * i;
    majorPositions.push(targetY);
    
    // Найти субтитр, ближайший к этой Y-позиции
    let closestIndex = 0;
    let minDistance = Infinity;
    
    for (let j = 0; j < geometry.length; j++) {
      const geom = geometry[j];
      if (!geom) continue;
      const itemCenterY = geom.top + geom.height / 2;
      const distance = Math.abs(itemCenterY - targetY);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = j;
      }
    }
    
    const subtitle = subtitles[closestIndex];
    const geom = geometry[closestIndex];
    if (!subtitle || !geom) continue;
    
    marks.push({
      timeMs: parseTimeToMs(subtitle.start),
      label: formatTime(parseTimeToMs(subtitle.start), useHours),
      isMajor: true,
      subtitleIndex: closestIndex,
      realTopPx: geom.top
    });
  }
  
  // Добавляем 3 minor метки между каждой парой major меток
  for (let i = 0; i < majorPositions.length - 1; i++) {
    const startY = majorPositions[i];
    const endY = majorPositions[i + 1];
    if (startY === undefined || endY === undefined) continue;
    
    const gap = endY - startY;
    
    // 3 minor метки
    for (let j = 1; j <= 3; j++) {
      const targetY = startY + (gap * j) / 4;
      
      // Найти субтитр, ближайший к этой Y-позиции
      let closestIndex = 0;
      let minDistance = Infinity;
      
      for (let k = 0; k < geometry.length; k++) {
        const geom = geometry[k];
        if (!geom) continue;
        const itemCenterY = geom.top + geom.height / 2;
        const distance = Math.abs(itemCenterY - targetY);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = k;
        }
      }
      
      const subtitle = subtitles[closestIndex];
      const geom = geometry[closestIndex];
      if (!subtitle || !geom) continue;
      
      marks.push({
        timeMs: parseTimeToMs(subtitle.start),
        label: '',
        isMajor: false,
        subtitleIndex: closestIndex,
        realTopPx: geom.top
      });
    }
  }
  
  return marks;
}
