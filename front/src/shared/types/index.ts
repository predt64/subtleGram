export interface SubtitleFile {
  id: number
  start: string
  end: string
  text: string
}

export interface ApiResponse<T = any> {
  success?: boolean
  message: string
  data?: T
  error?: string
  details?: any
  warnings?: string[]
}

export interface UploadResponseData {
  filename: string
  subtitlesCount: number
  subtitles: SubtitleFile[]
}

export interface UploadError {
  error: string
  message: string
  details?: any
}

export type UploadState = 'idle' | 'uploading' | 'success' | 'error'
