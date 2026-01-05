'use client';

import { useState, useEffect } from 'react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { WifiOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true);
      setIsDismissed(false);
    } else {
      // Keep showing briefly when coming back online
      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!showBanner || isDismissed) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] px-4 py-3 flex items-center justify-between transition-colors duration-300 ${
        isOnline
          ? 'bg-green-50 border-b border-green-200 text-green-800'
          : 'bg-orange-50 border-b border-orange-200 text-orange-800'
      }`}
    >
      <div className="flex items-center gap-3">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">
          {isOnline
            ? "You're back online!"
            : "You're offline. Some features may not work."}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={() => setIsDismissed(true)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
