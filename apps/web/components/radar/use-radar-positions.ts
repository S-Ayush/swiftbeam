'use client';

import { useMemo } from 'react';
import type { OnlineMember } from '@/lib/stores/presence-store';

export interface RadarPosition {
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
}

/**
 * Generate random radar positions for members using polar coordinates.
 * Positions are memoized based on member IDs to prevent jumpy re-renders.
 */
export function useRadarPositions(
  members: OnlineMember[]
): Map<string, RadarPosition> {
  return useMemo(() => {
    const positions = new Map<string, RadarPosition>();
    const total = members.length;

    members.forEach((member, index) => {
      // Use polar coordinates for natural radar distribution
      const minRadius = 0.25; // Don't place in center 25%
      const maxRadius = 0.85; // Keep within 85% of radius

      // Distribute angle based on index with jitter to avoid alignment
      const baseAngle = (index / Math.max(total, 1)) * Math.PI * 2;
      // Use member ID for consistent jitter per member
      const jitterSeed = hashString(member.id);
      const angleJitter = ((jitterSeed % 100) / 100 - 0.5) * (Math.PI / 3);
      const angle = baseAngle + angleJitter;

      // Random radius with seed based on member ID for consistency
      const radiusSeed = hashString(member.id + 'radius');
      const radiusRandom = (radiusSeed % 100) / 100;
      const radius = minRadius + radiusRandom * (maxRadius - minRadius);

      // Convert to Cartesian (centered at 50%, 50%)
      const x = 50 + radius * 45 * Math.cos(angle);
      const y = 50 + radius * 45 * Math.sin(angle);

      positions.set(member.id, { x, y });
    });

    return positions;
  }, [members.map((m) => m.id).join(',')]);
}

/**
 * Simple string hash function for consistent random-like values
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
