import { Request, Response } from 'express';
import { subtitleParserService } from '../services/subtitleParserService';

export const uploadController = {
  /**
   * Загрузка и парсинг файла субтитров
   * POST /api/subtitles/upload
   *
   * Обрабатывает multipart/form-data запрос с файлом субтитров,
   * парсит его содержимое и возвращает структурированные данные
   */
  uploadSubtitle: async (req: Request, res: Response): Promise<void> => {
    try {
      // Проверяем что файл был загружен через multer
      if (!req.file) {
        res.status(400).json({
          error: 'Файл не загружен',
          message: 'Пожалуйста, загрузите файл субтитров (.srt, .vtt или .txt)',
        });
        return;
      }

      // Извлекаем данные файла из req.file (multer)
      const { buffer, originalname, mimetype } = req.file;
      const fileContent = buffer.toString('utf-8');

      console.log(`Обрабатываем файл: ${originalname} (${mimetype})`);

      // Парсим содержимое файла субтитров
      const parsedSubtitles = await subtitleParserService.parseSubtitles(fileContent, originalname);

      // Возвращаем успешный ответ с распарсенными данными
      res.status(200).json({
        success: true,
        message: 'Файл субтитров успешно обработан',
        data: {
          filename: originalname,
          subtitlesCount: parsedSubtitles.length,
          subtitles: parsedSubtitles,
        },
      });

    } catch (error) {
      console.error('Ошибка загрузки:', error);

      // Обрабатываем специфические ошибки парсинга
      if (error instanceof Error) {
        if (error.message.includes('Invalid subtitle format')) {
          res.status(400).json({
            error: 'Неверный формат субтитров',
            message: 'Загруженный файл не является валидным файлом субтитров',
          });
          return;
        }

        // Общая ошибка обработки файла
        res.status(400).json({
          error: 'Ошибка обработки файла',
          message: error.message,
        });
        return;
      }

      // Критическая ошибка сервера
      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Не удалось обработать загруженный файл',
      });
    }
  },
};
