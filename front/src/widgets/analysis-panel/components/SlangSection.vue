<template>
  <div class="bg-slate-800/50 p-4 border border-slate-700/50 rounded-lg">
    <div v-if="slang && slang.length > 0" class="space-y-3">
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
          v-for="slangItem in slang"
          :key="slangItem.term"
          class="bg-slate-700/30 p-3 border border-slate-600/30 rounded"
        >
          <div class="flex justify-between items-start gap-3">
            <div class="flex-1">
              <div class="mb-1 font-medium text-purple-300">
                "{{ slangItem.term }}"
              </div>
              <div class="text-slate-300 text-sm">
                {{ slangItem.ud?.definition || "Определение недоступно" }}
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
      <div class="flex justify-center items-center bg-slate-700/50 mx-auto mb-3 rounded-full w-12 h-12">
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
</template>

<script setup lang="ts">
import type { SlangCard } from "@/shared/types";

interface Props {
  slang?: SlangCard[];
}

defineProps<Props>();
</script>
