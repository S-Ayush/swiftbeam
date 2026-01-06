'use client';

import { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  Upload,
  X,
  AlertCircle,
  FileIcon,
  Image,
  Video,
  Music,
  Files,
} from 'lucide-react';
import { validateFile } from '@/lib/file-validation';

interface FileDropZoneProps {
  onFilesSelect: (files: File[]) => void;
  disabled?: boolean;
  children: React.ReactNode;
  maxFiles?: number;
}

export function FileDropZone({
  onFilesSelect,
  disabled,
  children,
  maxFiles = 10,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragFileCount, setDragFileCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [invalidFiles, setInvalidFiles] = useState<string[]>([]);
  const dragCounterRef = useRef(0);

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      dragCounterRef.current++;
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
        setDragFileCount(e.dataTransfer.items.length);
        setError(null);
        setInvalidFiles([]);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
      setDragFileCount(0);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsDragging(false);
      dragCounterRef.current = 0;
      setDragFileCount(0);

      if (disabled) return;

      const droppedFiles = Array.from(e.dataTransfer.files);

      if (droppedFiles.length === 0) return;

      // Limit number of files
      const filesToProcess = droppedFiles.slice(0, maxFiles);
      const validFiles: File[] = [];
      const invalid: string[] = [];

      for (const file of filesToProcess) {
        const validation = validateFile(file);
        if (validation.valid) {
          validFiles.push(file);
        } else {
          invalid.push(`${file.name}: ${validation.error}`);
        }
      }

      if (invalid.length > 0) {
        setInvalidFiles(invalid);
        setTimeout(() => setInvalidFiles([]), 5000);
      }

      if (validFiles.length > 0) {
        onFilesSelect(validFiles);
      } else if (invalid.length > 0) {
        setError('No valid files to send');
        setTimeout(() => setError(null), 3000);
      }
    },
    [disabled, onFilesSelect, maxFiles]
  );

  return (
    <div
      className="relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}

      {/* Full-page drag overlay with animation */}
      {isDragging && (
        <div
          className={cn(
            'fixed inset-0 z-[100] flex items-center justify-center',
            'bg-background/90 backdrop-blur-md',
            'animate-in fade-in-0 duration-200'
          )}
        >
          {/* Animated border */}
          <div className="absolute inset-4 border-4 border-dashed border-primary/50 rounded-3xl animate-pulse" />

          {/* Animated corner decorations */}
          <div className="absolute top-8 left-8 w-16 h-16 border-t-4 border-l-4 border-primary rounded-tl-2xl animate-in slide-in-from-top-2 duration-300" />
          <div className="absolute top-8 right-8 w-16 h-16 border-t-4 border-r-4 border-primary rounded-tr-2xl animate-in slide-in-from-top-2 duration-300" />
          <div className="absolute bottom-8 left-8 w-16 h-16 border-b-4 border-l-4 border-primary rounded-bl-2xl animate-in slide-in-from-bottom-2 duration-300" />
          <div className="absolute bottom-8 right-8 w-16 h-16 border-b-4 border-r-4 border-primary rounded-br-2xl animate-in slide-in-from-bottom-2 duration-300" />

          {/* Center content */}
          <div className="flex flex-col items-center gap-6 text-center p-8 animate-in zoom-in-95 duration-300">
            {/* Floating icons */}
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10 border-2 border-primary/20">
                <Upload className="h-12 w-12 text-primary animate-bounce" />
              </div>

              {/* Orbiting file type icons */}
              <div className="absolute -top-2 -left-2 h-10 w-10 bg-pink-500/10 rounded-xl flex items-center justify-center animate-in fade-in-0 slide-in-from-left-4 duration-500">
                <Image className="h-5 w-5 text-pink-500" />
              </div>
              <div className="absolute -top-2 -right-2 h-10 w-10 bg-purple-500/10 rounded-xl flex items-center justify-center animate-in fade-in-0 slide-in-from-right-4 duration-500 delay-75">
                <Video className="h-5 w-5 text-purple-500" />
              </div>
              <div className="absolute -bottom-2 -left-2 h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center animate-in fade-in-0 slide-in-from-left-4 duration-500 delay-100">
                <FileIcon className="h-5 w-5 text-blue-500" />
              </div>
              <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-orange-500/10 rounded-xl flex items-center justify-center animate-in fade-in-0 slide-in-from-right-4 duration-500 delay-150">
                <Music className="h-5 w-5 text-orange-500" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold">
                {dragFileCount > 1 ? `Drop ${dragFileCount} files` : 'Drop file to send'}
              </h2>
              <p className="text-muted-foreground">
                {dragFileCount > 1
                  ? 'Release to queue all files for transfer'
                  : 'Release to start the transfer'}
              </p>
            </div>

            {/* File count badge */}
            {dragFileCount > 1 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                <Files className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  {dragFileCount} files selected
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error overlay */}
      {(error || invalidFiles.length > 0) && (
        <div
          className={cn(
            'fixed inset-0 z-[100] flex items-center justify-center',
            'bg-background/90 backdrop-blur-md',
            'animate-in fade-in-0 duration-200'
          )}
          onClick={() => {
            setError(null);
            setInvalidFiles([]);
          }}
        >
          <div className="absolute inset-4 border-4 border-dashed border-destructive/50 rounded-3xl" />

          <div className="flex flex-col items-center gap-6 text-center p-8 max-w-lg animate-in zoom-in-95 duration-300">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-destructive/10 border-2 border-destructive/20">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-destructive">
                {invalidFiles.length > 0 ? 'Some files cannot be sent' : 'Cannot send file'}
              </h2>

              {invalidFiles.length > 0 ? (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {invalidFiles.map((msg, i) => (
                    <p key={i} className="text-sm text-muted-foreground">
                      {msg}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">{error}</p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Click anywhere to dismiss
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Backward compatibility - single file prop
interface SingleFileDropZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export function SingleFileDropZone({
  onFileSelect,
  disabled,
  children,
}: SingleFileDropZoneProps) {
  const handleFilesSelect = useCallback(
    (files: File[]) => {
      if (files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  return (
    <FileDropZone
      onFilesSelect={handleFilesSelect}
      disabled={disabled}
      maxFiles={1}
    >
      {children}
    </FileDropZone>
  );
}
