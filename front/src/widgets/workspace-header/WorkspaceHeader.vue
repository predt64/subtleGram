<template>
  <header
    class="relative flex justify-between items-center bg-slate-800/80 backdrop-blur-sm px-6 border-slate-700/50 border-b h-20 overflow-hidden workspace-header"
  >
    <!-- Анимированные частицы по всей шапке -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <!-- Частицы разных размеров -->
      <div class="particle particle-1"></div>
      <div class="particle particle-2"></div>
      <div class="particle particle-3"></div>
      <div class="particle particle-4"></div>
      <div class="particle particle-5"></div>
      <div class="particle particle-6"></div>
      <div class="particle particle-7"></div>
      <div class="particle particle-8"></div>
    </div>
    <!-- Контент шапки поверх частиц -->
    <div class="z-10 relative flex justify-between items-center w-full">
      <!-- Левая часть - логотип и навигация -->
      <div class="flex items-center gap-4">
        <button
          @click="goBack"
          class="flex items-center gap-2 text-slate-400 hover:text-white transition-colors duration-200"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span class="font-medium text-sm">Назад</span>
        </button>

        <div class="bg-slate-700 w-px h-6"></div>

        <div class="flex items-center gap-3">
          <div
            class="flex justify-center items-center bg-blue-500 rounded-lg w-8 h-8"
          >
            <svg
              class="w-4 h-4 text-white"
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
          <div>
            <h1 class="font-semibold text-white text-lg">SubtleGram</h1>
            <p class="text-slate-400 text-xs">Анализ субтитров</p>
          </div>
        </div>
      </div>

      <!-- Правая часть - Статус и информация о файле -->
      <div class="flex items-center gap-4">
        <!-- Статус сервиса -->
        <div class="flex items-center gap-2">
          <div :class="['w-2 h-2 rounded-full', apiStatus.colorClass]"></div>
          <span class="text-slate-300 text-sm">
            {{ apiStatus.text }}
          </span>
        </div>

        <div class="bg-slate-700 w-px h-6"></div>

        <!-- Информация о файле -->
        <div class="text-right">
          <p class="font-medium text-white text-sm">{{ fileInfo.name }}</p>
          <p class="text-slate-400 text-xs">
            {{ fileInfo.subtitleText }}
          </p>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useSubtitleStore } from "@/entities/subtitle";
import { subtitleApi } from "@/shared/api/subtitleApi";

const subtitleStore = useSubtitleStore();

const isApiAvailable = ref(false);

/**
 * Статус API в виде объекта
 */
const apiStatus = computed(() => ({
  available: isApiAvailable.value,
  text: isApiAvailable.value ? "Сервис доступен" : "Сервис недоступен",
  colorClass: isApiAvailable.value ? "bg-green-400" : "bg-red-400",
}));

/**
 * Информация о файле с форматированным текстом количества предложений
 */
const fileInfo = computed(() => {
  const count = subtitleStore.sentenceCards.length;
  const subtitleText =
    count === 1
      ? "1 предложение"
      : count < 5
        ? `${count} предложения`
        : `${count} предложений`;

  return {
    name: subtitleStore.filename || "Файл не загружен",
    subtitleText,
  };
});

const goBack = async () => {
  await navigateTo("/");
};

onMounted(async () => {
  try {
    await subtitleApi.checkHealth();
    isApiAvailable.value = true;
  } catch (error) {
    console.warn("Проверка здоровья API не удалась:", error);
    isApiAvailable.value = false;
  }
});
</script>

<style scoped>
.workspace-header {
  position: sticky;
  top: 0;
  z-index: 50;
}

/* Анимированные частицы */
.particle {
  position: absolute;
  background: radial-gradient(
    circle,
    rgba(59, 130, 246, 0.6) 0%,
    rgba(147, 51, 234, 0.4) 100%
  );
  border-radius: 50%;
  opacity: 0;
  animation: float-particle 20s ease-in-out infinite;
}

/* Разные размеры частиц */
.particle-1 {
  width: 3px;
  height: 3px;
  animation-delay: 0s;
}
.particle-2 {
  width: 2px;
  height: 2px;
  animation-delay: 2s;
}
.particle-3 {
  width: 4px;
  height: 4px;
  animation-delay: 4s;
}
.particle-4 {
  width: 2px;
  height: 2px;
  animation-delay: 6s;
}
.particle-5 {
  width: 3px;
  height: 3px;
  animation-delay: 8s;
}
.particle-6 {
  width: 2px;
  height: 2px;
  animation-delay: 10s;
}
.particle-7 {
  width: 4px;
  height: 4px;
  animation-delay: 12s;
}
.particle-8 {
  width: 3px;
  height: 3px;
  animation-delay: 14s;
}

/* Разные траектории движения */
.particle-1 {
  left: 10%;
  top: 20%;
  animation-duration: 18s;
}
.particle-2 {
  left: 30%;
  top: 60%;
  animation-duration: 22s;
}
.particle-3 {
  left: 50%;
  top: 30%;
  animation-duration: 16s;
}
.particle-4 {
  left: 70%;
  top: 70%;
  animation-duration: 24s;
}
.particle-5 {
  left: 20%;
  top: 40%;
  animation-duration: 20s;
}
.particle-6 {
  left: 80%;
  top: 50%;
  animation-duration: 26s;
}
.particle-7 {
  left: 40%;
  top: 10%;
  animation-duration: 19s;
}
.particle-8 {
  left: 60%;
  top: 80%;
  animation-duration: 23s;
}

@keyframes float-particle {
  0% {
    transform: translate(0, 0) scale(0.8);
    opacity: 0;
  }
  10% {
    opacity: 0.7;
  }
  50% {
    transform: translate(50px, -30px) scale(1.2);
    opacity: 0.9;
  }
  90% {
    opacity: 0.7;
  }
  100% {
    transform: translate(100px, -60px) scale(0.8);
    opacity: 0;
  }
}
</style>
