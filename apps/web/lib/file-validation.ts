// Blocked file extensions for security
export const BLOCKED_EXTENSIONS = new Set([
  // Windows executables
  '.exe', '.msi', '.bat', '.cmd', '.com', '.scr', '.pif',

  // Scripts
  '.vbs', '.vbe', '.js', '.jse', '.ws', '.wsf', '.wsc', '.wsh',

  // PowerShell
  '.ps1', '.ps1xml', '.ps2', '.ps2xml', '.psc1', '.psc2',

  // Shell scripts
  '.msh', '.msh1', '.msh2', '.mshxml', '.msh1xml', '.msh2xml',

  // System files
  '.scf', '.lnk', '.inf', '.reg', '.dll', '.sys', '.drv', '.ocx', '.cpl',

  // Java
  '.jar',

  // macOS/Linux
  '.app', '.dmg', '.pkg', '.deb', '.rpm', '.bin', '.run',

  // Android
  '.apk',
]);

// File size limits
export const MAX_FILE_SIZE = 15 * 1024 * 1024 * 1024; // 15 GB
export const CHUNK_SIZE = 16 * 1024; // 16 KB

// Buffer management
export const BUFFER_HIGH_WATER_MARK = 1 * 1024 * 1024; // 1 MB - pause threshold
export const BUFFER_LOW_WATER_MARK = 256 * 1024; // 256 KB - resume threshold

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFile(file: File): FileValidationResult {
  // Check for empty file
  if (file.size === 0) {
    return { valid: false, error: 'Cannot send empty files' };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File exceeds 15GB limit' };
  }

  // Check extension
  const extension = getFileExtension(file.name).toLowerCase();
  if (BLOCKED_EXTENSIONS.has(extension)) {
    return { valid: false, error: 'This file type is not allowed for security reasons' };
  }

  return { valid: true };
}

export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.slice(lastDot);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}

export function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return '0 B/s';

  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const k = 1024;
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));

  return `${parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}

export function formatTimeRemaining(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return 'calculating...';

  if (seconds < 60) {
    return `~${Math.ceil(seconds)}s remaining`;
  } else if (seconds < 3600) {
    const mins = Math.ceil(seconds / 60);
    return `~${mins}m remaining`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.ceil((seconds % 3600) / 60);
    return `~${hours}h ${mins}m remaining`;
  }
}

// File type icons based on extension
export function getFileIcon(filename: string): string {
  const ext = getFileExtension(filename).toLowerCase();

  const iconMap: Record<string, string> = {
    // Images
    '.jpg': '🖼️', '.jpeg': '🖼️', '.png': '🖼️', '.gif': '🖼️',
    '.svg': '🖼️', '.webp': '🖼️', '.bmp': '🖼️', '.ico': '🖼️',

    // Video
    '.mp4': '🎬', '.mov': '🎬', '.avi': '🎬', '.mkv': '🎬',
    '.webm': '🎬', '.flv': '🎬', '.wmv': '🎬',

    // Audio
    '.mp3': '🎵', '.wav': '🎵', '.flac': '🎵', '.m4a': '🎵',
    '.ogg': '🎵', '.aac': '🎵', '.wma': '🎵',

    // Documents
    '.pdf': '📄', '.doc': '📄', '.docx': '📄', '.txt': '📄',
    '.rtf': '📄', '.odt': '📄', '.pages': '📄',

    // Spreadsheets
    '.xls': '📊', '.xlsx': '📊', '.csv': '📊', '.numbers': '📊',

    // Presentations
    '.ppt': '📽️', '.pptx': '📽️', '.key': '📽️',

    // Archives
    '.zip': '📦', '.rar': '📦', '.7z': '📦', '.tar': '📦',
    '.gz': '📦', '.bz2': '📦', '.xz': '📦',

    // Code
    '.js': '💻', '.ts': '💻', '.jsx': '💻', '.tsx': '💻',
    '.py': '💻', '.java': '💻', '.html': '💻', '.css': '💻',
    '.json': '💻', '.xml': '💻', '.yaml': '💻', '.yml': '💻',
    '.md': '💻', '.sql': '💻', '.sh': '💻', '.go': '💻',
    '.rs': '💻', '.cpp': '💻', '.c': '💻', '.h': '💻',

    // Design
    '.psd': '🎨', '.ai': '🎨', '.sketch': '🎨', '.fig': '🎨',
    '.xd': '🎨', '.indd': '🎨',
  };

  return iconMap[ext] || '📎';
}

export function getMimeType(filename: string): string {
  const ext = getFileExtension(filename).toLowerCase();

  const mimeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
  };

  return mimeMap[ext] || 'application/octet-stream';
}
