<template>
  <div class="flex flex-col px-4 pt-2 h-full min-h-0 subtitle-timeline">
    <div class="mb-4">
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск по субтитрам..."
          class="bg-slate-700/50 px-4 py-2 pr-10 pl-10 border border-slate-600/50 focus:border-blue-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-full text-white text-sm placeholder-slate-400"
        />
        <svg
          class="top-1/2 left-3 absolute w-4 h-4 text-slate-400 -translate-y-1/2 transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <button
          v-if="searchQuery"
          @click="clearSearch"
          class="top-1/2 right-3 absolute flex justify-center items-center w-4 h-4 text-slate-400 hover:text-slate-300 transition-colors -translate-y-1/2 transform"
        >
          <svg
            class="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <p v-if="hasActiveSearch" class="mt-2 text-slate-400 text-xs">
        Найдено: {{ filteredSubtitles.length }}
      </p>
    </div>

    <!-- Список субтитров -->
    <div ref="timelineRef" class="flex flex-1 min-h-0">
      <TimelineScrollbar
        :total-ms="subtitleStore.totalDurationMs"
        :container-height="containerHeight"
        :scroll-top="currentScrollTop"
        :total-scroll-height="scrollHeight"
        :subtitles="filteredSubtitles"
        :subtitle-geometry="subtitleGeometry"
        :current-visible-index="currentVisibleIndex"
        :show-marks="!hasActiveSearch"
        @seek="seekToTime"
        @update-scroll-top="handleExternalScrollTop"
      />
      <div
        ref="timelineContainer"
        class="flex-1 space-y-2 ml-2 min-h-0 overflow-y-auto scrollbar-hide"
        @scroll="updateScroll"
      >
        <template v-if="filteredSubtitles.length > 0">
          <div
            v-for="(subtitle, index) in filteredSubtitles"
            :key="subtitle.id"
            :ref="(el) => setSubtitleRef(index, el)"
            @click="selectSubtitle(index)"
            :class="getSubtitleClasses(index)"
          >
            <div
              :class="getSubtitleTextClasses(index)"
              v-html="
                subtitleStore.searchQuery
                  ? highlightSearchTerms(
                      subtitle.text,
                      subtitleStore.searchQuery
                    )
                  : subtitle.text
              "
            ></div>
            <div class="flex items-center gap-2 mt-2">
              <div
                :class="[
                  'w-2 h-2 rounded-full',
                  getSubtitleStatusData(index).colorClass,
                ]"
              ></div>
              <span class="text-slate-400 text-xs">
                {{ getSubtitleStatusData(index).text }}
              </span>
            </div>
          </div>
        </template>
        <div
          v-else
          class="flex flex-col justify-center items-center px-4 py-8 h-full text-center"
        >
          <div
            class="flex justify-center items-center bg-slate-700/50 mx-auto mb-4 rounded-full w-16 h-16"
          >
            <svg
              class="w-8 h-8 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p class="text-slate-400 text-sm">
            {{
              subtitleStore.searchQuery
                ? "Поиск не дал результатов"
                : "Субтитры не загружены"
            }}
          </p>
          <p
            v-if="subtitleStore.searchQuery"
            class="mt-1 text-slate-500 text-xs"
          >
            Попробуйте другой поисковый запрос
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useSubtitleStore } from "@/entities/subtitle";
import TimelineScrollbar from "./TimelineScrollbar.vue";
import { parseTimeToMs, clamp } from "@/shared/lib";
import { useSubtitleNavigation } from "./composables/useSubtitleNavigation";
import { useSubtitleGeometry } from "./composables/useSubtitleGeometry";
import { useSubtitleSearch } from "./composables/useSubtitleSearch";

const subtitleStore = useSubtitleStore();

/**
 * Ссылка на корневой элемент компонента
 */
const timelineRef = ref<HTMLElement | null>(null);

/**
 * Высота видимой области контейнера субтитров
 */
const containerHeight = ref(0);

/**
 * Текущая позиция скролла контейнера
 */
const currentScrollTop = ref(0);

/**
 * Общая высота контента контейнера (включая прокручиваемую часть)
 */
const scrollHeight = ref(0);

/**
 * Обрабатывает событие скролла контейнера субтитров
 * Обновляет текущую позицию скролла и определяет видимый субтитр
 * @param e - событие скролла от контейнера
 */
const updateScroll = (e: Event): void => {
  const target = e.target as HTMLElement;
  currentScrollTop.value = target.scrollTop;
  scrollHeight.value = target.scrollHeight;

  // Обновляем индекс видимого субтитра при скролле
  currentVisibleIndex.value = getTopVisibleSubtitleIndex(target);
};

/**
 * Обрабатывает внешнюю команду изменения позиции скролла
 * Используется скроллбаром для программного управления прокруткой
 * @param newTop - новая позиция скролла в пикселях
 */
const handleExternalScrollTop = (newTop: number): void => {
  const container = timelineContainer.value;
  if (!container) return;
  const maxTop = Math.max(0, container.scrollHeight - container.clientHeight);
  const clamped = clamp(newTop, 0, maxTop);
  if (Math.abs(container.scrollTop - clamped) > 1) {
    scrollInProgress = true;
    container.scrollTo({ top: clamped, behavior: "auto" });
    requestAnimationFrame(() => {
      scrollInProgress = false;
      // Обновляем индекс видимого субтитра после программной прокрутки
      currentVisibleIndex.value = getTopVisibleSubtitleIndex(container);
    });
  }
};

/**
 * Ссылка на контейнер субтитров для управления скроллом
 */
const timelineContainer = ref<HTMLElement>();

/**
 * Массив ссылок на DOM элементы субтитров для быстрого доступа
 */
const subtitleRefs = ref<(HTMLElement | null)[]>([]);

/**
 * Флаг предотвращения одновременных анимаций скролла
 */
let scrollInProgress = false;

/**
 * Наблюдатель за изменениями размера контейнера
 */
let resizeObserver: ResizeObserver | null = null;

interface Props {
  modelValue?: number;
  searchQuery?: string;
  filteredSubtitles?: any[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:modelValue": [index: number];
}>();

const selectedSubtitleIndex = computed(() => props.modelValue ?? -1);

const highlightedIndex = computed(() => {
  if (selectedSubtitleIndex.value === -1) {
    return -1;
  }

  if (!subtitleStore.searchQuery) {
    return selectedSubtitleIndex.value;
  }

  return subtitleStore.findFilteredIndex(
    subtitleStore.sentenceCards[selectedSubtitleIndex.value]?.id || -1
  );
});

const filteredSubtitles = computed(() => {
  return subtitleStore.filteredSubtitles;
});

const {
  searchQuery,
  hasActiveSearch,
  highlightSearchTerms,
  clearSearch,
  setupSearchWatcher,
  cleanup: cleanupSearch,
} = useSubtitleSearch();

const {
  subtitleGeometry,
  currentVisibleIndex,
  getTopVisibleSubtitleIndex,
  updateGeometry,
} = useSubtitleGeometry();

const { selectSubtitle, handleKeydown, seekToTime } = useSubtitleNavigation(
  () => filteredSubtitles.value,
  () => highlightedIndex.value,
  emit
);

/**
 * Вычисляет классы для элемента субтитра в зависимости от его состояния
 */
const getSubtitleClasses = (index: number) => {
  const isHighlighted = highlightedIndex.value === index;
  return [
    "subtitle-item p-3 rounded-lg cursor-pointer transition-all duration-200 border-l-4",
    isHighlighted
      ? "bg-blue-500/20 border-blue-400 shadow-md"
      : "bg-slate-700/30 border-transparent hover:bg-slate-700/50 hover:border-slate-600",
  ];
};

/**
 * Вычисляет классы для текста субтитра
 */
const getSubtitleTextClasses = (index: number) => {
  const isHighlighted = highlightedIndex.value === index;
  return [
    "text-sm leading-relaxed",
    isHighlighted ? "text-blue-100" : "text-slate-200",
  ];
};

/**
 * Вычисляет статус субтитра с полными данными
 * @param filteredIndex - индекс в отфильтрованном массиве
 */
const getSubtitleStatusData = (filteredIndex: number) => {
  const subtitle = filteredSubtitles.value[filteredIndex];
  if (!subtitle)
    return {
      status: "new" as const,
      colorClass: "bg-yellow-400",
      text: "Новый",
    };

  const status = subtitleStore.analyzedSubtitles.has(subtitle.text)
    ? "analyzed"
    : "new";
  return {
    status,
    colorClass: status === "analyzed" ? "bg-green-400" : "bg-yellow-400",
    text: status === "analyzed" ? "Проанализирован" : "Новый",
  };
};

// Настраиваем watcher для поиска
setupSearchWatcher();

/**
 * Следит за изменениями списка субтитров и обновляет размеры контейнера
 */
watch(
  () => [filteredSubtitles.value.length, hasActiveSearch.value],
  () => {
    nextTick(() => {
      const container = timelineContainer.value;
      if (!container) return;

      containerHeight.value = container.clientHeight;
      scrollHeight.value = container.scrollHeight;

      // Корректируем позицию скролла если она выходит за пределы
      const maxTop = Math.max(0, scrollHeight.value - containerHeight.value);
      if (currentScrollTop.value > maxTop) {
        currentScrollTop.value = maxTop;
        container.scrollTop = maxTop;
      }

      updateGeometry(timelineContainer.value);
    });
  }
);

/**
 * Автоматически прокручивает к выбранному субтитру с плавной анимацией
 * Предотвращает одновременные анимации прокрутки
 * @param index - индекс субтитра в отфильтрованном массиве
 */
const scrollToSubtitle = (index: number): void => {
  if (!timelineContainer.value || scrollInProgress) return;
  if (index < 0 || index >= filteredSubtitles.value.length) return;

  const element = subtitleRefs.value[index];
  if (!element) return;

  scrollInProgress = true;
  const container = timelineContainer.value;

  const elementTop = element.offsetTop;
  const elementHeight = element.offsetHeight;
  const containerHeight = container.offsetHeight;

  const scrollTop = clamp(
    elementTop - containerHeight / 2 + elementHeight / 2,
    0,
    container.scrollHeight - containerHeight
  );

  container.scrollTo({
    top: scrollTop,
    behavior: "smooth",
  });

  setTimeout(() => {
    scrollInProgress = false;
  }, 300);
};

/**
 * Устанавливает ссылку на DOM элемент субтитра для доступа к нему
 * @param filteredIndex - индекс в отфильтрованном массиве
 * @param el - DOM элемент или компонент Vue
 */
const setSubtitleRef = (filteredIndex: number, el: any): void => {
  subtitleRefs.value[filteredIndex] = el as HTMLElement | null;
};

// Watcher для поиска обрабатывается в useSubtitleSearch composable

watch(
  () => props.modelValue,
  (newIndex, oldIndex) => {
    if (newIndex !== undefined && newIndex !== oldIndex && newIndex >= 0) {
      setTimeout(() => {
        const subtitle = subtitleStore.sentenceCards[newIndex];
        if (subtitle) {
          const filteredIndex = subtitleStore.findFilteredIndex(subtitle.id);
          if (
            filteredIndex >= 0 &&
            filteredIndex < filteredSubtitles.value.length
          ) {
            scrollToSubtitle(filteredIndex);
          }
        }
      }, 100);
    }
  },
  { immediate: true } // Добавляем immediate: true для начальной загрузки
);

/**
 * Инициализация компонента - добавляем обработчики событий и обсервера
 */
onMounted(() => {
  document.addEventListener("keydown", handleKeydown);

  resizeObserver = new ResizeObserver(() => {
    if (timelineContainer.value) {
      containerHeight.value = timelineContainer.value.clientHeight;
      scrollHeight.value = timelineContainer.value.scrollHeight;
      updateGeometry(timelineContainer.value);
    }
  });

  if (timelineContainer.value) {
    resizeObserver.observe(timelineContainer.value);
    // Инициализация размеров и геометрии
    containerHeight.value = timelineContainer.value.clientHeight;
    scrollHeight.value = timelineContainer.value.scrollHeight;
    currentVisibleIndex.value = getTopVisibleSubtitleIndex(
      timelineContainer.value
    );
    updateGeometry(timelineContainer.value);
  }
});

/**
 * Очистка ресурсов перед размонтированием компонента
 */
onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleKeydown);
  scrollInProgress = false;
  cleanupSearch();
  if (resizeObserver) resizeObserver.disconnect();
});
</script>

<style scoped>
.subtitle-item:hover {
  transform: translateX(2px);
}

.scrollbar-hide {
  scrollbar-width: none;

  -ms-overflow-style: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
