<template>
  <div
    class="relative flex flex-col justify-center items-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 min-h-screen overflow-hidden text-center"
  >
    <!-- Фоновое свечение -->
    <div
      class="top-0 left-1/2 absolute bg-gradient-radial from-blue-500/20 via-purple-500/10 to-transparent opacity-70 blur-3xl rounded-full w-96 h-96 -translate-x-1/2 -translate-y-1/2 transform"
    ></div>

    <!-- Главный заголовок SubtleGram -->
    <header class="z-10 mb-16">
      <h1
        class="bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 mb-4 font-bold text-transparent text-6xl md:text-7xl lg:text-8xl glowing-text"
      >
        SubtleGram
      </h1>
      <p
        class="mx-auto max-w-2xl text-slate-300 text-xl md:text-2xl leading-relaxed"
      >
        Интерактивный анализ субтитров
      </p>
    </header>

    <!-- Основной блок -->
    <main class="z-10 w-full max-w-4xl">
      <div
        class="bg-slate-800/50 shadow-2xl backdrop-blur-sm p-8 md:p-12 border border-slate-700/50 rounded-3xl"
      >
        <!-- Заголовок -->
        <h2
          class="mb-6 font-semibold text-white text-3xl md:text-4xl lg:text-5xl leading-tight"
        >
          Перетащите субтитры и начните анализ в одно касание
        </h2>

        <!-- Описание -->
        <p
          class="mx-auto mb-12 max-w-2xl text-slate-300 text-lg leading-relaxed"
        >
          Поддерживаем форматы SRT, VTT и TXT до 10MB. Мы проверим файл,
          разобьём субтитры и подготовим их к анализу.
        </p>

        <!-- Зона загрузки -->
        <div class="mb-8">
          <h3
            class="mb-6 font-medium text-slate-400 text-sm uppercase tracking-wider"
          >
            Загрузка субтитров
          </h3>

          <!-- Drag & Drop зона -->
          <div
            class="group relative"
            @dragenter.prevent="handleDragEnter"
            @dragover.prevent="handleDragOver"
            @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleDrop"
          >
            <!-- Текстовый контент (статичный) -->
            <div class="z-20 relative p-8 md:p-12 text-center">
              <!-- Иконка -->
              <div class="mx-auto mb-6 w-16 h-16 text-blue-400">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  />
                </svg>
              </div>

              <!-- Динамический контент в зависимости от состояния -->
              <template v-if="isUploading">
                <div class="inline-flex items-center gap-2 mb-2 text-blue-300">
                  <div
                    class="border-2 border-t-transparent border-blue-400 rounded-full w-5 h-5 animate-spin"
                  ></div>
                  <span class="font-medium text-sm"> Загружаем файл… </span>
                </div>
                <p class="text-slate-400 text-sm">
                  Пожалуйста, подождите, файл обрабатывается
                </p>
              </template>

              <template v-else-if="hasSubtitles">
                <div class="mb-6">
                  <div
                    class="inline-flex items-center gap-2 bg-green-500/20 mb-4 px-4 py-2 rounded-full font-medium text-green-300 text-sm"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 0116 0zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    Файл загружен успешно
                  </div>
                  <p class="mb-2 font-semibold text-white text-xl">
                    {{ filename }}
                  </p>
                  <p class="mb-4 text-slate-300">
                    {{ subtitles.length }} субтитров найдено
                  </p>

                  <div class="flex flex-col gap-3">
                    <button
                      @click="goToWorkspace"
                      class="bg-gradient-to-r from-blue-500 hover:from-blue-600 to-purple-600 hover:to-purple-700 shadow-lg hover:shadow-blue-500/25 px-6 py-3 rounded-lg font-semibold text-white transition-all"
                    >
                      Начать анализ →
                    </button>

                    <button
                      @click="loadAnotherFile"
                      class="bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg font-semibold text-slate-300 hover:text-white transition-all duration-75"
                    >
                      <p>Отменить загрузку</p>
                    </button>
                  </div>
                </div>
              </template>

              <template v-else>
                <!-- Обычное состояние загрузки -->
                <div class="mb-6">
                  <p class="mb-2 font-semibold text-white text-2xl">
                    {{ dropZoneText }}
                  </p>
                  <p
                    class="mb-4 text-slate-400 text-sm uppercase tracking-wider"
                  >
                    или
                  </p>

                  <label
                    class="bg-gradient-to-r from-blue-500 hover:from-blue-600 to-purple-600 hover:to-purple-700 shadow-lg hover:shadow-blue-500/25 px-6 py-3 rounded-lg font-semibold text-white transition-all cursor-pointer"
                  >
                    <input
                      ref="fileInput"
                      type="file"
                      accept=".srt,.vtt,.txt"
                      class="hidden"
                      @change="handleFileInput"
                    />
                    Выберите файл
                  </label>

                  <p class="mt-4 text-slate-500 text-sm">
                    SRT • VTT • TXT • до 10MB
                  </p>
                </div>
              </template>
            </div>

            <!-- Масштабируемая подложка поверх контента -->
            <div
              :class="[
                'z-10 absolute inset-0 bg-slate-700/30 border-2 border-blue-400/50 border-dashed rounded-2xl origin-center transition-all duration-75',
                isDragOver ? 'bg-slate-700/50 border-blue-400 scale-105' : '',
              ]"
            >
              <!-- Свечение только при drag over (не при hover) -->
              <div
                :class="[
                  'absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl transition-opacity duration-75',
                  isDragOver ? 'opacity-100' : 'opacity-0',
                ]"
              ></div>
            </div>
          </div>
        </div>

        <!-- Ошибки -->
        <div v-if="error" class="mb-8 text-center">
          <div
            class="inline-flex items-center gap-2 bg-red-500/20 mb-2 px-4 py-2 rounded-full font-medium text-red-300 text-sm"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            Ошибка загрузки
          </div>
          <p class="mb-4 text-red-300">{{ error }}</p>
          <button
            v-if="uploadedFile"
            @click="retry"
            class="bg-red-500/20 hover:bg-red-500/30 px-4 py-2 border border-red-400/50 rounded-lg text-red-300 transition-all duration-75"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useFileUpload } from "@/features/file-upload";

const {
  uploadedFile,
  subtitles,
  filename,
  error,
  isDragOver,
  isUploading,
  hasSubtitles,
  handleDragEnter,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFileSelect,
  reset,
  retry,
} = useFileUpload();

const fileInput = ref<HTMLInputElement>();

const handleFileInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    handleFileSelect(file);
  }
};

const goToWorkspace = async () => {
  await navigateTo("/workspace");
};

const loadAnotherFile = () => {
  reset();

  if (fileInput.value) {
    fileInput.value.value = "";
  }
};

const dropZoneText = computed(() =>
  isDragOver.value ? "Отпустите файл здесь" : "Перетащите файл сюда"
);
</script>

<style scoped>
/*стили для переливающегося эффекта заголовка */
.glowing-text {
  background: linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradientShift 4s ease-in-out infinite;
}

@keyframes gradientShift {
  0%,
  100% {
    background-position: 35% 50%;
  }
  50% {
    background-position: 100% 5%;
  }
}

.bg-gradient-radial {
  background: radial-gradient(circle, var(--tw-gradient-stops));
}
</style>
