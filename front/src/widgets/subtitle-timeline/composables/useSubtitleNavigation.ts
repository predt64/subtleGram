import { ref, computed } from "vue";
import type { SentenceCard } from "@/entities/subtitle/lib/normalizeToSentences";
import { useSubtitleStore } from "@/entities/subtitle";
import { parseTimeToMs } from "@/shared/lib";

/**
 * Composable для навигации по субтитрам
 * Управляет выбором субтитров, прокруткой и клавиатурной навигацией
 */
export function useSubtitleNavigation(
  filteredSubtitles: () => SentenceCard[],
  getCurrentFilteredIndex: () => number,
  emit: (event: "update:modelValue", index: number) => void
) {
  const subtitleStore = useSubtitleStore();

  /**
   * Преобразует индекс из отфильтрованного массива в индекс полного массива субтитров
   * @param subtitleId - ID субтитра для поиска
   * @returns индекс в полном массиве или -1 если не найден
   */
  const findOriginalIndex = (subtitleId: number): number => {
    return subtitleStore.sentenceCards.findIndex((s) => s.id === subtitleId);
  };

  /**
   * Выбирает субтитр по индексу в отфильтрованном массиве
   * Находит соответствующий субтитр в оригинальном массиве и обновляет modelValue
   * @param filteredIndex - индекс в отфильтрованном массиве
   */
  const selectSubtitle = (filteredIndex: number): void => {
    const subtitle = filteredSubtitles()[filteredIndex];
    if (subtitle) {
      const originalIndex = findOriginalIndex(subtitle.id);
      if (originalIndex !== -1) {
        emit("update:modelValue", originalIndex);
      }
    }
  };

  /**
   * Обрабатывает клавиатурную навигацию по субтитрам
   * Поддерживает стрелки вверх/вниз для навигации по отфильтрованному массиву
   * @param event - событие клавиатуры
   */
  const handleKeydown = (event: KeyboardEvent): void => {
    // Не перехватываем клавиши, если фокус в поле поиска
    if (event.target instanceof HTMLInputElement && event.target.type === 'text') {
      return;
    }

    const subtitles = filteredSubtitles();
    if (!subtitles.length) return;

    const currentFilteredIndex = getCurrentFilteredIndex();
    let newFilteredIndex = currentFilteredIndex;

    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        newFilteredIndex = Math.max(0, currentFilteredIndex - 1);
        break;
      case "ArrowDown":
        event.preventDefault();
        newFilteredIndex = Math.min(subtitles.length - 1, currentFilteredIndex + 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        break;
    }

    if (newFilteredIndex !== currentFilteredIndex && newFilteredIndex >= 0) {
      // Преобразуем индекс в отфильтрованном массиве в индекс в полном массиве
      const targetSubtitle = subtitles[newFilteredIndex];
      if (targetSubtitle) {
        const originalIndex = findOriginalIndex(targetSubtitle.id);
        if (originalIndex !== -1) {
          emit("update:modelValue", originalIndex);
        }
      }
    }
  };

  /**
   * Перемещает скролл к субтитру, ближайшему к указанному времени
   * Используется при навигации по таймлайну через скроллбар
   * @param timeMs - время в миллисекундах для поиска субтитра
   */
  const seekToTime = (timeMs: number): void => {
    const cards = filteredSubtitles();
    if (!cards.length) return;

    let targetIndex = cards.findIndex(
      (c) => parseTimeToMs(c.start || "00:00:00") >= timeMs
    );
    if (targetIndex < 0) targetIndex = cards.length - 1;

    // Возвращаем индекс для использования в родительском компоненте
    const subtitle = cards[targetIndex];
    if (subtitle) {
      const originalIndex = findOriginalIndex(subtitle.id);
      if (originalIndex !== -1) {
        emit("update:modelValue", originalIndex);
      }
    }
  };

  return {
    selectSubtitle,
    handleKeydown,
    seekToTime,
    findOriginalIndex
  };
}
