'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { RadarBackground } from './radar-background';
import { RadarMemberBubble } from './radar-member-bubble';
import { useRadarPositions } from './use-radar-positions';
import { Users } from 'lucide-react';
import type { OnlineMember } from '@/lib/stores/presence-store';

interface RadarCanvasProps {
  members: OnlineMember[];
  onMemberClick: (member: OnlineMember) => void;
  disabled: boolean;
  pendingMemberId?: string;
}

export function RadarCanvas({
  members,
  onMemberClick,
  disabled,
  pendingMemberId,
}: RadarCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(400);

  // Generate positions for members
  const positions = useRadarPositions(members);

  // Responsive sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        // Responsive sizes: max 500px, scales down on smaller screens
        let newSize: number;
        if (containerWidth >= 600) {
          newSize = 500;
        } else if (containerWidth >= 400) {
          newSize = 400;
        } else {
          newSize = Math.max(containerWidth - 32, 280);
        }
        setSize(newSize);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full flex justify-center"
    >
      <div
        className="relative"
        style={{ width: size, height: size }}
      >
        {/* SVG Background with rings and sweep line */}
        <RadarBackground size={size} />

        {/* Member Bubbles */}
        <AnimatePresence mode="popLayout">
          {members.map((member) => {
            const pos = positions.get(member.id);
            if (!pos) return null;

            return (
              <RadarMemberBubble
                key={member.socketId}
                member={member}
                position={pos}
                onClick={() => onMemberClick(member)}
                disabled={disabled}
                isPending={pendingMemberId === member.id}
              />
            );
          })}
        </AnimatePresence>

        {/* Empty state */}
        {members.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-8">
              <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No members online</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Wait for team members to join
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
