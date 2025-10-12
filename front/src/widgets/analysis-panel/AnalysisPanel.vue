<!--
  AnalysisPanel - панель детального анализа субтитров

  Состояния:
  - empty: пользователь не выбрал субтитр для анализа
  - analyzing: идет запрос к API анализа
  - error: ошибка анализа с кнопкой повтора
  - success: результаты анализа (перевод, грамматика, сленг)
-->
<template>
  <div class="p-6 analysis-panel">
    <!-- Уведомление о демо-режиме -->
    <div
      v-if="isDemo"
      class="bg-yellow-500/10 mb-4 p-3 border border-yellow-500/20 rounded-lg"
    >
      <div class="flex items-center gap-2">
        <svg class="flex-shrink-0 w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        <div>
          <p class="font-medium text-yellow-600 text-sm">Демо-режим</p>
          <p class="text-yellow-600/80 text-xs">
            Это демо-версия с моковыми данными анализа.
            Для полного функционала разверните проект локально.
          </p>
        </div>
      </div>
    </div>
    <!-- Состояние: нет выбранного субтитра -->
    <div
      v-if="!selectedSubtitle"
      class="flex justify-center items-center h-full"
    >
      <div class="text-center">
        <div
          class="flex justify-center items-center bg-slate-700/50 mx-auto mb-6 rounded-full w-20 h-20"
        >
          <svg
            class="w-10 h-10 text-slate-500"
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
        <h3 class="mb-2 font-semibold text-white text-lg">Выберите субтитр</h3>
        <p class="text-slate-400 text-sm">
          Кликните на любое предложение слева, чтобы увидеть детальный анализ
        </p>
      </div>
    </div>

    <!-- Состояние: анализ завершен успешно -->
    <div v-else class="max-w-4xl">
      <!-- Заголовок с предложением -->
      <div class="mb-8">
        <div class="flex items-center gap-3 mb-4">
          <h2 class="font-bold text-white text-2xl">Анализ предложения</h2>
          <div
            v-if="analysisState === 'success' && analysisData"
            class="bg-blue-500/20 px-3 py-1 rounded-full font-medium text-blue-300 text-sm"
          >
            {{ analysisData.analysis.cefr || "B1" }}
          </div>
        </div>

        <div class="bg-slate-800/50 p-4 border border-slate-700/50 rounded-lg">
          <p class="text-white text-lg leading-relaxed">
            {{ selectedSubtitle.text }}
          </p>
        </div>
      </div>

    <!-- Состояние: анализ в процессе -->
    <AnalysisLoading v-if="analysisState === 'analyzing'" class="mb-8" />

    <!-- Состояние: ошибка анализа -->
    <AnalysisError
      v-else-if="analysisState === 'error'"
      class="mb-8"
      :error-message="analysisError"
      @retry="loadAnalysis(props.modelValue!)"
    />

      <!-- Результаты анализа -->
      <div v-if="analysisState === 'success' && analysisData">
        <!-- Секция переводов -->
        <div class="mb-8">
          <h3 class="mb-4 font-semibold text-white text-lg">Перевод</h3>
          <TranslationSection
            :natural="analysisData.analysis.translations?.find(v => v.style === 'natural')?.text"
            :literal="analysisData.analysis.translations?.find(v => v.style === 'literal')?.text"
          />
        </div>

        <!-- Секция грамматики -->
        <div class="mb-8">
          <h3 class="mb-4 font-semibold text-white text-lg">Грамматика</h3>
          <GrammarSection
            :features="analysisData.analysis.features"
            :explanation="analysisData.analysis.explanation"
          />
        </div>

        <!-- Секция сленга и идиом -->
        <div class="mb-8">
          <h3 class="mb-4 font-semibold text-white text-lg">Сленг и идиомы</h3>
          <SlangSection :slang="analysisData.analysis.slang" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from "vue";
import { useSubtitleStore } from "@/entities/subtitle";
import { subtitleApi } from "@/shared/api/subtitleApi";
import type {
  AnalysisState,
  AnalyzeResponseData,
} from "@/shared/types";
import AnalysisLoading from "./components/AnalysisLoading.vue";
import AnalysisError from "./components/AnalysisError.vue";
import TranslationSection from "./components/TranslationSection.vue";
import GrammarSection from "./components/GrammarSection.vue";
import SlangSection from "./components/SlangSection.vue";

interface Props {
  modelValue?: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:modelValue": [index: number];
}>();

const subtitleStore = useSubtitleStore();

/**
 * Проверка демо-режима для отображения уведомления
 */
const isDemo = computed(() => {
  if (typeof window === 'undefined') return false;
  return window.$nuxt?.isDemo === 'true';
})

/**
 * Преобразует ошибку API в понятное пользователю сообщение
 * @param error - объект ошибки
 * @returns локализованное сообщение об ошибке
 */
const getErrorMessage = (error: any): string => {
  const message = error.message || '';

  if (message.includes("exceeded your monthly included credits") ||
      message.includes("Inference Providers")) {
    return "Закончились токены Hugging Face. Попробуйте в начале следующего месяца или перейдите на PRO план.";
  }

  if (message.includes("429") || message.includes("Too Many Requests")) {
    return "Превышен лимит запросов. Подождите немного и попробуйте снова.";
  }

  if (message.includes("408") || message.includes("timeout")) {
    return "Анализ занял слишком много времени. Попробуйте с более коротким предложением.";
  }

  if (message.includes("503") || message.includes("Service Unavailable")) {
    return "Сервис анализа временно недоступен. Попробуйте позже.";
  }

  if (message.includes("502") || message.includes("Bad Gateway")) {
    return "Ошибка обработки запроса. Попробуйте еще раз.";
  }

  if (message.includes("401") || message.includes("Unauthorized")) {
    return "Ошибка аутентификации API. Проверьте настройки сервера.";
  }

  return error instanceof Error ? error.message : "Неизвестная ошибка анализа";
};

// Состояния анализа
const analysisState = ref<AnalysisState>("idle");
const analysisError = ref<string>("");

// AbortController для отмены предыдущих запросов
let currentAbortController: AbortController | null = null;

const selectedSubtitle = computed(() =>
  props.modelValue !== undefined && props.modelValue >= 0
    ? subtitleStore.sentenceCards[props.modelValue] || null
    : null
);

/**
 * Извлекает название сериала из имени файла субтитров
 * Пример: "The.Walking.Dead.S01E01.srt" -> "The Walking Dead S01E01"
 */
const seriesName = computed(() => {
  if (!subtitleStore.filename) return undefined;

  // Убираем расширение файла
  const nameWithoutExt = subtitleStore.filename.replace(/\.[^/.]+$/, "");

  // Преобразуем точки в пробелы для читаемости
  // "The.Walking.Dead.S01E01" -> "The Walking Dead S01E01"
  return nameWithoutExt.replace(/\./g, " ");
});

/**
 * Данные анализа из API
 */
const analysisData = ref<AnalyzeResponseData | null>(null);

/**
 * Получить контекст предложения (предыдущее и следующее)
 */
const getSentenceContext = (currentIndex: number) => {
  const cards = subtitleStore.sentenceCards;
  const prev = currentIndex > 0 ? cards[currentIndex - 1]?.text || "" : "";
  const next =
    currentIndex < cards.length - 1 ? cards[currentIndex + 1]?.text || "" : "";
  return { prev, next };
};

/**
 * Загрузить анализ для выбранного предложения
 */
const loadAnalysis = async (subtitleIndex: number) => {
  const subtitle = subtitleStore.sentenceCards[subtitleIndex];
  if (!subtitle) return;

  // Отменяем предыдущий запрос, если он активен
  if (currentAbortController) {
    currentAbortController.abort();
  }

  // Создаем новый AbortController для этого запроса
  currentAbortController = new AbortController();

  // Сбрасываем состояние для нового анализа
  analysisState.value = "analyzing";
  analysisError.value = "";
  analysisData.value = null;

  try {
    const context = getSentenceContext(subtitleIndex);
    const response = await subtitleApi.analyzeSubtitles(
      subtitle.text,
      context,
      seriesName.value,
      currentAbortController.signal
    );


    if (response.success && response.data) {
      analysisData.value = response.data;
      analysisState.value = "success";

      // Отмечаем субтитр как проанализированный
      if (props.modelValue !== undefined && props.modelValue >= 0) {
        const subtitle = subtitleStore.sentenceCards[props.modelValue];
        if (subtitle) {
          subtitleStore.markAsAnalyzed(subtitle.text);
        }
      }
    } else {
      throw new Error(response.message || "Ошибка анализа");
    }
  } catch (error: any) {
    // Игнорируем только отмену от пользователя (не показываем ошибку)
    if (error.name === "AbortError") {
      console.log("Analysis request was cancelled by user");
      return;
    }

    // Таймауты и другие ошибки показываем пользователю
    analysisState.value = "error";
    analysisError.value = getErrorMessage(error);

    console.error("Analysis error:", error);
  }
};


/**
 * Следит за изменениями выбранного субтитра
 * Запускает анализ через API
 */
watch(
  () => props.modelValue,
  (newIndex) => {
    if (newIndex !== undefined && newIndex >= 0) {
      loadAnalysis(newIndex);
    } else {
      // Отменяем текущий запрос и сбрасываем состояние
      if (currentAbortController) {
        currentAbortController.abort();
        currentAbortController = null;
      }
      analysisData.value = null;
      analysisState.value = "idle";
      analysisError.value = "";
    }
  },
  { immediate: true }
);
</script>

<style scoped>
/* Analysis Panel стили */
.analysis-panel {
  height: 100%;
  overflow-y: auto;
}
</style>
