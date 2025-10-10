<template>
  <div class="p-6 analysis-panel">
    <!-- Если нет выбранного субтитра -->
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

    <!-- Детальный анализ -->
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

      <!-- Состояние анализа -->
      <div v-if="analysisState === 'analyzing'" class="mb-8">
        <div class="bg-slate-800/50 p-8 border border-slate-700/50 rounded-lg">
          <div class="flex justify-center items-center">
            <div class="flex items-center gap-3">
              <div
                class="border-b-2 border-blue-500 rounded-full w-6 h-6 animate-spin"
              ></div>
              <p class="text-slate-300">Анализирую предложение...</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Ошибка анализа -->
      <div v-else-if="analysisState === 'error'" class="mb-8">
        <div class="bg-red-900/20 p-6 border border-red-700/50 rounded-lg">
          <div class="flex items-start gap-3">
            <svg
              class="flex-shrink-0 mt-0.5 w-6 h-6 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 class="mb-2 font-semibold text-red-400">Ошибка анализа</h3>
              <p class="text-red-300 text-sm leading-relaxed">
                {{ analysisError }}
              </p>
              <button
                @click="loadAnalysis(props.modelValue!)"
                class="bg-red-600 hover:bg-red-700 mt-3 px-4 py-2 rounded text-white text-sm transition-colors"
              >
                Попробовать снова
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Результаты анализа -->
      <div v-if="analysisState === 'success' && analysisData">
        <!-- Секция перевода -->
        <div class="mb-8">
          <h3 class="mb-4 font-semibold text-white text-lg">Перевод</h3>
          <div
            class="bg-slate-800/50 p-4 border border-slate-700/50 rounded-lg"
          >
            <div class="mb-4">
              <div class="flex items-center gap-2 mb-2">
                <span class="font-medium text-green-400 text-sm"
                  >Естественный перевод</span
                >
              </div>
              <p class="text-white leading-relaxed">
                {{
                  analysisData.analysis.translations?.find(
                    (v) => v.style === "natural"
                  )?.text || "Перевод недоступен"
                }}
              </p>
            </div>

            <div class="pt-4 border-slate-700/50 border-t">
              <div class="mb-2 font-medium text-blue-300 text-sm">
                Буквальный перевод
              </div>
              <div class="space-y-2 text-sm">
                <div class="flex items-center gap-2">
                  <span class="text-slate-300">{{
                    analysisData.analysis.translations?.find(
                      (v) => v.style === "literal"
                    )?.text || "Перевод недоступен"
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Секция грамматики -->
        <div class="mb-8">
          <h3 class="mb-4 font-semibold text-white text-lg">Грамматика</h3>
          <div
            class="bg-slate-800/50 p-4 border border-slate-700/50 rounded-lg"
          >
            <div class="mb-4">
              <h4 class="mb-4 font-medium text-yellow-300">
                Грамматические правила:
              </h4>
              <ul class="space-y-2 text-slate-300 text-sm">
                <li
                  v-for="feature in analysisData.analysis.features"
                  :key="feature.rule"
                  class="flex items-center gap-2"
                >
                  <span class="text-yellow-400">•</span>
                  <span
                    ><strong>{{ feature.rule }}:</strong>
                    {{ feature.russian }}</span
                  >
                </li>
              </ul>
            </div>

            <div class="pt-4 border-slate-700/50 border-t">
              <h4 class="mb-2 font-medium text-blue-300">
                Подробное объяснение:
              </h4>
              <p class="text-slate-300 text-sm leading-relaxed">
                {{
                  analysisData.analysis.explanation ||
                  "Объяснение недоступно"
                }}
              </p>
            </div>
          </div>
        </div>

        <!-- Секция сленга -->
        <div class="mb-8">
          <h3 class="mb-4 font-semibold text-white text-lg">Сленг и идиомы</h3>
          <div
            class="bg-slate-800/50 p-4 border border-slate-700/50 rounded-lg"
          >
            <div
              v-if="
                analysisData.analysis.slang &&
                analysisData.analysis.slang.length > 0
              "
              class="space-y-3"
            >
              <div class="flex items-center gap-2 mb-3">
                <svg
                  class="w-5 h-5 text-purple-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="font-medium text-purple-400">Найден сленг</span>
              </div>
              <div class="space-y-2">
                <div
                  v-for="slangItem in analysisData.analysis.slang"
                  :key="slangItem.term"
                  class="bg-slate-700/30 p-3 border border-slate-600/30 rounded"
                >
                  <div class="flex justify-between items-start gap-3">
                    <div class="flex-1">
                      <div class="mb-1 font-medium text-purple-300">
                        "{{ slangItem.term }}"
                      </div>
                      <div class="text-slate-300 text-sm">
                        {{
                          slangItem.ud?.definition || "Определение недоступно"
                        }}
                      </div>
                      <div
                        v-if="slangItem.ud?.example"
                        class="mt-1 text-slate-400 text-xs italic"
                      >
                        Пример: {{ slangItem.ud.example }}
                      </div>
                    </div>
                    <a
                      v-if="slangItem.ud?.permalink"
                      :href="slangItem.ud.permalink"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-purple-400 hover:text-purple-300 text-xs underline"
                    >
                      Urban Dictionary →
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="py-4 text-center">
              <div
                class="flex justify-center items-center bg-slate-700/50 mx-auto mb-3 rounded-full w-12 h-12"
              >
                <svg
                  class="w-6 h-6 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p class="text-slate-400 text-sm">Сленг не обнаружен</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from "vue";
import { useSubtitleStore } from "@/entities/subtitle";
import { subtitlesApi } from "@/shared/api/subtitles";
import type {
  AnalysisState,
  GrammarFeature,
  Difficulty,
  SlangCard,
  AnalyzeResponseData,
} from "@/shared/types";

interface Props {
  modelValue?: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:modelValue": [index: number];
}>();

const subtitleStore = useSubtitleStore();

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

  analysisState.value = "analyzing";
  analysisError.value = "";

  try {
    const context = getSentenceContext(subtitleIndex);
    const response = await subtitlesApi.analyzeSubtitles(
      subtitle.text,
      context,
      seriesName.value,
      currentAbortController.signal
    );

    console.log(response);

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
    // Игнорируем отмененные запросы
    if (error.name === "AbortError") {
      console.log("Analysis request was cancelled");
      return;
    }

    analysisState.value = "error";

    // Специфичная обработка ошибок API
    if (
      error.message?.includes("exceeded your monthly included credits") ||
      error.message?.includes("Inference Providers")
    ) {
      analysisError.value =
        "Закончились токены Hugging Face. Попробуйте в начале следующего месяца или перейдите на PRO план.";
    } else if (
      error.message?.includes("429") ||
      error.message?.includes("Too Many Requests")
    ) {
      analysisError.value =
        "Превышен лимит запросов. Подождите немного и попробуйте снова.";
    } else if (
      error.message?.includes("408") ||
      error.message?.includes("timeout")
    ) {
      analysisError.value =
        "Анализ занял слишком много времени. Попробуйте с более коротким предложением.";
    } else if (
      error.message?.includes("503") ||
      error.message?.includes("Service Unavailable")
    ) {
      analysisError.value =
        "Сервис анализа временно недоступен. Попробуйте позже.";
    } else if (
      error.message?.includes("502") ||
      error.message?.includes("Bad Gateway")
    ) {
      analysisError.value = "Ошибка обработки запроса. Попробуйте еще раз.";
    } else if (
      error.message?.includes("401") ||
      error.message?.includes("Unauthorized")
    ) {
      analysisError.value =
        "Ошибка аутентификации API. Проверьте настройки сервера.";
    } else {
      analysisError.value =
        error instanceof Error ? error.message : "Неизвестная ошибка анализа";
    }

    console.error("Analysis error:", error);
  }
};

/**
 * Форматирует время субтитра, показывая только минуты и секунды
 * @param timeString - строка времени в формате HH:MM:SS.mmm
 * @returns отформатированное время (MM:SS)
 */
// Время не отображаем — будет кастомный скроллбар позже

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
