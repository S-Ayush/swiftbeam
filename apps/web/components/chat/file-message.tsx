'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Download,
  X,
  Check,
  AlertCircle,
  Pause,
  Play,
  FileIcon,
  Image,
  Video,
  Music,
  FileText,
  Archive,
  Code,
} from 'lucide-react';
import type { Message } from '@/lib/stores/chat-store';
import {
  formatFileSize,
  formatSpeed,
  formatTimeRemaining,
  getFileExtension,
} from '@/lib/file-validation';
import { downloadBlob } from '@/lib/file-transfer';

interface FileMessageProps {
  message: Message;
  onCancel?: (fileId: string) => void;
}

// Get Lucide icon component based on file type
function getFileIconComponent(filename: string) {
  const ext = getFileExtension(filename).toLowerCase();

  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp', '.ico'];
  const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv'];
  const audioExts = ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.aac', '.wma'];
  const docExts = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.pages'];
  const archiveExts = ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz'];
  const codeExts = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.html', '.css', '.json', '.xml', '.yaml', '.yml', '.md', '.sql', '.sh', '.go', '.rs', '.cpp', '.c', '.h'];

  if (imageExts.includes(ext)) return Image;
  if (videoExts.includes(ext)) return Video;
  if (audioExts.includes(ext)) return Music;
  if (docExts.includes(ext)) return FileText;
  if (archiveExts.includes(ext)) return Archive;
  if (codeExts.includes(ext)) return Code;
  return FileIcon;
}

// Get color based on file type
function getFileTypeColor(filename: string) {
  const ext = getFileExtension(filename).toLowerCase();

  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp', '.ico'];
  const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv'];
  const audioExts = ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.aac', '.wma'];
  const docExts = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.pages'];
  const archiveExts = ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz'];
  const codeExts = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.html', '.css', '.json', '.xml', '.yaml', '.yml', '.md', '.sql', '.sh', '.go', '.rs', '.cpp', '.c', '.h'];

  if (imageExts.includes(ext)) return { bg: 'bg-pink-500/10', text: 'text-pink-500', border: 'border-pink-500/20' };
  if (videoExts.includes(ext)) return { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20' };
  if (audioExts.includes(ext)) return { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/20' };
  if (docExts.includes(ext)) return { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' };
  if (archiveExts.includes(ext)) return { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' };
  if (codeExts.includes(ext)) return { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' };
  return { bg: 'bg-gray-500/10', text: 'text-gray-500', border: 'border-gray-500/20' };
}

export function FileMessage({ message, onCancel }: FileMessageProps) {
  const isOwn = message.sender === 'self';
  const file = message.file;

  if (!file) return null;

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownload = () => {
    if (file.blob) {
      downloadBlob(file.blob, file.name);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel(file.fileId);
    }
  };

  const isTransferring = file.transferStatus === 'transferring';
  const isComplete = file.transferStatus === 'complete';
  const isFailed = file.transferStatus === 'failed';
  const isCancelled = file.transferStatus === 'cancelled';
  const isPending = file.transferStatus === 'pending';

  // Calculate time remaining
  const bytesRemaining = file.size * (1 - file.progress / 100);
  const timeRemaining = file.speed > 0 ? bytesRemaining / file.speed : 0;

  const FileIconComponent = getFileIconComponent(file.name);
  const fileColors = getFileTypeColor(file.name);

  return (
    <div
      className={cn('flex flex-col max-w-[320px] mb-3', isOwn ? 'ml-auto' : '')}
    >
      {!isOwn && (
        <span className="text-xs text-muted-foreground mb-1 ml-1">Peer</span>
      )}

      <div
        className={cn(
          'rounded-2xl overflow-hidden transition-all duration-200',
          isOwn
            ? 'bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20'
            : 'bg-muted/80 border border-border',
          isFailed && 'border-destructive/50 bg-destructive/5',
          isCancelled && 'opacity-60',
          isComplete && isOwn && 'border-green-500/30 bg-gradient-to-br from-green-500/10 to-green-500/5',
          isComplete && !isOwn && 'border-green-500/30'
        )}
      >
        {/* File info header */}
        <div className="flex items-center gap-3 p-4">
          {/* File icon with type-specific color */}
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors',
              isComplete ? 'bg-green-500/10' : fileColors.bg,
              isFailed && 'bg-destructive/10',
              isCancelled && 'bg-muted'
            )}
          >
            {isComplete ? (
              <Check className="h-6 w-6 text-green-500" />
            ) : isFailed ? (
              <AlertCircle className="h-6 w-6 text-destructive" />
            ) : isCancelled ? (
              <X className="h-6 w-6 text-muted-foreground" />
            ) : (
              <FileIconComponent className={cn('h-6 w-6', fileColors.text)} />
            )}
          </div>

          {/* File details */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate" title={file.name}>
              {file.name}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatFileSize(file.size)}</span>
              {file.mimeType && (
                <>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                  <span className="uppercase">
                    {getFileExtension(file.name).slice(1) || 'file'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Progress section - only during transfer */}
        {(isTransferring || isPending) && (
          <div className="px-4 pb-3 space-y-2">
            {/* Custom progress bar */}
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'absolute inset-y-0 left-0 rounded-full transition-all duration-300',
                  isPending ? 'bg-muted-foreground/30 animate-pulse' : 'bg-primary'
                )}
                style={{ width: `${file.progress}%` }}
              />
              {isTransferring && (
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
                  style={{ width: `${file.progress}%` }}
                />
              )}
            </div>

            {/* Transfer stats */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {isPending ? (
                  'Preparing...'
                ) : (
                  <span className="font-mono">
                    {file.progress.toFixed(0)}%
                  </span>
                )}
              </span>

              {isTransferring && file.speed > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="font-mono text-foreground">
                    {formatSpeed(file.speed)}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                  <span>{formatTimeRemaining(timeRemaining)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Completed state */}
        {isComplete && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
              <Check className="h-3.5 w-3.5" />
              <span className="font-medium">
                {isOwn ? 'Sent successfully' : 'Ready to download'}
              </span>
            </div>
          </div>
        )}

        {/* Error state */}
        {isFailed && (
          <div className="px-4 pb-3">
            <p className="text-xs text-destructive flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              Transfer failed
            </p>
          </div>
        )}

        {/* Cancelled state */}
        {isCancelled && (
          <div className="px-4 pb-3">
            <p className="text-xs text-muted-foreground">Transfer cancelled</p>
          </div>
        )}

        {/* Actions */}
        {(isTransferring || (isComplete && !isOwn && file.blob)) && (
          <div className="px-4 pb-4">
            {isTransferring && isOwn && (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-9"
                onClick={handleCancel}
              >
                <X className="h-4 w-4 mr-1.5" />
                Cancel Transfer
              </Button>
            )}

            {isComplete && !isOwn && file.blob && (
              <Button
                size="sm"
                className="w-full h-9 bg-green-600 hover:bg-green-700 text-white"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-1.5" />
                Download File
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Timestamp */}
      <span
        className={cn(
          'text-[10px] text-muted-foreground mt-1.5',
          isOwn ? 'text-right mr-2' : 'ml-2'
        )}
      >
        {formatTime(message.timestamp)}
      </span>
    </div>
  );
}
