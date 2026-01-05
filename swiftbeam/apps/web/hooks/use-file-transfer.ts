'use client';

import { useCallback, useRef } from 'react';
import { useChatStore } from '@/lib/stores/chat-store';
import {
  FileSender,
  FileReceiver,
  generateFileId,
  calculateTotalChunks,
  downloadBlob,
  type FileMetaMessage,
  type FileChunkMessage,
  type FileCompleteMessage,
  type FileCancelMessage,
} from '@/lib/file-transfer';
import { validateFile } from '@/lib/file-validation';

interface UseFileTransferOptions {
  dataChannel: RTCDataChannel | null;
}

export function useFileTransfer({ dataChannel }: UseFileTransferOptions) {
  const { addMessage, updateFileMessage } = useChatStore();

  const activeSendersRef = useRef<Map<string, FileSender>>(new Map());
  const activeReceiversRef = useRef<Map<string, FileReceiver>>(new Map());

  // Send a file
  const sendFile = useCallback(
    async (file: File) => {
      if (!dataChannel || dataChannel.readyState !== 'open') {
        console.error('Data channel not open');
        return;
      }

      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        console.error('File validation failed:', validation.error);
        return;
      }

      const fileId = generateFileId();
      const totalChunks = calculateTotalChunks(file.size);

      // Add file message to chat
      addMessage({
        type: 'file',
        content: file.name,
        sender: 'self',
        status: 'sending',
        file: {
          fileId,
          name: file.name,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
          progress: 0,
          speed: 0,
          transferStatus: 'transferring',
        },
      });

      // Create sender
      const sender = new FileSender(file, fileId, dataChannel, {
        onProgress: (progress, speed) => {
          updateFileMessage(fileId, {
            progress,
            speed,
            transferStatus: 'transferring',
          });
        },
        onComplete: () => {
          updateFileMessage(fileId, {
            progress: 100,
            transferStatus: 'complete',
          });
          activeSendersRef.current.delete(fileId);
        },
        onError: (error) => {
          updateFileMessage(fileId, {
            transferStatus: 'failed',
          });
          activeSendersRef.current.delete(fileId);
        },
      });

      activeSendersRef.current.set(fileId, sender);
      await sender.start();
    },
    [dataChannel, addMessage, updateFileMessage]
  );

  // Cancel a file transfer
  const cancelTransfer = useCallback((fileId: string) => {
    const sender = activeSendersRef.current.get(fileId);
    if (sender) {
      sender.cancel();
      activeSendersRef.current.delete(fileId);
      updateFileMessage(fileId, { transferStatus: 'cancelled' });
    }
  }, [updateFileMessage]);

  // Handle incoming file messages
  const handleFileMessage = useCallback(
    (data: any) => {
      if (data.type === 'file-meta') {
        const meta = data as FileMetaMessage;

        // Add file message to chat
        addMessage({
          type: 'file',
          content: meta.name,
          sender: 'peer',
          status: 'sent',
          file: {
            fileId: meta.fileId,
            name: meta.name,
            size: meta.size,
            mimeType: meta.mimeType,
            progress: 0,
            speed: 0,
            transferStatus: 'transferring',
          },
        });

        // Create receiver
        const receiver = new FileReceiver(meta, {
          onProgress: (progress) => {
            updateFileMessage(meta.fileId, {
              progress,
              transferStatus: 'transferring',
            });
          },
          onComplete: (blob) => {
            updateFileMessage(meta.fileId, {
              progress: 100,
              transferStatus: 'complete',
              blob,
            });
            activeReceiversRef.current.delete(meta.fileId);
          },
          onError: (error) => {
            updateFileMessage(meta.fileId, {
              transferStatus: 'failed',
            });
            activeReceiversRef.current.delete(meta.fileId);
          },
        });

        activeReceiversRef.current.set(meta.fileId, receiver);
      } else if (data.type === 'file-chunk') {
        const chunk = data as FileChunkMessage;
        const receiver = activeReceiversRef.current.get(chunk.fileId);
        if (receiver) {
          receiver.handleChunkHeader(chunk);
        }
      } else if (data.type === 'file-complete') {
        const complete = data as FileCompleteMessage;
        const receiver = activeReceiversRef.current.get(complete.fileId);
        if (receiver) {
          receiver.complete();
        }
      } else if (data.type === 'file-cancel') {
        const cancel = data as FileCancelMessage;
        activeReceiversRef.current.delete(cancel.fileId);
        updateFileMessage(cancel.fileId, { transferStatus: 'cancelled' });
      }
    },
    [addMessage, updateFileMessage]
  );

  // Handle raw binary data (chunk data)
  const handleBinaryData = useCallback((data: ArrayBuffer) => {
    // Find receiver expecting data
    for (const receiver of activeReceiversRef.current.values()) {
      if (receiver.isExpectingData()) {
        receiver.handleChunkData(data);
        return;
      }
    }
  }, []);

  return {
    sendFile,
    cancelTransfer,
    handleFileMessage,
    handleBinaryData,
  };
}
