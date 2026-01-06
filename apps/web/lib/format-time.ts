// Time formatting utilities for chat messages

/**
 * Format timestamp as relative time (e.g., "Just now", "2m ago", "3:45 PM")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) {
    return 'Just now';
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  if (hours < 24 && isToday(timestamp)) {
    return formatTime(timestamp);
  }

  if (isYesterday(timestamp)) {
    return `Yesterday ${formatTime(timestamp)}`;
  }

  return formatDateTime(timestamp);
}

/**
 * Format timestamp as time only (e.g., "3:45 PM")
 */
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format timestamp as date and time (e.g., "Jan 5, 3:45 PM")
 */
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format timestamp as full date (e.g., "January 5, 2025")
 */
export function formatFullDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString([], {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Get date separator text (e.g., "Today", "Yesterday", "January 5, 2025")
 */
export function getDateSeparator(timestamp: number): string {
  if (isToday(timestamp)) {
    return 'Today';
  }

  if (isYesterday(timestamp)) {
    return 'Yesterday';
  }

  return formatFullDate(timestamp);
}

/**
 * Check if timestamp is from today
 */
export function isToday(timestamp: number): boolean {
  const date = new Date(timestamp);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if timestamp is from yesterday
 */
export function isYesterday(timestamp: number): boolean {
  const date = new Date(timestamp);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
}

/**
 * Check if two timestamps are on the same day
 */
export function isSameDay(timestamp1: number, timestamp2: number): boolean {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

/**
 * Check if two messages should be grouped (same sender within 2 minutes)
 */
export function shouldGroupMessages(
  prevTimestamp: number,
  currTimestamp: number,
  prevSender: string,
  currSender: string
): boolean {
  if (prevSender !== currSender) return false;
  if (prevSender === 'system' || currSender === 'system') return false;

  const diffMinutes = (currTimestamp - prevTimestamp) / (1000 * 60);
  return diffMinutes < 2;
}
