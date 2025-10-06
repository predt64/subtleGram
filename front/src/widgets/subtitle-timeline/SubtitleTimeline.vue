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
      <p
        v-if="hasActiveSearch"
        class="mt-2 text-slate-400 text-xs"
      >
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
                  ? highlightSearchTerms(subtitle.text, subtitleStore.searchQuery)
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
          <p v-if="subtitleStore.searchQuery" class="mt-1 text-slate-500 text-xs">
            Попробуйте другой поисковый запрос
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useSubtitleStore } from "@/entities/subtitle";
import TimelineScrollbar from './TimelineScrollbar.vue'
import { parseTimeToMs, type SubtitleGeometry } from "@/shared/lib/timelineMarks";

const subtitleStore = useSubtitleStore();

const searchQuery = ref(subtitleStore.searchQuery);

const hasActiveSearch = computed(() => !!subtitleStore.searchQuery.trim());

const timelineRef = ref<HTMLElement | null>(null)
const containerHeight = ref(0)
const currentScrollTop = ref(0)
const scrollHeight = ref(0)
const currentVisibleIndex = ref(0)
const subtitleGeometry = ref<SubtitleGeometry[]>([])

/**
 * Определяет индекс верхнего видимого субтитра через DOM
 * Это обеспечивает точную синхронизацию скролла независимо от высоты элементов
 */
const getTopVisibleSubtitleIndex = (): number => {
  const container = timelineContainer.value;
  if (!container) return 0;
  
  const containerRect = container.getBoundingClientRect();
  const containerTop = containerRect.top;
  const elements = container.querySelectorAll('.subtitle-item');
  
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
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
 * Собирает реальную геометрию субтитров из DOM
 * Используется для точного позиционирования меток на скроллбаре
 */
const getSubtitleGeometry = (): SubtitleGeometry[] => {
  const container = timelineContainer.value;
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
 * Обновляет геометрию субтитров после рендера
 */
const updateGeometry = () => {
  nextTick(() => {
    subtitleGeometry.value = getSubtitleGeometry();
  });
};

const seekToTime = (timeMs: number) => {
  const cards = filteredSubtitles.value;
  if (!cards.length) return;
  let targetIndex = cards.findIndex(
    (c) => parseTimeToMs(c.start || "00:00:00") >= timeMs
  );
  if (targetIndex < 0) targetIndex = cards.length - 1;
  scrollToSubtitle(targetIndex);
};

const updateScroll = (e: Event) => {
  const target = e.target as HTMLElement
  currentScrollTop.value = target.scrollTop
  scrollHeight.value = target.scrollHeight
  
  // Обновляем индекс видимого субтитра при скролле
  currentVisibleIndex.value = getTopVisibleSubtitleIndex()
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const handleExternalScrollTop = (newTop: number) => {
  const container = timelineContainer.value
  if (!container) return
  const maxTop = Math.max(0, container.scrollHeight - container.clientHeight)
  const clamped = clamp(newTop, 0, maxTop)
  if (Math.abs(container.scrollTop - clamped) > 1) {
    scrollInProgress = true
    container.scrollTo({ top: clamped, behavior: 'auto' })
    requestAnimationFrame(() => {
      scrollInProgress = false
      // Обновляем индекс видимого субтитра после программной прокрутки
      currentVisibleIndex.value = getTopVisibleSubtitleIndex()
    })
  }
}

const timelineContainer = ref<HTMLElement>();
const subtitleRefs = ref<(HTMLElement | null)[]>([]);

let scrollInProgress = false;
let searchTimeout: ReturnType<typeof setTimeout> | null = null;
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
 */
const getSubtitleStatusData = (index: number) => {
  const status = getSubtitleStatus(index);
  return {
    status,
    colorClass: status === "analyzed" ? "bg-green-400" : "bg-yellow-400",
    text: status === "analyzed" ? "Проанализирован" : "Новый",
  };
};

/**
 * Подсвечивает поисковые термины в тексте субтитра
 * @param text - исходный текст субтитра
 * @param query - поисковый запрос
 * @returns HTML строка с подсвеченными терминами
 */
const highlightSearchTerms = (text: string, query: string): string => {
  if (!query) return text;

  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi"
  );
  return text.replace(
    regex,
    '<mark class="bg-yellow-400 px-1 rounded text-slate-900">$1</mark>'
  );
};

/**
 * Выбирает субтитр по индексу в отфильтрованном массиве
 * Находит соответствующий субтитр в оригинальном массиве и обновляет modelValue
 * @param filteredIndex - индекс в отфильтрованном массиве
 */
const selectSubtitle = (filteredIndex: number) => {
  const subtitle = filteredSubtitles.value[filteredIndex];
  if (subtitle) {
    const originalIndex = subtitleStore.sentenceCards.findIndex(
      (s) => s.id === subtitle.id
    );
    if (originalIndex !== -1) {
      emit("update:modelValue", originalIndex);
    }
  }
};

/**
 * Возвращает статус анализа субтитра
 * @param index - индекс субтитра
 * @returns статус анализа ('analyzed' | 'new')
 */
const getSubtitleStatus = (index: number): "analyzed" | "new" => {
  // TODO: Проверять реальный статус анализа через API/store
  return index % 3 === 0 ? "analyzed" : "new";
};

const clearSearch = () => {
  searchQuery.value = "";
};

watch(searchQuery, (newQuery) => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const trimmedQuery = newQuery.trim();
    if (subtitleStore.searchQuery !== trimmedQuery) {
      subtitleStore.setSearchQuery(trimmedQuery);
    }
  }, 300);
});

watch(
  () => [filteredSubtitles.value.length, hasActiveSearch.value],
  () => {
    nextTick(() => {
      const container = timelineContainer.value;
      if (!container) return;

      const newContainerHeight = container.clientHeight;
      const newScrollHeight = container.scrollHeight;

      containerHeight.value = newContainerHeight;
      scrollHeight.value = newScrollHeight;

      const maxTop = Math.max(0, newScrollHeight - newContainerHeight);
      if (currentScrollTop.value > maxTop) {
        currentScrollTop.value = maxTop;
        container.scrollTop = maxTop;
      }
      
      // Обновляем геометрию после изменения списка субтитров
      updateGeometry();
    });
  }
);

/**
 * Автоматически прокручивает к выбранному субтитру с плавной анимацией
 * Предотвращает одновременные анимации прокрутки
 * @param index - индекс субтитра в отфильтрованном массиве
 */
const scrollToSubtitle = (index: number) => {
  if (!timelineContainer.value || scrollInProgress) return;

  if (index < 0 || index >= filteredSubtitles.value.length) return;

  scrollInProgress = true;

  const tryScroll = () => {
    const element = subtitleRefs.value[index];
    if (!element || !element.offsetTop) {
      setTimeout(tryScroll, 50);
      return;
    }

    const container = timelineContainer.value;
    if (!container) {
      scrollInProgress = false;
      return;
    }

    const elementTop = element.offsetTop;
    const elementHeight = element.offsetHeight;
    const containerHeight = container.offsetHeight;

    const scrollTop = elementTop - containerHeight / 2 + elementHeight / 2;

    if (
      scrollTop >= 0 &&
      scrollTop <= container.scrollHeight - containerHeight
    ) {
      container.scrollTo({
        top: scrollTop,
        behavior: "smooth",
      });

      setTimeout(() => {
        scrollInProgress = false;
      }, 300);
    } else {
      scrollInProgress = false;
    }
  };

  tryScroll();
};

/**
 * Устанавливает ссылку на DOM элемент субтитра для доступа к нему
 * @param filteredIndex - индекс в отфильтрованном массиве
 * @param el - DOM элемент субтитра
 */
const setSubtitleRef = (filteredIndex: number, el: any) => {
  subtitleRefs.value[filteredIndex] = el as HTMLElement | null;
};

/**
 * Обрабатывает клавиатурную навигацию по субтитрам
 * Поддерживает стрелки вверх/вниз для навигации по отфильтрованному массиву
 * @param event - событие клавиатуры
 */
const handleKeydown = (event: KeyboardEvent) => {
  // Не перехватываем клавиши, если фокус в поле поиска
  if (event.target instanceof HTMLInputElement && event.target.type === 'text') {
    return;
  }

  if (!filteredSubtitles.value.length) return;

  // Находим текущий индекс в отфильтрованном массиве
  const currentFilteredIndex = highlightedIndex.value;
  let newFilteredIndex = currentFilteredIndex;

  switch (event.key) {
    case "ArrowUp":
      event.preventDefault();
      newFilteredIndex = Math.max(0, currentFilteredIndex - 1);
      break;
    case "ArrowDown":
      event.preventDefault();
      newFilteredIndex = Math.min(filteredSubtitles.value.length - 1, currentFilteredIndex + 1);
      break;
    case "Enter":
    case " ":
      event.preventDefault();
      break;
  }

  if (newFilteredIndex !== currentFilteredIndex && newFilteredIndex >= 0) {
    // Преобразуем индекс в отфильтрованном массиве в индекс в полном массиве
    const targetSubtitle = filteredSubtitles.value[newFilteredIndex];
    if (targetSubtitle) {
      const originalIndex = subtitleStore.sentenceCards.findIndex(
        (s) => s.id === targetSubtitle.id
      );
      if (originalIndex !== -1) {
        emit("update:modelValue", originalIndex);
      }
    }
  }
};

watch(
  () => subtitleStore.searchQuery,
  (newQuery) => {
    if (searchQuery.value !== newQuery) {
      searchQuery.value = newQuery;
    }
    if (newQuery && subtitleStore.filteredSubtitles.length > 0) {
      setTimeout(() => scrollToSubtitle(0), 100);
    }
  }
);

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
  { immediate: true }  // Добавляем immediate: true для начальной загрузки
);

onMounted(() => {
  document.addEventListener("keydown", handleKeydown)

  resizeObserver = new ResizeObserver(() => {
    if (timelineContainer.value) {
      containerHeight.value = timelineContainer.value.clientHeight
      scrollHeight.value = timelineContainer.value.scrollHeight
      // Обновляем геометрию при ресайзе
      updateGeometry()
    }
  })
  if (timelineContainer.value) resizeObserver.observe(timelineContainer.value)

  // Initial calc
  if (timelineContainer.value) {
    containerHeight.value = timelineContainer.value.clientHeight
    scrollHeight.value = timelineContainer.value.scrollHeight
    // Инициализируем индекс видимого субтитра и геометрию
    currentVisibleIndex.value = getTopVisibleSubtitleIndex()
    updateGeometry()
  }
})

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleKeydown)
  scrollInProgress = false
  if (searchTimeout) clearTimeout(searchTimeout)
  if (resizeObserver) resizeObserver.disconnect()
})
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
