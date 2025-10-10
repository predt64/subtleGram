<template>
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
          {{ errorMessage }}
        </p>
        <button
          @click="$emit('retry')"
          class="bg-red-600 hover:bg-red-700 mt-3 px-4 py-2 rounded text-white text-sm transition-colors"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  errorMessage: string;
}

defineProps<Props>();
defineEmits<{
  retry: [];
}>();
</script>
