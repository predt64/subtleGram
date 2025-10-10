import { ref, computed, watch } from "vue";
import { useSubtitleStore } from "@/entities/subtitle";

/**
 * Composable для поиска по субтитрам
 * Управляет поисковым запросом, подсветкой и debounce
 */
export function useSubtitleSearch() {
  const subtitleStore = useSubtitleStore();

  /**
   * Локальная копия поискового запроса для двусторонней синхронизации с store
   */
  const searchQuery = ref(subtitleStore.searchQuery);

  /**
   * Флаг активного поиска - определяет нужно ли показывать метки на скроллбаре
   */
  const hasActiveSearch = computed(() => !!subtitleStore.searchQuery.trim());

  /**
   * Таймер для debounce поиска
   */
  let searchTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Подсвечивает поисковые термины в тексте субтитра
   * @param text - исходный текст субтитра
   * @param query - поисковый запрос
   * @returns HTML строка с подсвеченными терминами
   */
  const highlightSearchTerms = (text: string, query: string): string => {
    if (!query) return text;

    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    return text.replace(
      regex,
      '<mark class="bg-yellow-400 px-1 rounded text-slate-900">$1</mark>'
    );
  };

  /**
   * Очищает поисковый запрос
   */
  const clearSearch = (): void => {
    searchQuery.value = "";
  };

  /**
   * Настраивает watcher для синхронизации поискового запроса с store
   */
  const setupSearchWatcher = (): void => {
    watch(searchQuery, (newQuery) => {
      if (searchTimeout) clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const trimmedQuery = newQuery.trim();
        if (subtitleStore.searchQuery !== trimmedQuery) {
          subtitleStore.setSearchQuery(trimmedQuery);
        }
      }, 300);
    });

    // Синхронизация с store
    watch(
      () => subtitleStore.searchQuery,
      (newQuery) => {
        if (searchQuery.value !== newQuery) {
          searchQuery.value = newQuery;
        }
      }
    );
  };

  /**
   * Очищает таймер поиска при размонтировании
   */
  const cleanup = (): void => {
    if (searchTimeout) clearTimeout(searchTimeout);
  };

  return {
    searchQuery,
    hasActiveSearch,
    highlightSearchTerms,
    clearSearch,
    setupSearchWatcher,
    cleanup
  };
}
