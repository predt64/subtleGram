<template>
  <div class="bg-slate-800/50 p-4 border border-slate-700/50 rounded-lg">
    <div class="mb-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="font-medium text-green-400 text-sm">Естественный перевод</span>
      </div>
      <p class="text-white leading-relaxed">
        {{ natural || "Перевод недоступен" }}
      </p>
    </div>

    <div class="pt-4 border-slate-700/50 border-t">
      <div class="mb-2 font-medium text-blue-300 text-sm">
        Буквальный перевод
      </div>
      <div class="space-y-2 text-sm">
        <div class="flex items-center gap-2">
          <span class="text-slate-300">{{ literal || "Перевод недоступен" }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  natural?: string;
  literal?: string;
}

defineProps<Props>();
</script>
