'use client';

import { useEffect, useCallback } from 'react';

interface UseClipboardPasteOptions {
  onPasteFiles: (files: File[]) => void;
  onPasteText?: (text: string) => void;
  enabled?: boolean;
}

export function useClipboardPaste({
  onPasteFiles,
  onPasteText,
  enabled = true,
}: UseClipboardPasteOptions) {
  const handlePaste = useCallback(
    async (event: ClipboardEvent) => {
      if (!enabled) return;

      const clipboardData = event.clipboardData;
      if (!clipboardData) return;

      const files: File[] = [];

      // Check for files in clipboard
      if (clipboardData.files && clipboardData.files.length > 0) {
        files.push(...Array.from(clipboardData.files));
      }

      // Check for items (handles images from screenshots)
      if (clipboardData.items) {
        for (const item of Array.from(clipboardData.items)) {
          if (item.kind === 'file') {
            const file = item.getAsFile();
            if (file && !files.some((f) => f.name === file.name && f.size === file.size)) {
              files.push(file);
            }
          }
        }
      }

      // If we have files, handle them
      if (files.length > 0) {
        event.preventDefault();

        // Process files - rename screenshots with timestamp
        const processedFiles = files.map((file) => {
          // If it's a blob/screenshot without a proper name, give it one
          if (file.name === 'image.png' || file.name === 'blob') {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const extension = file.type.split('/')[1] || 'png';
            return new File([file], `screenshot-${timestamp}.${extension}`, {
              type: file.type,
            });
          }
          return file;
        });

        onPasteFiles(processedFiles);
        return;
      }

      // Handle text paste (optional callback)
      if (onPasteText) {
        const text = clipboardData.getData('text/plain');
        if (text) {
          // Don't prevent default for text - let it go to input
          onPasteText(text);
        }
      }
    },
    [enabled, onPasteFiles, onPasteText]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [enabled, handlePaste]);
}

// Utility to read image from clipboard (for manual trigger)
export async function readImageFromClipboard(): Promise<File | null> {
  try {
    const clipboardItems = await navigator.clipboard.read();

    for (const item of clipboardItems) {
      // Look for image types
      const imageType = item.types.find((type) => type.startsWith('image/'));
      if (imageType) {
        const blob = await item.getType(imageType);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const extension = imageType.split('/')[1] || 'png';
        return new File([blob], `clipboard-${timestamp}.${extension}`, {
          type: imageType,
        });
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to read clipboard:', error);
    return null;
  }
}
