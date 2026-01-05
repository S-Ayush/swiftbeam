import { CHUNK_SIZE, BUFFER_HIGH_WATER_MARK, BUFFER_LOW_WATER_MARK } from './file-validation';

// Message types for file transfer protocol
export interface FileMetaMessage {
  type: 'file-meta';
  fileId: string;
  name: string;
  size: number;
  mimeType: string;
  totalChunks: number;
}

export interface FileChunkMessage {
  type: 'file-chunk';
  fileId: string;
  index: number;
  // data is sent as ArrayBuffer separately
}

export interface FileCompleteMessage {
  type: 'file-complete';
  fileId: string;
}

export interface FileErrorMessage {
  type: 'file-error';
  fileId: string;
  error: string;
}

export interface FileCancelMessage {
  type: 'file-cancel';
  fileId: string;
}

export type FileTransferMessage =
  | FileMetaMessage
  | FileChunkMessage
  | FileCompleteMessage
  | FileErrorMessage
  | FileCancelMessage;

export type TransferStatus =
  | 'pending'
  | 'transferring'
  | 'complete'
  | 'failed'
  | 'cancelled';

export interface FileTransfer {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  totalChunks: number;
  chunksTransferred: number;
  status: TransferStatus;
  direction: 'send' | 'receive';
  progress: number;
  speed: number;
  error?: string;
  blob?: Blob;
  startTime?: number;
}

// Generate unique file ID
export function generateFileId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Calculate total chunks for a file
export function calculateTotalChunks(fileSize: number): number {
  return Math.ceil(fileSize / CHUNK_SIZE);
}

// File sender class
export class FileSender {
  private file: File;
  private fileId: string;
  private dataChannel: RTCDataChannel;
  private currentChunk: number = 0;
  private totalChunks: number;
  private isPaused: boolean = false;
  private isCancelled: boolean = false;
  private onProgress?: (progress: number, speed: number) => void;
  private onComplete?: () => void;
  private onError?: (error: string) => void;
  private bytesLastSecond: number[] = [];
  private lastSpeedUpdate: number = Date.now();

  constructor(
    file: File,
    fileId: string,
    dataChannel: RTCDataChannel,
    options?: {
      onProgress?: (progress: number, speed: number) => void;
      onComplete?: () => void;
      onError?: (error: string) => void;
    }
  ) {
    this.file = file;
    this.fileId = fileId;
    this.dataChannel = dataChannel;
    this.totalChunks = calculateTotalChunks(file.size);
    this.onProgress = options?.onProgress;
    this.onComplete = options?.onComplete;
    this.onError = options?.onError;
  }

  async start(): Promise<void> {
    try {
      // Send file metadata
      const meta: FileMetaMessage = {
        type: 'file-meta',
        fileId: this.fileId,
        name: this.file.name,
        size: this.file.size,
        mimeType: this.file.type || 'application/octet-stream',
        totalChunks: this.totalChunks,
      };

      this.dataChannel.send(JSON.stringify(meta));

      // Set up buffer management
      this.dataChannel.bufferedAmountLowThreshold = BUFFER_LOW_WATER_MARK;
      this.dataChannel.onbufferedamountlow = () => {
        if (this.isPaused && !this.isCancelled) {
          this.isPaused = false;
          this.sendChunks();
        }
      };

      // Start sending chunks
      await this.sendChunks();
    } catch (error) {
      this.onError?.(error instanceof Error ? error.message : 'Failed to send file');
    }
  }

  private async sendChunks(): Promise<void> {
    while (this.currentChunk < this.totalChunks && !this.isCancelled) {
      // Check buffer
      if (this.dataChannel.bufferedAmount > BUFFER_HIGH_WATER_MARK) {
        this.isPaused = true;
        return; // Will resume from bufferedamountlow event
      }

      const start = this.currentChunk * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, this.file.size);
      const chunk = this.file.slice(start, end);
      const buffer = await chunk.arrayBuffer();

      // Send chunk header
      const header: FileChunkMessage = {
        type: 'file-chunk',
        fileId: this.fileId,
        index: this.currentChunk,
      };
      this.dataChannel.send(JSON.stringify(header));

      // Send chunk data
      this.dataChannel.send(buffer);

      this.currentChunk++;

      // Calculate progress and speed
      const progress = (this.currentChunk / this.totalChunks) * 100;
      const speed = this.calculateSpeed(end - start);
      this.onProgress?.(progress, speed);
    }

    if (!this.isCancelled && this.currentChunk >= this.totalChunks) {
      // Send completion message
      const complete: FileCompleteMessage = {
        type: 'file-complete',
        fileId: this.fileId,
      };
      this.dataChannel.send(JSON.stringify(complete));
      this.onComplete?.();
    }
  }

  private calculateSpeed(bytesTransferred: number): number {
    const now = Date.now();
    this.bytesLastSecond.push(bytesTransferred);

    // Keep only last 3 seconds of data
    if (now - this.lastSpeedUpdate > 1000) {
      const totalBytes = this.bytesLastSecond.reduce((a, b) => a + b, 0);
      const speed = totalBytes / (this.bytesLastSecond.length * (CHUNK_SIZE / 16384));
      this.bytesLastSecond = [];
      this.lastSpeedUpdate = now;
      return speed * 10; // Approximate MB/s
    }

    // Return rough estimate
    return bytesTransferred * 60; // Very rough
  }

  cancel(): void {
    this.isCancelled = true;
    const cancel: FileCancelMessage = {
      type: 'file-cancel',
      fileId: this.fileId,
    };
    try {
      this.dataChannel.send(JSON.stringify(cancel));
    } catch {
      // Channel might be closed
    }
  }
}

// File receiver class
export class FileReceiver {
  private fileId: string;
  private name: string;
  private size: number;
  private mimeType: string;
  private totalChunks: number;
  private chunks: ArrayBuffer[] = [];
  private receivedChunks: number = 0;
  private onProgress?: (progress: number) => void;
  private onComplete?: (blob: Blob) => void;
  private onError?: (error: string) => void;
  private expectingData: boolean = false;
  private currentChunkIndex: number = -1;

  constructor(
    meta: FileMetaMessage,
    options?: {
      onProgress?: (progress: number) => void;
      onComplete?: (blob: Blob) => void;
      onError?: (error: string) => void;
    }
  ) {
    this.fileId = meta.fileId;
    this.name = meta.name;
    this.size = meta.size;
    this.mimeType = meta.mimeType;
    this.totalChunks = meta.totalChunks;
    this.chunks = new Array(meta.totalChunks);
    this.onProgress = options?.onProgress;
    this.onComplete = options?.onComplete;
    this.onError = options?.onError;
  }

  handleChunkHeader(chunk: FileChunkMessage): void {
    this.currentChunkIndex = chunk.index;
    this.expectingData = true;
  }

  handleChunkData(data: ArrayBuffer): void {
    if (!this.expectingData || this.currentChunkIndex < 0) {
      return;
    }

    this.chunks[this.currentChunkIndex] = data;
    this.receivedChunks++;
    this.expectingData = false;

    const progress = (this.receivedChunks / this.totalChunks) * 100;
    this.onProgress?.(progress);
  }

  complete(): void {
    try {
      const blob = new Blob(this.chunks, { type: this.mimeType });
      this.onComplete?.(blob);
    } catch (error) {
      this.onError?.('Failed to assemble file');
    }
  }

  getFileId(): string {
    return this.fileId;
  }

  getName(): string {
    return this.name;
  }

  getSize(): number {
    return this.size;
  }

  isExpectingData(): boolean {
    return this.expectingData;
  }
}

// Download blob as file
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
