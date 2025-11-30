export interface TranslationHistoryItem {
  id: string;
  original: string;
  translated: string;
  timestamp: number;
}

export enum LoadingState {
  IDLE = 'IDLE',
  TRANSLATING = 'TRANSLATING',
  SPEAKING = 'SPEAKING',
  ERROR = 'ERROR'
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}