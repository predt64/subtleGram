<template>
  <div class="p-4 subtitle-timeline">
    <h3 class="mb-4 font-semibold text-white text-lg">
      Субтитры
      <span
        v-if="subtitleStore.searchQuery"
        class="ml-2 font-normal text-slate-400 text-sm"
      >
        (найдено: {{ filteredSubtitles.length }})
      </span>
    </h3>

    <!-- Список субтитров -->
    <div
      ref="timelineContainer"
      class="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-hide"
    >
      <div
        v-for="(subtitle, index) in filteredSubtitles"
        :key="subtitle.id"
        :ref="(el) => setSubtitleRef(index, el)"
        @click="selectSubtitle(index)"
        :class="getSubtitleClasses(index)"
      >
        <!-- Текст карточки (предложение) -->
        <div
          :class="getSubtitleTextClasses(index)"
          v-html="
            subtitleStore.searchQuery
              ? highlightSearchTerms(subtitle.text, subtitleStore.searchQuery)
              : subtitle.text
          "
        ></div>

        <!-- Статус анализа -->
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
    </div>

    <!-- Если нет субтитров -->
    <div v-if="filteredSubtitles.length === 0" class="py-8 text-center">
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
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useSubtitleStore } from "@/entities/subtitle";

const subtitleStore = useSubtitleStore();

const timelineContainer = ref<HTMLElement>();
const subtitleRefs = ref<(HTMLElement | null)[]>([]);

let scrollInProgress = false;

interface Props {
  modelValue?: number;
  searchQuery?: string;
  filteredSubtitles?: any[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:modelValue": [index: number];
}>();

const selectedSubtitleIndex = computed(() => props.modelValue || 0);

const highlightedIndex = computed(() => {
  if (!subtitleStore.searchQuery) {
    return selectedSubtitleIndex.value;
  }

  return subtitleStore.findFilteredIndex(
    subtitleStore.sentenceCards[selectedSubtitleIndex.value]?.id || 0
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
 * Время сейчас не отображаем. Кастомный скроллбар добавим позже.
 */

/**
 * Возвращает статус анализа субтитра
 * @param index - индекс субтитра
 * @returns статус анализа ('analyzed' | 'new')
 */
const getSubtitleStatus = (index: number): "analyzed" | "new" => {
  // TODO: Проверять реальный статус анализа через API/store
  return index % 3 === 0 ? "analyzed" : "new";
};

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
 * Поддерживает стрелки вверх/вниз для навигации
 * @param event - событие клавиатуры
 */
const handleKeydown = (event: KeyboardEvent) => {
  if (!subtitleStore.sentenceCards.length) return;

  const currentIndex = selectedSubtitleIndex.value;
  let newIndex = currentIndex;

  switch (event.key) {
    case "ArrowUp":
      event.preventDefault();
      newIndex = Math.max(0, currentIndex - 1);
      break;
    case "ArrowDown":
      event.preventDefault();
      newIndex = Math.min(subtitleStore.sentenceCards.length - 1, currentIndex + 1);
      break;
    case "Enter":
    case " ":
      event.preventDefault();
      break;
  }

  if (newIndex !== currentIndex) {
    emit("update:modelValue", newIndex);
  }
};

watch(
  () => subtitleStore.searchQuery,
  (newQuery) => {
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
  }
);

onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleKeydown);
  scrollInProgress = false;
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
