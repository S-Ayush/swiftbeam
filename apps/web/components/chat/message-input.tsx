'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Send, Code, Paperclip } from 'lucide-react';

interface MessageInputProps {
  onSend: (content: string, type: 'text' | 'code') => void;
  onFileSelect?: (files: FileList) => void;
  onTyping?: () => void;
  disabled?: boolean;
}

export function MessageInput({
  onSend,
  onFileSelect,
  onTyping,
  disabled,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isCodeMode, setIsCodeMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = message.trim();
    if (trimmed && !disabled) {
      onSend(trimmed, isCodeMode ? 'code' : 'text');
      setMessage('');
      setIsCodeMode(false);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [message, isCodeMode, onSend, disabled]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isCodeMode) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Notify typing
    if (value.length > 0 && onTyping) {
      onTyping();
    }

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect?.(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div className="border-t bg-background p-4">
      <div
        className={cn(
          'flex items-end gap-2 rounded-xl border bg-muted/50 p-2',
          isCodeMode && 'bg-[#1e1e1e]'
        )}
      >
        {/* File attachment button */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-9 w-9"
          onClick={handleFileClick}
          disabled={disabled}
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          multiple
        />

        {/* Code mode toggle */}
        <Button
          variant={isCodeMode ? 'secondary' : 'ghost'}
          size="icon"
          className="shrink-0 h-9 w-9"
          onClick={() => setIsCodeMode(!isCodeMode)}
          disabled={disabled}
        >
          <Code className="h-5 w-5" />
        </Button>

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={isCodeMode ? 'Paste or type code...' : 'Type a message...'}
          disabled={disabled}
          className={cn(
            'flex-1 resize-none bg-transparent outline-none min-h-[36px] max-h-[200px] py-2 px-1 text-sm',
            isCodeMode && 'font-mono text-[#d4d4d4]',
            disabled && 'opacity-50'
          )}
          rows={1}
        />

        {/* Send button */}
        <Button
          size="icon"
          className="shrink-0 h-9 w-9"
          onClick={handleSubmit}
          disabled={disabled || !message.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Hints */}
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>
          {isCodeMode ? 'Code mode: Cmd+Enter to send' : 'Enter to send, Shift+Enter for new line'}
        </span>
        {isCodeMode && (
          <button
            onClick={() => setIsCodeMode(false)}
            className="text-primary hover:underline"
          >
            Exit code mode
          </button>
        )}
      </div>
    </div>
  );
}
