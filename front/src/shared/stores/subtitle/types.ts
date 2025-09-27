export interface SubtitleFile {
  id: number
  start: string
  end: string
  text: string
}

export interface SubtitleState {
  subtitles: SubtitleFile[]
  filename: string
  currentIndex: number
  searchQuery: string
}
