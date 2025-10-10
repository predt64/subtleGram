<template>
  <div class="bg-slate-800/50 p-4 border border-slate-700/50 rounded-lg">
    <div class="mb-4">
      <h4 class="mb-4 font-medium text-yellow-300">
        Грамматические правила:
      </h4>
      <ul class="space-y-2 text-slate-300 text-sm">
        <li
          v-for="feature in features"
          :key="feature.rule"
          class="flex items-center gap-2"
        >
          <span class="text-yellow-400">•</span>
          <span><strong>{{ feature.rule }}:</strong> {{ feature.russian }}</span>
        </li>
      </ul>
    </div>

    <div class="pt-4 border-slate-700/50 border-t">
      <h4 class="mb-2 font-medium text-blue-300">
        Подробное объяснение:
      </h4>
      <p class="text-slate-300 text-sm leading-relaxed">
        {{ explanation || "Объяснение недоступно" }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GrammarFeature } from "@/shared/types";

interface Props {
  features: GrammarFeature[];
  explanation?: string;
}

defineProps<Props>();
</script>
