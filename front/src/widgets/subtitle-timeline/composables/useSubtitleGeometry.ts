import { ref, nextTick } from "vue";
import type { SubtitleGeometry } from "@/shared/lib";

/**
 * Composable для работы с геометрией субтитров
 * Управляет сбором и обновлением геометрии DOM элементов субтитров
 */
export function useSubtitleGeometry() {
  /**
   * Геометрия субтитров из DOM для позиционирования меток скроллбара
   */
  const subtitleGeometry = ref<SubtitleGeometry[]>([]);

  /**
   * Индекс верхнего видимого субтитра для синхронизации с таймлайном
   */
  const currentVisibleIndex = ref(0);

  /**
   * Определяет индекс верхнего видимого субтитра через DOM
   * Проходит по всем элементам субтитров и находит первый, который пересекает верхнюю границу контейнера
   * Это обеспечивает точную синхронизацию скролла независимо от высоты элементов
   * @returns индекс верхнего видимого субтитра или 0 если контейнер пустой
   */
  const getTopVisibleSubtitleIndex = (container?: HTMLElement): number => {
    if (!container) return 0;

    const containerRect = container.getBoundingClientRect();
    const containerTop = containerRect.top;
    const elements = container.querySelectorAll('.subtitle-item');

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i] as HTMLElement;
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      // Если нижняя граница элемента ниже верха контейнера - это первый видимый
      if (rect.bottom > containerTop + 5) { // +5px для небольшого порога
        return i;
      }
    }

    return Math.max(0, elements.length - 1);
  };

  /**
   * Собирает реальную геометрию субтитров из DOM для позиционирования меток скроллбара
   * Проходит по всем элементам субтитров и сохраняет их позицию и размеры
   * @param container - контейнер субтитров
   * @returns массив объектов с геометрией каждого субтитра
   */
  const getSubtitleGeometry = (container?: HTMLElement): SubtitleGeometry[] => {
    if (!container) return [];

    const elements = container.querySelectorAll('.subtitle-item');
    const geometry: SubtitleGeometry[] = [];

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i] as HTMLElement;
      if (!el) continue;
      geometry.push({
        index: i,
        top: el.offsetTop,
        height: el.offsetHeight
      });
    }

    return geometry;
  };

  /**
   * Обновляет геометрию субтитров после рендера Vue
   * Вызывается в nextTick чтобы DOM был полностью обновлен
   * @param container - контейнер субтитров
   */
  const updateGeometry = (container?: HTMLElement): void => {
    nextTick(() => {
      subtitleGeometry.value = getSubtitleGeometry(container);
    });
  };

  return {
    subtitleGeometry,
    currentVisibleIndex,
    getTopVisibleSubtitleIndex,
    getSubtitleGeometry,
    updateGeometry
  };
}
