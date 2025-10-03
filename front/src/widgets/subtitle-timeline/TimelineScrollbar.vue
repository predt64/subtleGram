<template>
  <div
    class="timeline"
    role="slider"
    aria-label="Subtitle timeline scrollbar"
    :aria-valuemin="0"
    :aria-valuemax="totalMs"
    :aria-valuenow="currentTimeMs"
    ref="rootEl"
    @mousedown="onMouseDown"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
    @mouseup="onDragEnd"
  >
    <!-- Draggable handle representing viewport -->
    <div
      class="handle"
      :class="{ dragging: isDragging }"
      :style="{ top: `${handleTop}px`, height: `${handleHeight}px` }"
      @mousedown.stop="onDragStart"
      @click.stop
    />

    <!-- Tooltip on drag -->
    <div
      v-if="isDragging && showMarks"
      class="tooltip"
      :style="{ top: `${handleTop + handleHeight / 2}px` }"
    >
      {{ formattedTooltipTime }}
    </div>
    <!-- Marks -->
    <div
      v-for="mark in marks"
      :key="`${mark.subtitleIndex}-${mark.timeMs}`"
      class="mark"
      :class="{ major: mark.isMajor, minor: !mark.isMajor }"
      :style="{ top: `${markTopPx(mark)}px` }"
      :aria-label="mark.label ? `Subtitle at ${mark.label}` : 'Minor tick'"
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

interface Props {
  totalMs: number;
  containerHeight: number;
  scrollTop: number;
  totalScrollHeight: number;
  subtitles: any[]; // TODO: type as SentenceCard[]
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

// Internal interaction state
const rootEl = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const dragStartY = ref(0);
const dragStartScrollTop = ref(0);
const hoverY = ref<number | null>(null);
const previewScrollTop = ref<number | null>(null);
const suppressClickUntil = ref(0);

// Helpers
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const deltaYToScrollTop = (deltaY: number, base: number) => {
  const ratio = (props.totalScrollHeight || 1) / (props.containerHeight || 1);
  return base + deltaY * ratio;
};

// Events
const getLocalYFromClient = (clientY: number) => {
  const el = rootEl.value;
  if (!el) return 0;
  const rect = el.getBoundingClientRect();
  return clientY - rect.top;
};

const onMouseDown = (e: MouseEvent) => {
  console.log('onMouseDown');
  // Ignore if clicking on handle (handle has its own mousedown handler)
  if ((e.target as HTMLElement)?.classList.contains('handle')) return;

  const y = getLocalYFromClient(e.clientY);
  // Calculate new handle position based on click Y
  const newHandleTop = clamp(y - handleHeight.value / 2, 0, maxHandleTop.value);
  const scrollable = Math.max(1, props.totalScrollHeight - props.containerHeight);
  const ratio = newHandleTop / maxHandleTop.value;
  const newScrollTop = Math.floor(ratio * scrollable);

  // Start dragging from the new position
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
    hoverY.value = getLocalYFromClient(e.clientY);
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
  suppressClickUntil.value = Date.now() + 250;
  window.removeEventListener('mousemove', onWindowMouseMove);
  window.removeEventListener('mouseup', onWindowMouseUp);
};

const onMouseLeave = () => {
  hoverY.value = null;
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

// Effective scrollTop for live preview
const effectiveScrollTop = computed(() =>
  previewScrollTop.value !== null ? previewScrollTop.value : props.scrollTop
);

// Handle geometry (viewport representation)
const viewportRatio = computed(() => {
  if (props.totalScrollHeight <= 0 || props.containerHeight <= 0) return 1;
  return Math.min(1, props.containerHeight / props.totalScrollHeight);
});

const handleHeight = computed(() => {
  // Keep it reasonably long, min 48px
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

const markTopPx = (mark: TimelineMark) => {
  // Используем реальную позицию из DOM, если доступна
  if (mark.realTopPx !== undefined) {
    // Конвертируем offsetTop контейнера в позицию на скроллбаре
    const scrollable = Math.max(1, props.totalScrollHeight - props.containerHeight);
    const usable = Math.max(1, props.containerHeight - handleHeight.value);
    const ratio = mark.realTopPx / Math.max(1, scrollable);
    return Math.floor(handleHeight.value / 2 + ratio * usable);
  }
  
  // Fallback: используем индекс субтитра
  const ratio = mark.subtitleIndex / Math.max(1, props.subtitles.length - 1);
  const usable = Math.max(1, props.containerHeight - handleHeight.value);
  return Math.floor(handleHeight.value / 2 + ratio * usable);
};

// Tooltip time formatting - показываем время текущего видимого субтитра
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
  inline-size: 72px; /* fixed width to avoid content-based expansion */
  min-inline-size: 64px;
  padding: 0 8px;
  background-color: #1e293b; /* slate-800 */
  border-right: 1px solid #334155; /* slate-700 */
  overflow: visible; /* allow tooltip to overflow */
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
  color: #94a3b8; /* slate-400 */
  overflow: hidden; /* prevent horizontal bleed */
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
  color: transparent; /* Hide label */
}

.minor .tick {
  background: #475569; /* slate-600 for minor ticks */
}

/* Draggable handle */
.handle {
  position: absolute;
  left: 0;
  width: 100%;
  background: rgba(148, 163, 184, 0.25); /* slate-400 @ 25% */
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

/* Tooltip to the right of handle */
.tooltip {
  position: absolute;
  left: calc(100% + 8px);
  transform: translateY(-50%);
  padding: 4px 8px;
  background: #0f172a; /* slate-950 */
  color: #e2e8f0; /* slate-200 */
  border: 1px solid #334155; /* slate-700 */
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  white-space: nowrap;
  z-index: 30;
  pointer-events: none;
}
</style>
