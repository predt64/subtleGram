<template>
  <div
    class="timeline"
    role="slider"
    aria-label="Скроллбар таймлайна субтитров"
    :aria-valuemin="0"
    :aria-valuemax="totalMs"
    :aria-valuenow="currentTimeMs"
    ref="rootEl"
    @mousedown="onMouseDown"
    @mousemove="onMouseMove"
    @mouseup="onDragEnd"
  >
    <!-- Перетаскиваемая полоска, представляющая видимую область -->
    <div
      class="handle"
      :class="{ dragging: isDragging }"
      :style="{ top: `${handleTop}px`, height: `${handleHeight}px` }"
      @mousedown.stop="onDragStart"
      @click.stop
    />

    <!-- Всплывающая подсказка при перетаскивании -->
    <div
      v-if="isDragging && showMarks"
      class="tooltip"
      :style="{ top: `${handleTop + handleHeight / 2}px` }"
    >
      {{ formattedTooltipTime }}
    </div>
    <!-- Метки таймлайна -->
    <div
      v-for="mark in marks"
      :key="`${mark.subtitleIndex}-${mark.timeMs}`"
      class="mark"
      :class="{ major: mark.isMajor, minor: !mark.isMajor }"
      :style="{ top: `${markTopPx(mark)}px` }"
      :aria-label="mark.label ? `Субтитр в ${mark.label}` : 'Дополнительная метка'"
    >
      <div class="tick" />
      <span v-if="mark.isMajor" class="label">{{ mark.label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { formatTime, parseTimeToMs } from "@/shared/lib/timelineMarks";
import {
  generateMarksFromGeometry,
  type TimelineMark,
  type SubtitleGeometry,
} from "@/shared/lib/timelineMarks";
import type { SentenceCard } from "@/entities/subtitle/lib/normalizeToSentences";

interface Props {
  totalMs: number;
  containerHeight: number;
  scrollTop: number;
  totalScrollHeight: number;
  subtitles: SentenceCard[]; // массив предложений для отображения
  subtitleGeometry: SubtitleGeometry[]; // реальная геометрия из DOM
  currentVisibleIndex: number; // индекс верхнего видимого субтитра
  showMarks?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  seek: [timeMs: number];
  updateScrollTop: [newTop: number];
}>();

const marks = computed<TimelineMark[]>(() => {
  if (props.showMarks === false) return [];
  if (props.subtitles.length === 0 || props.subtitleGeometry.length === 0) return [];

  // Проверяем соответствие длин массивов subtitles и geometry
  // Это предотвращает генерацию некорректных меток при асинхронном обновлении
  if (props.subtitles.length !== props.subtitleGeometry.length) {
    console.warn('Subtitles and geometry length mismatch, skipping marks generation');
    return [];
  }

  return generateMarksFromGeometry(
    props.subtitles,
    props.subtitleGeometry,
    props.totalMs,
    props.containerHeight
  );
});

/**
 * Внутреннее состояние взаимодействия с компонентом
 * Управляет перетаскиванием и предварительным просмотром позиции
 */
const rootEl = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const dragStartY = ref(0);
const dragStartScrollTop = ref(0);
const previewScrollTop = ref<number | null>(null);

/**
 * Вспомогательные функции для математических расчетов
 */

/**
 * Ограничивает значение в заданных пределах
 * @param value - значение для ограничения
 * @param min - минимальное значение
 * @param max - максимальное значение
 * @returns ограниченное значение
 */
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Конвертирует изменение координаты Y в позицию скролла
 * @param deltaY - изменение координаты по вертикали (в пикселях)
 * @param base - базовая позиция скролла (в пикселях)
 * @returns новая позиция скролла в пикселях
 */
const deltaYToScrollTop = (deltaY: number, base: number): number => {
  // Соотношение между полной высотой контента и видимой областью
  const ratio = (props.totalScrollHeight || 1) / (props.containerHeight || 1);
  return base + deltaY * ratio;
};

/**
 * Обработчики событий взаимодействия с пользователем
 */

/**
 * Конвертирует глобальную координату Y в локальную относительно скроллбара
 * @param clientY - глобальная координата Y от верхнего края viewport
 * @returns локальная координата Y относительно элемента скроллбара
 */
const getLocalYFromClient = (clientY: number): number => {
  const el = rootEl.value;
  if (!el) return 0;
  const rect = el.getBoundingClientRect();
  return clientY - rect.top;
};

const onMouseDown = (e: MouseEvent) => {
  // Игнорируем клик по handle (у него свой обработчик mousedown)
  if ((e.target as HTMLElement)?.classList.contains('handle')) return;

  const y = getLocalYFromClient(e.clientY);
  // Вычисляем новую позицию handle на основе клика по Y координате
  const newHandleTop = clamp(y - handleHeight.value / 2, 0, maxHandleTop.value);
  const scrollable = Math.max(1, props.totalScrollHeight - props.containerHeight);
  const ratio = newHandleTop / maxHandleTop.value;
  const newScrollTop = Math.floor(ratio * scrollable);

  // Начинаем перетаскивание с новой позиции
  isDragging.value = true;
  dragStartY.value = y;
  dragStartScrollTop.value = newScrollTop;

  // Вычисляем время ближайшего субтитра и перемещаем
  if (props.subtitles.length > 0) {
    const subtitleIndex = Math.round(ratio * (props.subtitles.length - 1));
    const clampedIndex = clamp(subtitleIndex, 0, props.subtitles.length - 1);
    const subtitle = props.subtitles[clampedIndex];
    const timeMs = subtitle?.start ? parseTimeToMs(subtitle.start) : 0;
    emit("updateScrollTop", newScrollTop);
    emit("seek", timeMs);
  }

  e.preventDefault();
  window.addEventListener('mousemove', onWindowMouseMove);
  window.addEventListener('mouseup', onWindowMouseUp);
};

const onDragStart = (e: MouseEvent) => {
  isDragging.value = true;
  dragStartY.value = getLocalYFromClient(e.clientY);
  dragStartScrollTop.value = props.scrollTop;
  window.addEventListener('mousemove', onWindowMouseMove);
  window.addEventListener('mouseup', onWindowMouseUp);
};

const onMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) {
    return;
  }
  const deltaY = getLocalYFromClient(e.clientY) - dragStartY.value;
  const newTop = clamp(
    deltaYToScrollTop(deltaY, dragStartScrollTop.value),
    0,
    Math.max(0, props.totalScrollHeight - props.containerHeight)
  );
  previewScrollTop.value = newTop;
  emit("updateScrollTop", newTop);
};

const onDragEnd = () => {
  if (!isDragging.value) return;
  isDragging.value = false;
  previewScrollTop.value = null;
  window.removeEventListener('mousemove', onWindowMouseMove);
  window.removeEventListener('mouseup', onWindowMouseUp);
};

const onWindowMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return;
  const deltaY = getLocalYFromClient(e.clientY) - dragStartY.value;
  const newTop = clamp(
    deltaYToScrollTop(deltaY, dragStartScrollTop.value),
    0,
    Math.max(0, props.totalScrollHeight - props.containerHeight)
  );
  previewScrollTop.value = newTop;
  emit('updateScrollTop', newTop);
};

const onWindowMouseUp = () => {
  if (!isDragging.value) return;
  onDragEnd();
};

/**
 * Эффективная позиция скролла для предварительного просмотра
 * Использует previewScrollTop при перетаскивании, иначе props.scrollTop
 */
const effectiveScrollTop = computed(() =>
  previewScrollTop.value !== null ? previewScrollTop.value : props.scrollTop
);

/**
 * Геометрия handle (представление видимой области)
 * Определяет соотношение видимой области к общему контенту
 */
const viewportRatio = computed(() => {
  if (props.totalScrollHeight <= 0 || props.containerHeight <= 0) return 1;
  return Math.min(1, props.containerHeight / props.totalScrollHeight);
});

const handleHeight = computed(() => {
  // Поддерживаем разумную высоту, минимум 48px для удобства захвата
  const h = props.containerHeight * viewportRatio.value;
  return Math.max(48, Math.floor(h));
});

const maxHandleTop = computed(() => Math.max(0, props.containerHeight - handleHeight.value));

const handleTop = computed(() => {
  if (props.totalScrollHeight <= props.containerHeight) return 0;
  const scrollable = props.totalScrollHeight - props.containerHeight;
  const ratio = effectiveScrollTop.value / (scrollable || 1);
  return clamp(Math.floor(ratio * maxHandleTop.value), 0, maxHandleTop.value);
});

/**
 * Вычисляет позицию метки на скроллбаре в пикселях
 * @param mark - метка таймлайна с информацией о позиции
 * @returns позиция метки в пикселях относительно верха скроллбара
 */
const markTopPx = (mark: TimelineMark): number => {
  // Используем реальную позицию из DOM, если доступна (точный расчет)
  if (mark.realTopPx !== undefined) {
    // Конвертируем offsetTop контейнера в позицию на скроллбаре
    const scrollable = Math.max(1, props.totalScrollHeight - props.containerHeight);
    const usable = Math.max(1, props.containerHeight - handleHeight.value);
    const ratio = mark.realTopPx / Math.max(1, scrollable);
    return Math.floor(handleHeight.value / 2 + ratio * usable);
  }

  // Fallback: используем индекс субтитра для грубого позиционирования
  const ratio = mark.subtitleIndex / Math.max(1, props.subtitles.length - 1);
  const usable = Math.max(1, props.containerHeight - handleHeight.value);
  return Math.floor(handleHeight.value / 2 + ratio * usable);
};

/**
 * Форматирование времени для tooltip - показываем время текущего видимого субтитра
 */
const useHours = computed(() => props.totalMs >= 3600000);
const currentTimeMs = computed(() => {
  if (props.subtitles.length === 0) return 0;

  // Используем реальный индекс видимого субтитра из DOM
  const index = clamp(props.currentVisibleIndex, 0, props.subtitles.length - 1);
  const subtitle = props.subtitles[index];

  if (!subtitle || !subtitle.start) return 0;
  return parseTimeToMs(subtitle.start);
});
const formattedTooltipTime = computed(() => formatTime(currentTimeMs.value, useHours.value));
</script>

<style scoped>
.timeline {
  position: sticky;
  top: 0;
  height: 100%;
  inline-size: 72px; /* фиксированная ширина для предотвращения расширения контентом */
  min-inline-size: 64px;
  padding: 0 8px;
  background-color: #1e293b; /* slate-800 - темный фон */
  border-right: 1px solid #334155; /* slate-700 - серая правая граница */
  overflow: visible; /* разрешаем tooltip выходить за границы */
  user-select: none;
}

.mark {
  position: absolute;
  left: 0;
  width: 100%;
  padding-left: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: monospace;
  font-size: 12px;
  color: #94a3b8; /* slate-400 - светло-серый цвет */
  overflow: hidden; /* предотвращаем горизонтальное переполнение */
  transform: translateY(-50%);
  transition:
    color 0.2s,
    background 0.2s;
}

.tick {
  width: 12px;
  height: 1px;
  background: #94a3b8;
  flex-shrink: 0;
  border-radius: 9999px;
}

.major .tick {
  width: 20px;
  height: 2px;
  background: #cbd5f5;
  z-index: 10;
}

.label {
  white-space: nowrap;
  line-height: 1;
}

.minor {
  color: transparent; /* Скрываем текст метки */
}

.minor .tick {
  background: #475569; /* slate-600 для дополнительных меток */
}

/* Перетаскиваемая полоска скроллбара */
.handle {
  position: absolute;
  left: 0;
  width: 100%;
  background: rgba(148, 163, 184, 0.25); /* slate-400 с прозрачностью 25% */
  border-radius: 4px;
  cursor: default;
  z-index: 20;
  transition: background 0.15s ease-in-out;
}
.handle:hover {
  background: rgba(148, 163, 184, 0.4);
}
.handle.dragging {
  background: rgba(148, 163, 184, 0.55);
}

/* Всплывающая подсказка справа от полоски */
.tooltip {
  position: absolute;
  left: calc(100% + 8px);
  transform: translateY(-50%);
  padding: 4px 8px;
  background: #0f172a; /* slate-950 - темный фон */
  color: #e2e8f0; /* slate-200 - светлый текст */
  border: 1px solid #334155; /* slate-700 - серая граница */
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  white-space: nowrap;
  z-index: 30;
  pointer-events: none;
}
</style>