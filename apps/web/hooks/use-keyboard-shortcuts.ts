'use client';

import { useEffect, useCallback, useRef } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  when?: () => boolean;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      for (const shortcut of shortcutsRef.current) {
        const ctrlOrMeta = isMac ? event.metaKey : event.ctrlKey;
        const matchesModifiers =
          (shortcut.ctrl ? ctrlOrMeta : !ctrlOrMeta || shortcut.meta) &&
          (shortcut.shift ? event.shiftKey : !event.shiftKey) &&
          (shortcut.alt ? event.altKey : !event.altKey);

        const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (matchesModifiers && matchesKey) {
          // Check if shortcut should be active
          if (shortcut.when && !shortcut.when()) {
            continue;
          }

          // Some shortcuts should work even in inputs
          const allowInInput = shortcut.key === 'Escape' || shortcut.ctrl;

          if (isInput && !allowInInput) {
            continue;
          }

          event.preventDefault();
          event.stopPropagation();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}

// Predefined shortcuts for chat
export function useChatShortcuts({
  onOpenFilePicker,
  onCopyRoomCode,
  onLeaveRoom,
  onFocusInput,
  isConnected,
}: {
  onOpenFilePicker?: () => void;
  onCopyRoomCode?: () => void;
  onLeaveRoom?: () => void;
  onFocusInput?: () => void;
  isConnected?: boolean;
}) {
  const shortcuts: ShortcutConfig[] = [
    {
      key: 'o',
      ctrl: true,
      action: () => onOpenFilePicker?.(),
      description: 'Open file picker',
      when: () => isConnected ?? false,
    },
    {
      key: 'c',
      ctrl: true,
      shift: true,
      action: () => onCopyRoomCode?.(),
      description: 'Copy room code',
    },
    {
      key: 'Escape',
      action: () => {
        // Focus is handled differently - blur current input
        const active = document.activeElement as HTMLElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
          active.blur();
        }
      },
      description: 'Unfocus input',
    },
    {
      key: '/',
      action: () => onFocusInput?.(),
      description: 'Focus message input',
    },
  ];

  useKeyboardShortcuts(shortcuts);
}

// Format shortcut for display
export function formatShortcut(shortcut: { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean }): string {
  const parts: string[] = [];

  if (shortcut.ctrl) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  if (shortcut.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }

  // Format special keys
  let key = shortcut.key;
  if (key === 'Escape') key = 'Esc';
  if (key === ' ') key = 'Space';
  if (key.length === 1) key = key.toUpperCase();

  parts.push(key);

  return parts.join(isMac ? '' : '+');
}

// Shortcuts help data
export const CHAT_SHORTCUTS = [
  { key: 'o', ctrl: true, description: 'Open file picker' },
  { key: 'c', ctrl: true, shift: true, description: 'Copy room code' },
  { key: '/', description: 'Focus message input' },
  { key: 'Escape', description: 'Unfocus input' },
  { key: 'Enter', description: 'Send message' },
  { key: 'Enter', shift: true, description: 'New line' },
  { key: 'v', ctrl: true, description: 'Paste image/file' },
];
