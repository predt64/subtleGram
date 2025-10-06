import { ValidationResult } from '../types';
import { fileUploadConfig } from './config';

/**
 * Утилиты валидации входных данных API
 */
export const validationUtils = {
  /**
   * Валидация массива субтитров
   */
  validateSubtitles: (subtitles: any): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Проверяем что subtitles является массивом
    if (!Array.isArray(subtitles)) {
      errors.push('Субтитры должны быть массивом');
      return { isValid: false, errors, warnings };
    }

    // Проверяем что массив не пустой
    if (subtitles.length === 0) {
      errors.push('Массив субтитров не может быть пустым');
      return { isValid: false, errors, warnings };
    }

    // Предупреждение для большого количества субтитров
    if (subtitles.length > 10000) {
      warnings.push('Большое количество субтитров может повлиять на производительность');
    }

    // Валидируем каждый субтитр
    subtitles.forEach((subtitle, index) => {
      const entryErrors = validationUtils.validateSubtitleEntry(subtitle, index);
      errors.push(...entryErrors);
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },

  /**
   * Валидация одного субтитра
   */
  validateSubtitleEntry: (entry: any, index: number): string[] => {
    const errors: string[] = [];
    const prefix = `Субтитр ${index + 1}:`;

    // Проверяем что entry является объектом
    if (!entry || typeof entry !== 'object') {
      errors.push(`${prefix} должен быть объектом`);
      return errors;
    }

    // Валидация ID
    if (typeof entry.id !== 'number' || entry.id < 1) {
      errors.push(`${prefix} ID должен быть положительным числом`);
    }

    // Валидация времени начала
    if (typeof entry.start !== 'string') {
      errors.push(`${prefix} время начала должно быть строкой`);
    } else if (!validationUtils.isValidTimeFormat(entry.start)) {
      errors.push(`${prefix} время начала должно быть в формате ЧЧ:ММ:СС.ммм или ЧЧ:ММ:СС,ммм`);
    }

    // Валидация времени окончания
    if (typeof entry.end !== 'string') {
      errors.push(`${prefix} время окончания должно быть строкой`);
    } else if (!validationUtils.isValidTimeFormat(entry.end)) {
      errors.push(`${prefix} время окончания должно быть в формате ЧЧ:ММ:СС.ммм или ЧЧ:ММ:СС,ммм`);
    }

    // Валидация текста
    if (typeof entry.text !== 'string') {
      errors.push(`${prefix} текст должен быть строкой`);
    } else if (entry.text.trim().length === 0) {
      errors.push(`${prefix} текст не может быть пустым`);
    } else if (entry.text.length > 5000) {
      errors.push(`${prefix} текст слишком длинный (максимум 5000 символов)`);
    }

    return errors;
  },

  /**
   * Проверка формата времени (ЧЧ:ММ:СС.ммм или ЧЧ:ММ:СС,ммм)
   */
  isValidTimeFormat: (time: string): boolean => {
    // Регулярное выражение для формата времени
    const timeRegex = /^(\d{2}):(\d{2}):(\d{2})[,.](\d{3})$/;
    const match = time.match(timeRegex);

    if (!match) return false;

    // Извлекаем компоненты времени
    const [, hours, minutes, seconds] = match;
    const h = parseInt(hours || '0', 10);
    const m = parseInt(minutes || '0', 10);
    const s = parseInt(seconds || '0', 10);

    // Проверяем диапазоны значений
    return h >= 0 && h <= 23 && m >= 0 && m <= 59 && s >= 0 && s <= 59;
  },

  /**
   * Валидация загруженного файла
   */
  validateFileUpload: (file: any): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Проверяем что файл был загружен
    if (!file) {
      errors.push('Файл не предоставлен');
      return { isValid: false, errors, warnings };
    }

    // Проверяем размер файла
    const maxSize = fileUploadConfig.maxFileSize;
    if (file.size > maxSize) {
      errors.push(`Размер файла превышает максимально допустимый (${Math.round(maxSize / 1024 / 1024)}MB)`);
    }

    // Проверяем тип файла
    const allowedTypes = [
      'text/plain',
      'application/octet-stream',
    ];

    const allowedExtensions = ['.srt', '.vtt', '.txt'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));

    if (!allowedTypes.includes(file.mimetype) && !allowedExtensions.includes(fileExtension)) {
      errors.push('Недопустимый тип файла. Разрешены только файлы .srt, .vtt и .txt');
    }

    // Проверяем имя файла
    if (file.originalname.length > 255) {
      errors.push('Имя файла слишком длинное');
    }

    // Защита от directory traversal атак
    if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
      errors.push('Недопустимое имя файла');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },

  /**
   * Валидация типа анализа
   */
  validateAnalysisType: (type: string): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    const validTypes = ['difficulty', 'vocabulary', 'grammar', 'comprehensive'];

    if (!validTypes.includes(type)) {
      errors.push(`Недопустимый тип анализа. Должен быть одним из: ${validTypes.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },

  /**
   * Очистка текстового ввода от потенциально опасных символов
   */
  sanitizeText: (text: string): string => {
    if (typeof text !== 'string') return '';

    return text
      .trim()
      .replace(/[<>]/g, '') // Удаляем потенциальные HTML теги
      .replace(/\s+/g, ' ') // Нормализуем пробелы
      .substring(0, 10000); // Ограничиваем длину
  },

  /**
   * Валидация переменных окружения
   */
  validateEnvironment: (): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Обязательные переменные окружения
    const requiredVars = ['OPENROUTER_API_KEY'];
    const recommendedVars = ['PORT', 'NODE_ENV', 'FRONTEND_URL'];

    requiredVars.forEach(varName => {
      if (!process.env[varName]) {
        errors.push(`Обязательная переменная окружения ${varName} не установлена`);
      }
    });

    recommendedVars.forEach(varName => {
      if (!process.env[varName]) {
        warnings.push(`Рекомендуется установить переменную окружения ${varName}`);
      }
    });

    // Валидация конкретных переменных
    if (process.env['PORT'] && isNaN(parseInt(process.env['PORT']))) {
      errors.push('PORT должен быть корректным числом');
    }

    if (process.env['MAX_FILE_SIZE'] && isNaN(parseInt(process.env['MAX_FILE_SIZE']))) {
      errors.push('MAX_FILE_SIZE должен быть корректным числом');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },
};
