export type UploadState = 'idle' | 'uploading' | 'success' | 'error'

export interface UploadStateData {
  uploadState: UploadState
  uploadedFile: File | null
  error: string | null
  isDragOver: boolean
}
