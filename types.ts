
export type MediaType = 'image' | 'video' | 'audio';

export interface MediaFile {
  id: string;
  file: File;
  previewUrl: string;
  type: MediaType;
  status: 'idle' | 'processing' | 'summarizing' | 'completed' | 'error';
  transcript?: string;
  summary?: string;
  error?: string;
}

export interface TranscriptionResponse {
  transcript: string;
  metadata?: Record<string, any>;
}
