import { split as sentenceSplit } from 'sentence-splitter'
import type { SubtitleFile } from '@/shared/types'

function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, '')
}

/**
 * УТИЛИТА НОРМАЛИЗАЦИИ СУБТИТРОВ ДО ПРЕДЛОЖЕНИЙ
 * ------------------------------------------------
 * Идея:
 * 1) Склеиваем все тексты субтитров в одно целое
 * 2) Прогоняем через sentence-splitter, получаем диапазоны предложений
 * 3) Применяем простые эвристики для склейки: многоточия, инициал/аббревиатуры, диалоги с «-», длинные без пунктуации
 * 4) Сопоставляем каждое предложение с исходными блоками и собираем карточки предложений
 *
 */

/**
 * Карта покрытия куска исходного субтитра внутри итоговой карточки предложения
 */
export interface SentenceSpan {
  /** ID исходного субтитра (raw) */
  rawId: number
  /** Глобальный диапазон внутри склеенной строки */
  absStartChar: number
  absEndChar: number
}

/**
 * Карточка предложения для UI
 * В будущем пригодится для кастомного скроллбара (start/end по исходным временам)
 */
export interface SentenceCard {
  id: number
  text: string
  start: string
  end: string
  /** ID исходных субтитров, из которых собрано предложение */
  sourceIds: number[]
  /** Маппинг частей на исходные куски (для точной визуализации в будущем) */
  spans: SentenceSpan[]
}

/**
 * Опции нормализации
 */
export interface NormalizeOptions {
  /**
   * Максимальное количество слов в «предложении без терминатора».
   * Если превышено и нет .?!… на конце — деградация: не делим, используем исходные куски.
   */
  maxWordsWithoutPunct?: number
  /** Сшивать ли предложения, разделённые многоточием на границе */
  mergeEllipsis?: boolean
  /** Сшивать ли строки диалога, начинающиеся с '-' до терминатора */
  mergeLeadingDashDialogs?: boolean
  /** Белый список аббревиатур для простого объединения рядом стоящих предложений */
  abbreviations?: string[]
}

/**
 * Значения по умолчанию для опций
 */
const DEFAULT_OPTIONS: Required<NormalizeOptions> = {
  maxWordsWithoutPunct: 40,
  mergeEllipsis: true,
  mergeLeadingDashDialogs: true,
  abbreviations: [
    // Английские распространённые аббревиатуры
    'Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.', 'Sr.', 'Jr.', 'St.', 'vs.', 'etc.', 'e.g.', 'i.e.',
    'U.S.', 'U.K.', 'U.N.', 'p.m.', 'a.m.'
  ]
}

/**
 * Вспомогательный тип: кусок исходного субтитра в склеенной строке
 */
interface ConcatChunk {
  raw: SubtitleFile
  startChar: number
  endChar: number
  text: string
}

/**
 * Нормализует массив исходных субтитров до массива «карточек предложений»
 * @param raws - исходные субтитры (как пришли с сервера)
 * @param options - опции нормализации
 */
export function normalizeToSentences(
  raws: SubtitleFile[],
  options: NormalizeOptions = {}
): SentenceCard[] {
  const opts: Required<NormalizeOptions> = { ...DEFAULT_OPTIONS, ...options }

  // Пустой вход → пустой результат
  if (!Array.isArray(raws) || raws.length === 0) return []

  // 1) Склейка предложений
  const { concatenated, chunks } = buildConcatenatedText(raws)

  // 2) Базовая сегментация на предложения
  const baseNodes = sentenceSplit(concatenated)
  const baseSentences = baseNodes
    .filter(el => el.type === 'Sentence' && Array.isArray((el as any).range) && (el as any).range.length >= 2)
    .map(el => {
      const range = (el as any).range as [number, number]
      return { start: range[0], end: range[1], text: concatenated.slice(range[0], range[1]) }
    })

  // 3) Эвристики пост-обработки: аббревиатуры/инициалы, многоточия, диалоги
  const mergedSentences = applyHeuristics(baseSentences, opts)

  // 4) Преобразуем предложения в карточки с маппингом на исходные куски
  const cards: SentenceCard[] = []
  let nextId = 1

  for (const s of mergedSentences) {
    const sentenceText = s.text.trim()
    if (!sentenceText) continue

    const hasTerminal = /[.!?…]$/.test(sentenceText.trim())
    const wordCount = sentenceText.split(/\s+/).filter(Boolean).length

    // Деградация: слишком длинный фрагмент без терминатора → используем исходные куски
    if (!hasTerminal && wordCount > opts.maxWordsWithoutPunct) {
      const overlappedChunks = findOverlappedChunks(chunks, s.start, s.end)
      for (const ch of overlappedChunks) {
        const textSlice = sliceByOverlap(concatenated, ch.startChar, ch.endChar, s.start, s.end).trim()
        if (!textSlice) continue
        cards.push({
          id: nextId++,
          text: textSlice,
          start: ch.raw.start,
          end: ch.raw.end,
          sourceIds: [ch.raw.id],
          spans: [{ rawId: ch.raw.id, absStartChar: Math.max(s.start, ch.startChar), absEndChar: Math.min(s.end, ch.endChar) }]
        })
      }
      continue
    }

    // Обычный случай: сопоставляем с кусками
    const overlapped = findOverlappedChunks(chunks, s.start, s.end)
    if (overlapped.length === 0) continue

    const first = overlapped[0]!
    const last = overlapped[overlapped.length - 1]!

    const textCombined = overlapped
      .map(ch => sliceByOverlap(concatenated, ch.startChar, ch.endChar, s.start, s.end))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    const spans: SentenceSpan[] = overlapped.map(ch => ({
      rawId: ch.raw.id,
      absStartChar: Math.max(s.start, ch.startChar),
      absEndChar: Math.min(s.end, ch.endChar)
    }))

    const sourceIds = Array.from(new Set(overlapped.map(c => c.raw.id)))

    cards.push({
      id: nextId++,
      text: textCombined,
      start: first.raw.start,
      end: last.raw.end,
      sourceIds,
      spans
    })
  }

  return cards
}

/**
 * Строит склеенную строку и массив кусков с оффсетами
 * Важно: нормализуем пробелы, чтобы избежать ложных стыков без пробела
 */
function buildConcatenatedText(raws: SubtitleFile[]): { concatenated: string; chunks: ConcatChunk[] } {
  let concatenated = ''
  const chunks: ConcatChunk[] = []

  for (let i = 0; i < raws.length; i++) {
    const raw = raws[i]!
    const normalized = stripHtmlTags(String(raw.text ?? '')).replace(/\s+/g, ' ').trim()

    const startChar = concatenated.length
    concatenated += normalized
    const endChar = concatenated.length

    chunks.push({ raw, startChar, endChar, text: normalized })

    // Добавляем одиночный пробел как разделитель между блоками (чтобы склейка не ломала слова)
    if (i < raws.length - 1) {
      concatenated += ' '
    }
  }

  return { concatenated, chunks }
}

/**
 * Находит куски, перекрывающиеся с диапазоном предложения
 */
function findOverlappedChunks(chunks: ConcatChunk[], start: number, end: number): ConcatChunk[] {
  return chunks.filter(ch => !(ch.endChar <= start || ch.startChar >= end))
}

/**
 * Возвращает срез строки по перекрытию диапазонов [chunkStart, chunkEnd) и [sentStart, sentEnd)
 */
function sliceByOverlap(
  concatenated: string,
  chunkStart: number,
  chunkEnd: number,
  sentStart: number,
  sentEnd: number
): string {
  const from = Math.max(chunkStart, sentStart)
  const to = Math.min(chunkEnd, sentEnd)
  if (from >= to) return ''
  return concatenated.slice(from, to)
}

/**
 * Применяет эвристики склейки/разделения поверх базовой сегментации
 */
function applyHeuristics(
  base: { start: number; end: number; text: string }[],
  opts: Required<NormalizeOptions>
): { start: number; end: number; text: string }[] {
  if (base.length === 0) return []

  // 1) Склейка коротких «инициалов/аббревиатур» с последующим предложением
  const mergedAbbr: { start: number; end: number; text: string }[] = []
  for (let i = 0; i < base.length; i++) {
    const current = base[i]
    if (!current) continue
    // Если текущее очень короткое и похоже на инициал/аббревиатуру → слить со следующим
    if (i + 1 < base.length && isLikelyAbbreviation(current.text, opts)) {
      const next = base[i + 1]
      if (next) {
        mergedAbbr.push({
          start: current.start,
          end: next.end,
          text: (current.text + ' ' + next.text).replace(/\s+/g, ' ').trim()
        })
        i += 1
        continue
      }
    }
    mergedAbbr.push(current)
  }

  let sentences = mergedAbbr

  // 2) Склейка по многоточию на границе
  if (opts.mergeEllipsis) {
    const tmp: { start: number; end: number; text: string }[] = []
    for (let i = 0; i < sentences.length; i++) {
      const first = sentences[i]
      if (!first) continue
      let cur = { ...first }
      while (i + 1 < sentences.length) {
        const next = sentences[i + 1]
        if (!next) break
        const curEndsWithEllipsis = /\.\.\.$/.test(cur.text.trim())
        const nextStartsWithEllipsis = /^\.{3}/.test(next.text.trim())
        if (!(curEndsWithEllipsis && nextStartsWithEllipsis)) break
        cur = {
          start: cur.start,
          end: next.end,
          text: (cur.text + ' ' + next.text).replace(/\s+/g, ' ').trim()
        }
        i += 1
      }
      tmp.push(cur)
    }
    sentences = tmp
  }

  // 3) Диалоги с «-» (сливать до появления терминатора .?!…)
  if (opts.mergeLeadingDashDialogs) {
    const tmp: { start: number; end: number; text: string }[] = []
    for (let i = 0; i < sentences.length; i++) {
      const first = sentences[i]
      if (!first) continue
      let cur = { ...first }
      const startsWithDash = /^\s*-\s*/.test(cur.text)
      if (startsWithDash && !/[.!?…]$/.test(cur.text.trim())) {
        while (i + 1 < sentences.length && !/[.!?…]$/.test(cur.text.trim())) {
          const next = sentences[i + 1]
          if (!next) break
          cur = {
            start: cur.start,
            end: next.end,
            text: (cur.text + ' ' + next.text).replace(/\s+/g, ' ').trim()
          }
          i += 1
        }
      }
      tmp.push(cur)
    }
    sentences = tmp
  }

  return sentences
}

/**
 * Эвристика: похоже ли «предложение» на инициал/аббревиатуру, требующую склейки с следующим
 * Примеры: "A.", "Dr.", "U.S." и т.п.
 */
function isLikelyAbbreviation(text: string, opts: Required<NormalizeOptions>): boolean {
  const t = text.trim()
  if (!t) return false

  // Одна буква с точкой → почти наверняка инициал ("A.")
  if (/^[A-Za-zА-Яа-я]\.$/.test(t)) return true

  // Совпадение со списком известных аббревиатур
  if (opts.abbreviations.includes(t)) return true

  // Слова длиной 1–2 и завершающиеся точкой ("St.") → вероятная аббревиатура
  if (/^[A-Za-zА-Яа-я]{1,2}\.$/.test(t)) return true

  return false
}

