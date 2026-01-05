'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Download,
  X,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { Message } from '@/lib/stores/chat-store';
import {
  formatFileSize,
  formatSpeed,
  formatTimeRemaining,
  getFileIcon,
} from '@/lib/file-validation';
import { downloadBlob } from '@/lib/file-transfer';

interface FileMessageProps {
  message: Message;
  onCancel?: (fileId: string) => void;
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

  // Calculate time remaining for sender
  const bytesRemaining = file.size * (1 - file.progress / 100);
  const timeRemaining = file.speed > 0 ? bytesRemaining / file.speed : 0;

  return (
    <div
      className={cn('flex flex-col max-w-[85%] mb-3', isOwn ? 'ml-auto' : '')}
    >
      {!isOwn && (
        <span className="text-xs text-muted-foreground mb-1 ml-1">Peer</span>
      )}

      <div
        className={cn(
          'rounded-xl border overflow-hidden',
          isOwn ? 'bg-primary/5 border-primary/20' : 'bg-muted border-border',
          isFailed && 'border-destructive/50',
          isCancelled && 'border-muted-foreground/50'
        )}
      >
        {/* File info header */}
        <div className="flex items-start gap-3 p-4">
          {/* File icon */}
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-2xl',
              isComplete && 'bg-green-500/10',
              isFailed && 'bg-destructive/10',
              isCancelled && 'bg-muted',
              (isTransferring || isPending) && 'bg-primary/10'
            )}
          >
            {isComplete && <Check className="h-6 w-6 text-green-500" />}
            {isFailed && <AlertCircle className="h-6 w-6 text-destructive" />}
            {isCancelled && <X className="h-6 w-6 text-muted-foreground" />}
            {(isTransferring || isPending) && (
              <span>{getFileIcon(file.name)}</span>
            )}
          </div>

          {/* File details */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.size)}
              {file.mimeType && ` • ${file.mimeType.split('/')[1]?.toUpperCase() || 'File'}`}
            </p>
          </div>
        </div>

        {/* Progress section */}
        {(isTransferring || isPending) && (
          <div className="px-4 pb-4 space-y-2">
            <Progress value={file.progress} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {isPending
                  ? 'Waiting...'
                  : isOwn
                    ? `${formatFileSize(file.size * file.progress / 100)} / ${formatFileSize(file.size)}`
                    : `Receiving... ${file.progress.toFixed(0)}%`}
              </span>
              {isTransferring && isOwn && file.speed > 0 && (
                <span>
                  {formatSpeed(file.speed)} • {formatTimeRemaining(timeRemaining)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Complete state */}
        {isComplete && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2">
              <Progress value={100} className="h-2 flex-1" />
              <span className="text-xs text-green-500 font-medium">Complete</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {isFailed && (
          <div className="px-4 pb-4">
            <p className="text-xs text-destructive">
              Transfer failed: Connection lost
            </p>
          </div>
        )}

        {/* Cancelled state */}
        {isCancelled && (
          <div className="px-4 pb-4">
            <p className="text-xs text-muted-foreground">Transfer cancelled</p>
          </div>
        )}

        {/* Actions */}
        <div className="px-4 pb-4 flex gap-2">
          {isTransferring && isOwn && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleCancel}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          )}

          {isComplete && !isOwn && file.blob && (
            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          )}

          {isComplete && isOwn && (
            <div className="flex items-center gap-2 text-xs text-green-500">
              <Check className="h-4 w-4" />
              Sent successfully
            </div>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <span
        className={cn(
          'text-xs text-muted-foreground mt-1',
          isOwn ? 'text-right mr-1' : 'ml-1'
        )}
      >
        {formatTime(message.timestamp)}
      </span>
    </div>
  );
}
