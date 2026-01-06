'use client';

import { useCallback, useEffect, useState } from 'react';

type NotificationType = 'peer-connected' | 'peer-disconnected' | 'message' | 'file-received' | 'transfer-complete';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
}

const NOTIFICATION_CONFIGS: Record<NotificationType, (data?: any) => NotificationOptions> = {
  'peer-connected': () => ({
    title: 'Peer Connected',
    body: 'Your peer has joined the room. You can start sharing!',
    icon: '/icons/connected.png',
    tag: 'peer-status',
  }),
  'peer-disconnected': () => ({
    title: 'Peer Disconnected',
    body: 'Your peer has left the room.',
    icon: '/icons/disconnected.png',
    tag: 'peer-status',
  }),
  'message': (data) => ({
    title: 'New Message',
    body: data?.preview || 'You received a new message',
    icon: '/icons/message.png',
    tag: 'message',
  }),
  'file-received': (data) => ({
    title: 'File Received',
    body: `${data?.fileName || 'A file'} is ready to download`,
    icon: '/icons/file.png',
    tag: `file-${data?.fileId}`,
    requireInteraction: true,
  }),
  'transfer-complete': (data) => ({
    title: 'Transfer Complete',
    body: `${data?.fileName || 'File'} has been sent successfully`,
    icon: '/icons/success.png',
    tag: `transfer-${data?.fileId}`,
  }),
};

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    // Check if notifications are supported
    const supported = 'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);

      // Load saved preference
      const savedPreference = localStorage.getItem('notifications-enabled');
      if (savedPreference !== null) {
        setIsEnabled(savedPreference === 'true');
      }
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch {
      return false;
    }
  }, [isSupported]);

  const toggleEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    localStorage.setItem('notifications-enabled', String(enabled));
  }, []);

  const showNotification = useCallback(
    async (type: NotificationType, data?: any) => {
      // Check if we should show notification
      if (!isSupported || !isEnabled || permission !== 'granted') {
        return null;
      }

      // Don't show if document is visible (user is looking at the page)
      if (document.visibilityState === 'visible') {
        return null;
      }

      const config = NOTIFICATION_CONFIGS[type](data);

      try {
        const notification = new Notification(config.title, {
          body: config.body,
          icon: config.icon || '/icon-192.png',
          badge: '/icon-192.png',
          tag: config.tag,
          requireInteraction: config.requireInteraction,
          silent: false,
        });

        // Auto close after 5 seconds unless requireInteraction
        if (!config.requireInteraction) {
          setTimeout(() => notification.close(), 5000);
        }

        // Handle click - focus the window
        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        return notification;
      } catch (error) {
        console.error('Failed to show notification:', error);
        return null;
      }
    },
    [isSupported, isEnabled, permission]
  );

  // Play notification sound
  const playSound = useCallback((type: 'message' | 'success' | 'error' = 'message') => {
    try {
      const audio = new Audio(`/sounds/${type}.mp3`);
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Ignore errors - browser may block autoplay
      });
    } catch {
      // Ignore errors
    }
  }, []);

  return {
    isSupported,
    isEnabled,
    permission,
    requestPermission,
    toggleEnabled,
    showNotification,
    playSound,
  };
}
