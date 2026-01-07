'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { OnlineMember } from '@/lib/stores/presence-store';

interface RadarMemberBubbleProps {
  member: OnlineMember;
  position: { x: number; y: number };
  onClick: () => void;
  disabled: boolean;
  isPending?: boolean;
}

export function RadarMemberBubble({
  member,
  position,
  onClick,
  disabled,
  isPending,
}: RadarMemberBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="absolute z-10"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <motion.button
        onClick={onClick}
        disabled={disabled && !isPending}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'relative flex items-center justify-center rounded-full',
          'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16',
          'backdrop-blur-sm',
          'border-2 transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
          isPending
            ? 'border-orange-400 bg-orange-500/20'
            : 'border-primary/40 bg-primary/20 hover:border-primary hover:bg-primary/30',
          disabled && !isPending && 'opacity-50 cursor-not-allowed'
        )}
      >
        {/* Pulsing glow effect */}
        <motion.div
          className={cn(
            'absolute inset-0 rounded-full',
            isPending ? 'bg-orange-400/30' : 'bg-primary/30'
          )}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.1, 0.4],
          }}
          transition={{
            duration: isPending ? 1 : 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Avatar with initials */}
        <span className="relative z-10 text-base sm:text-lg md:text-xl font-semibold text-primary-foreground">
          {member.name.charAt(0).toUpperCase()}
        </span>

        {/* Online indicator dot */}
        <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 sm:h-4 sm:w-4">
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              isPending ? 'bg-orange-400' : 'bg-green-400'
            )}
          />
          <span
            className={cn(
              'relative inline-flex rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-background',
              isPending ? 'bg-orange-500' : 'bg-green-500'
            )}
          />
        </span>
      </motion.button>

      {/* Hover tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="bg-popover text-popover-foreground px-3 py-2 rounded-lg shadow-lg border whitespace-nowrap">
              <p className="font-medium text-sm">{member.name}</p>
              <p className="text-xs text-muted-foreground">{member.email}</p>
              {isPending ? (
                <p className="text-xs text-orange-500 mt-1">Request pending...</p>
              ) : !disabled ? (
                <p className="text-xs text-primary mt-1">Click to connect</p>
              ) : null}
            </div>
            {/* Tooltip arrow */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-popover border-l border-t rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
