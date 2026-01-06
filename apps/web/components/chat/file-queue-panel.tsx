'use client';

import { useFileQueueStore, type QueuedFile } from '@/lib/stores/file-queue-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  X,
  Check,
  AlertCircle,
  FileIcon,
  Image,
  Video,
  Music,
  FileText,
  Archive,
  Code,
  ChevronUp,
  ChevronDown,
  Trash2,
  Loader2,
} from 'lucide-react';
import { formatFileSize, getFileExtension } from '@/lib/file-validation';
import { useState } from 'react';

// Get icon based on file type
function getFileIcon(filename: string) {
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

function QueueItem({
  item,
  onRemove,
}: {
  item: QueuedFile;
  onRemove: (id: string) => void;
}) {
  const Icon = getFileIcon(item.file.name);
  const isPending = item.status === 'pending';
  const isTransferring = item.status === 'transferring';
  const isComplete = item.status === 'complete';
  const isFailed = item.status === 'failed';
  const isCancelled = item.status === 'cancelled';

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-colors',
        'bg-muted/50 hover:bg-muted/80',
        isFailed && 'bg-destructive/10',
        isComplete && 'bg-green-500/10'
      )}
    >
      {/* Status Icon */}
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
          isPending && 'bg-muted',
          isTransferring && 'bg-primary/10',
          isComplete && 'bg-green-500/10',
          isFailed && 'bg-destructive/10',
          isCancelled && 'bg-muted'
        )}
      >
        {isComplete ? (
          <Check className="h-5 w-5 text-green-500" />
        ) : isFailed ? (
          <AlertCircle className="h-5 w-5 text-destructive" />
        ) : isTransferring ? (
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
        ) : isCancelled ? (
          <X className="h-5 w-5 text-muted-foreground" />
        ) : (
          <Icon className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.file.name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatFileSize(item.file.size)}</span>
          {isTransferring && (
            <>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
              <span className="font-mono">{item.progress.toFixed(0)}%</span>
            </>
          )}
          {isComplete && <span className="text-green-600">Complete</span>}
          {isFailed && <span className="text-destructive">Failed</span>}
          {isCancelled && <span>Cancelled</span>}
        </div>
        {isTransferring && (
          <Progress value={item.progress} className="h-1 mt-2" />
        )}
      </div>

      {/* Remove Button */}
      {(isPending || isFailed || isCancelled) && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => onRemove(item.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function FileQueuePanel() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { queue, removeFile, clearCompleted, clearAll, getTotalProgress } =
    useFileQueueStore();

  if (queue.length === 0) return null;

  const { completed, total, percent } = getTotalProgress();
  const hasCompleted = queue.some(
    (f) => f.status === 'complete' || f.status === 'failed' || f.status === 'cancelled'
  );
  const activeCount = queue.filter(
    (f) => f.status === 'pending' || f.status === 'transferring'
  ).length;

  return (
    <div className="border-t bg-background">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">File Queue</span>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              {activeCount > 0 ? `${activeCount} pending` : `${total} files`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasCompleted && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                clearCompleted();
              }}
            >
              Clear Done
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              clearAll();
            }}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Clear All
          </Button>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Overall Progress */}
      {activeCount > 0 && (
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Overall Progress</span>
            <span>
              {completed} / {total} complete
            </span>
          </div>
          <Progress value={percent} className="h-1.5" />
        </div>
      )}

      {/* Queue List */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-2 max-h-64 overflow-y-auto">
          {queue.map((item) => (
            <QueueItem key={item.id} item={item} onRemove={removeFile} />
          ))}
        </div>
      )}
    </div>
  );
}
