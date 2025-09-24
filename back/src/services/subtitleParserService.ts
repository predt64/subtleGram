/**
 * Структура одной записи субтитров
 */
export interface SubtitleEntry {
  id: number;      // Уникальный идентификатор субтитра
  start: string;   // Время начала в формате ЧЧ:ММ:СС.ммм
  end: string;     // Время окончания в формате ЧЧ:ММ:СС.ммм
  text: string;    // Текст субтитра
}

/**
 * Сервис для парсинга файлов субтитров различных форматов
 * Поддерживает: SRT (SubRip), VTT (WebVTT), TXT (простой текст)
 */
export const subtitleParserService = {
  /**
   * Парсинг содержимого файла субтитров различных форматов
   *
   * Определяет формат по расширению файла или по содержимому,
   * вызывает соответствующий парсер и возвращает структурированные данные
   */
  parseSubtitles: async (content: string, filename: string): Promise<SubtitleEntry[]> => {
    try {
      // Определяем расширение файла для выбора парсера
      const fileExtension = filename.toLowerCase().split('.').pop();
      let parsedData: SubtitleEntry[];

      // Выбираем парсер на основе расширения файла
      switch (fileExtension) {
        case 'srt':
          parsedData = parseSRT(content);
          break;
        case 'vtt':
          parsedData = parseVTT(content);
          break;
        case 'txt':
          parsedData = parsePlainText(content);
          break;
        default:
          // Автоматическое определение формата по содержимому файла
          if (content.includes('-->')) {
            parsedData = parseSRT(content); // Характерный маркер SRT
          } else if (content.includes('WEBVTT')) {
            parsedData = parseVTT(content); // Заголовок VTT
          } else {
            parsedData = parsePlainText(content); // По умолчанию простой текст
          }
      }

      // Проверяем что парсинг дал результат
      if (!Array.isArray(parsedData) || parsedData.length === 0) {
        throw new Error('В файле не найдено валидных субтитров');
      }

      console.log(`Успешно распарсено ${parsedData.length} субтитров из файла ${filename}`);
      return parsedData;

    } catch (error) {
      console.error('Ошибка парсинга субтитров:', error);
      throw new Error(`Не удалось распарсить файл субтитров: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  },

  /**
   * Валидация структуры записи субтитра
   * Проверяет что объект соответствует интерфейсу SubtitleEntry
   */
  validateSubtitleEntry: (entry: any): entry is SubtitleEntry => {
    return (
      typeof entry === 'object' &&
      typeof entry.id === 'number' &&
      typeof entry.start === 'string' &&
      typeof entry.end === 'string' &&
      typeof entry.text === 'string' &&
      entry.text.length > 0
    );
  },
};

/**
 * Парсинг формата SRT (SubRip) - стандартного формата субтитров
 *
 * Формат SRT:
 * 1. Номер субтитра
 * 2. Время: 00:00:01,000 --> 00:00:04,000
 * 3. Текст субтитра (может быть многострочным)
 * 4. Пустая строка разделителя
 *
 * Пример:
 * 1
 * 00:00:01,000 --> 00:00:04,000
 * Hello, world!
 *
 * 2
 * 00:00:05,000 --> 00:00:08,000
 * How are you?
 */
function parseSRT(content: string): SubtitleEntry[] {
  const subtitles: SubtitleEntry[] = [];

  // Разделяем контент на блоки субтитров (разделитель - пустая строка)
  const blocks = content.trim().split(/\n\s*\n/);

  for (const block of blocks) {
    // Разделяем блок на строки
    const lines = block.trim().split('\n');

    // Пропускаем блоки с недостаточным количеством строк
    if (lines.length < 3) continue;

    // Первая строка - номер субтитра
    const id = parseInt(lines[0]?.trim() || '0');

    // Вторая строка - временной интервал в формате SRT
    const timeMatch = lines[1]?.match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);

    // Пропускаем блоки с некорректным временем или ID
    if (!timeMatch || isNaN(id)) continue;

    // Извлекаем время начала и окончания
    const start = timeMatch[1] || '00:00:00.000';
    const end = timeMatch[2] || '00:00:00.000';

    // Остальные строки - текст субтитра (объединяем в одну строку)
    const text = lines.slice(2).join(' ').trim();

    subtitles.push({ id, start, end, text });
  }

  return subtitles;
}

/**
 * Парсинг формата VTT (WebVTT) - веб-стандарт субтитров
 *
 * Формат VTT:
 * 1. Заголовок: WEBVTT
 * 2. Пустые строки или комментарии (//)
 * 3. Опциональный ID субтитра
 * 4. Время: 00:00:01.000 --> 00:00:04.000
 * 5. Текст субтитра (может быть многострочным)
 * 6. Пустая строка разделителя
 *
 * Пример:
 * WEBVTT
 *
 * 1
 * 00:00:01.000 --> 00:00:04.000
 * Hello, world!
 *
 * 2
 * 00:00:05.000 --> 00:00:08.000
 * How are you?
 */
function parseVTT(content: string): SubtitleEntry[] {
  const subtitles: SubtitleEntry[] = [];
  const lines = content.split('\n');
  let i = 0;

  // Пропускаем заголовок WEBVTT если он есть
  if (lines[0]?.trim().toUpperCase() === 'WEBVTT') {
    i = 1;
  }

  // Проходим по всем строкам файла
  while (i < lines.length) {
    // Пропускаем пустые строки и комментарии
    while (i < lines.length && (lines[i]?.trim() === '' || lines[i]?.trim().startsWith('//'))) {
      i++;
    }

    // Выходим если достигли конца файла
    if (i >= lines.length) break;

    // Определяем ID субтитра (может быть опциональным)
    let cueId = subtitles.length + 1;

    // Если строка содержит только цифры - это ID субтитра
    if (lines[i]?.match(/^\d+$/)) {
      cueId = parseInt(lines[i]?.trim() || '0');
      i++; // Переходим к следующей строке
    }

    // Ищем временной интервал в формате VTT (с точками вместо запятых)
    const timeMatch = lines[i]?.match(/(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})/);

    if (!timeMatch) {
      i++;
      continue; // Пропускаем некорректные блоки
    }

    // Извлекаем время начала и окончания
    const start = timeMatch[1] || '00:00:00.000';
    const end = timeMatch[2] || '00:00:00.000';
    i++;

    // Собираем текст субтитра из следующих строк
    const textLines: string[] = [];
    while (i < lines.length && lines[i]?.trim() !== '') {
      textLines.push(lines[i]?.trim() || '');
      i++;
    }

    // Объединяем все строки текста в одну
    const text = textLines.join(' ').trim();
    subtitles.push({ id: cueId, start, end, text });
  }

  return subtitles;
}

/**
 * Парсинг простого текстового формата
 *
 * Каждый непустая строка становится отдельным субтитром
 * Время начала и окончания устанавливается в 00:00:00.000
 * Используется когда файл не соответствует форматам SRT/VTT
 *
 * Пример входа:
 * Hello, world!
 * How are you?
 * I'm fine, thank you.
 *
 * Результат:
 * [
 *   { id: 1, start: "00:00:00.000", end: "00:00:00.000", text: "Hello, world!" },
 *   { id: 2, start: "00:00:00.000", end: "00:00:00.000", text: "How are you?" },
 *   { id: 3, start: "00:00:00.000", end: "00:00:00.000", text: "I'm fine, thank you." }
 * ]
 */
function parsePlainText(content: string): SubtitleEntry[] {
  const subtitles: SubtitleEntry[] = [];

  // Разделяем текст на строки и фильтруем пустые
  const lines = content.split('\n').filter(line => line.trim() !== '');

  // Каждая непустая строка становится субтитром
  lines.forEach((line, index) => {
    subtitles.push({
      id: index + 1,                    // Порядковый номер
      start: '00:00:00.000',           // Фиксированное время начала
      end: '00:00:00.000',             // Фиксированное время окончания
      text: line.trim(),                // Очищенный текст строки
    });
  });

  return subtitles;
}
