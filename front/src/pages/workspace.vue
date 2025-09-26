<template>
  <div class="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen text-white workspace">
    <!-- Если нет данных, показываем заглушку -->
    <div v-if="!hasData" class="flex justify-center items-center h-screen">
      <div class="text-center">
        <div class="flex justify-center items-center bg-slate-700/50 mx-auto mb-6 rounded-full w-24 h-24">
          <svg class="w-12 h-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <h2 class="mb-2 font-semibold text-white text-xl">Сначала загрузите файл</h2>
        <p class="mb-6 text-slate-400">Перейдите на главную страницу и загрузите файл субтитров</p>
        <button
          @click="goToMainPage"
          class="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg font-medium text-white transition-colors duration-200"
        >
          Перейти к загрузке
        </button>
      </div>
    </div>

    <!-- Основное рабочее пространство -->
    <div v-else class="flex flex-col h-screen">
      <!-- Workspace Header -->
      <WorkspaceHeader @search="handleSearch" />

      <!-- Основное содержимое -->
      <div class="flex flex-1 overflow-hidden workspace-content">
        <!-- Левая колонка - Timeline субтитров -->
        <div class="flex flex-col bg-slate-800/50 border-slate-700/50 border-r w-80">
          <SubtitleTimeline
            v-model="selectedSubtitleIndex"
            :search-query="searchQuery"
            :filtered-subtitles="filteredSubtitles"
          />
        </div>

        <!-- Правая колонка - Детальный анализ -->
        <div class="flex-1 bg-slate-900 overflow-hidden">
          <AnalysisPanel v-model="selectedSubtitleIndex" />
        </div>
      </div>

      <!-- Footer с навигацией -->
      <WorkspaceFooter
        v-model="selectedSubtitleIndex"
        :filtered-subtitles="filteredSubtitles"
        :search-query="searchQuery"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFileUpload } from '@/features/file-upload'
import { WorkspaceHeader, SubtitleTimeline, AnalysisPanel, WorkspaceFooter } from '@/widgets'

// Получаем данные из composable загрузки
const {
  subtitles,
  filename,
  hasSubtitles,
  error,
  uploadState
} = useFileUpload()

// Локальное состояние для выбранного субтитра и поиска
const selectedSubtitleIndex = ref<number>(0)
const searchQuery = ref<string>('')
const selectedSubtitle = computed(() =>
  subtitles.value[selectedSubtitleIndex.value] || null
)

// Отфильтрованные субтитры для правильной работы поиска
const filteredSubtitles = computed(() => {
  if (!searchQuery.value) return subtitles.value

  const query = searchQuery.value.toLowerCase()
  return subtitles.value.filter(subtitle =>
    subtitle.text.toLowerCase().includes(query)
  )
})

// Проверка - есть ли данные для отображения
const hasData = computed(() => hasSubtitles.value && subtitles.value.length > 0)

// Методы
const goToMainPage = () => {
  window.location.href = '/'
}

const handleSearch = (query: string) => {
  searchQuery.value = query
}
</script>

<style scoped>
/* Workspace стили */
.workspace {
  min-height: 100vh;
}

.workspace-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>
