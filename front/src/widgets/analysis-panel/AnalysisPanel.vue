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
            class="bg-blue-500/20 px-3 py-1 rounded-full font-medium text-blue-300 text-sm"
          >
            B1
          </div>
        </div>

        <div class="bg-slate-800/50 p-4 border border-slate-700/50 rounded-lg">
          <p class="text-white text-lg leading-relaxed">
            {{ selectedSubtitle.text }}
          </p>
          <div class="flex items-center gap-2 mt-3 text-slate-400 text-sm">
            <span>{{ formatTime(selectedSubtitle.start) }}</span>
            <span>→</span>
            <span>{{ formatTime(selectedSubtitle.end) }}</span>
          </div>
        </div>
      </div>

      <!-- Секция перевода -->
      <div class="mb-8">
        <h3 class="mb-4 font-semibold text-white text-lg">Перевод</h3>
        <div class="bg-slate-800/50 p-4 border border-slate-700/50 rounded-lg">
          <div class="mb-4">
            <div class="flex items-center gap-2 mb-2">
              <span class="font-medium text-green-400 text-sm"
                >Естественный перевод</span
              >
              <div
                class="bg-green-500/20 px-2 py-1 rounded text-green-300 text-xs"
              >
                85%
              </div>
            </div>
            <p class="text-white leading-relaxed">
              Мне нужно идти домой прямо сейчас.
            </p>
          </div>

          <div class="pt-4 border-slate-700/50 border-t">
            <div class="mb-2 font-medium text-blue-300 text-sm">
              Варианты стилей:
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex items-center gap-2">
                <span class="text-slate-400">Формальный:</span>
                <span class="text-slate-300"
                  >Мне необходимо отправиться домой в данный момент.</span
                >
              </div>
              <div class="flex items-center gap-2">
                <span class="text-slate-400">Разговорный:</span>
                <span class="text-slate-300">Мне пора домой уже.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Секция грамматики -->
      <div class="mb-8">
        <h3 class="mb-4 font-semibold text-white text-lg">Грамматика</h3>
        <div class="bg-slate-800/50 p-4 border border-slate-700/50 rounded-lg">
          <div class="mb-4">
            <h4 class="mb-2 font-medium text-yellow-300">
              Ключевые особенности:
            </h4>
            <ul class="space-y-2 text-slate-300 text-sm">
              <li class="flex items-start gap-2">
                <span class="mt-1 text-yellow-400">•</span>
                <span
                  ><strong>Время:</strong> Present Simple в значении
                  будущего</span
                >
              </li>
              <li class="flex items-start gap-2">
                <span class="mt-1 text-yellow-400">•</span>
                <span
                  ><strong>Модальность:</strong> Выражение необходимости (have
                  to)</span
                >
              </li>
            </ul>
          </div>

          <div class="pt-4 border-slate-700/50 border-t">
            <h4 class="mb-2 font-medium text-blue-300">
              Подробное объяснение:
            </h4>
            <p class="text-slate-300 text-sm leading-relaxed">
              Предложение выражает необходимость немедленного действия. "Gotta"
              - это разговорная форма "have got to", которая часто используется
              в американском английском для выражения обязательств или
              необходимости.
            </p>
          </div>
        </div>
      </div>

      <!-- Секция сленга -->
      <div class="mb-8">
        <h3 class="mb-4 font-semibold text-white text-lg">Сленг и идиомы</h3>
        <div class="bg-slate-800/50 p-4 border border-slate-700/50 rounded-lg">
          <div class="py-4 text-center">
            <div
              class="flex justify-center items-center bg-purple-500/20 mx-auto mb-3 rounded-full w-12 h-12"
            >
              <svg
                class="w-6 h-6 text-purple-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <p class="text-slate-400 text-sm">Сленг не обнаружен</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useSubtitleStore } from "@/shared/stores/subtitle"

// Props
interface Props {
  modelValue?: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:modelValue": [index: number];
}>();

// Данные из store
const subtitleStore = useSubtitleStore();

// Вычисляемые свойства
const selectedSubtitle = computed(() =>
  props.modelValue !== undefined ? subtitleStore.subtitles[props.modelValue] : null
);

// Методы
const formatTime = (timeString: string): string => {
  const parts = timeString.split(":");
  if (parts.length >= 2) {
    return `${parts[1]}:${parts[2]}`;
  }
  return timeString;
};

// Следим за изменениями в modelValue
watch(
  () => props.modelValue,
  (newIndex) => {
    if (newIndex !== undefined) {
      console.log("Анализ субтитра:", subtitleStore.subtitles[newIndex]);
      // TODO: Запустить анализ выбранного субтитра
    }
  }
);
</script>

<style scoped>
/* Analysis Panel стили */
.analysis-panel {
  height: 100%;
  overflow-y: auto;
}
</style>
