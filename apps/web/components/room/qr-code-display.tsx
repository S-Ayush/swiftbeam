'use client';

import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { Smartphone, QrCode } from 'lucide-react';

interface QRCodeDisplayProps {
  code: string;
  size?: number;
  className?: string;
  showInstructions?: boolean;
}

export function QRCodeDisplay({
  code,
  size = 180,
  className,
  showInstructions = true,
}: QRCodeDisplayProps) {
  const roomUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/room/${code}`
    : `https://swiftbeam.app/room/${code}`;

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {/* QR Code Container */}
      <div className="relative group">
        {/* Animated border gradient */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary via-primary/50 to-primary rounded-2xl opacity-20 group-hover:opacity-40 blur transition-opacity duration-500" />

        {/* QR Code wrapper */}
        <div className="relative bg-white p-4 rounded-xl shadow-lg">
          <QRCodeSVG
            value={roomUrl}
            size={size}
            level="M"
            includeMargin={false}
            bgColor="#ffffff"
            fgColor="#000000"
            imageSettings={{
              src: '',
              height: 0,
              width: 0,
              excavate: false,
            }}
          />
        </div>

        {/* Corner decorations */}
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary rounded-tl-lg" />
        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary rounded-tr-lg" />
        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary rounded-bl-lg" />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary rounded-br-lg" />
      </div>

      {/* Instructions */}
      {showInstructions && (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Smartphone className="h-4 w-4" />
          <span>Scan with your phone camera</span>
        </div>
      )}
    </div>
  );
}

// Compact version for inline use
export function QRCodeCompact({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  const roomUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/room/${code}`
    : `https://swiftbeam.app/room/${code}`;

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <div className="bg-white p-1.5 rounded-md shadow-sm">
        <QRCodeSVG
          value={roomUrl}
          size={48}
          level="L"
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-medium">Scan to join</span>
        <span className="text-xs text-muted-foreground font-mono">{code}</span>
      </div>
    </div>
  );
}

// Icon button that shows QR on hover/click (for compact spaces)
export function QRCodeTrigger({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  return (
    <div className={cn('relative group', className)}>
      <button className="p-2 rounded-lg hover:bg-muted transition-colors">
        <QrCode className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
      </button>

      {/* Hover popup */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="bg-popover border rounded-xl p-3 shadow-xl">
          <QRCodeDisplay code={code} size={120} showInstructions={false} />
          <p className="text-xs text-center text-muted-foreground mt-2">
            Scan to join
          </p>
        </div>
        {/* Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
          <div className="w-3 h-3 bg-popover border-b border-r rotate-45 -translate-y-1.5" />
        </div>
      </div>
    </div>
  );
}
