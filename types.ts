
export type BulbColor = 'red' | 'blue' | 'yellow' | 'green' | 'pink';

export interface LetterConfig {
  char: string;
  color: BulbColor;
  row: number;
  offset: string; // margin-top variant
}

export interface TransmissionState {
  isTransmitting: boolean;
  currentLetterIndex: number;
  message: string;
  response: string;
  isReceiving: boolean;
}
