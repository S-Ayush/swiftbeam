'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'unknown';

export interface ConnectionStats {
  rtt: number | null; // Round-trip time in ms
  throughput: number | null; // Bytes per second
  quality: ConnectionQuality;
  isCollecting: boolean;
}

interface UseConnectionStatsOptions {
  peerConnection: RTCPeerConnection | null;
  enabled?: boolean;
  interval?: number; // Collection interval in ms
}

// Quality thresholds
const QUALITY_THRESHOLDS = {
  excellent: { maxRtt: 100, minThroughput: 5 * 1024 * 1024 }, // < 100ms, > 5 MB/s
  good: { maxRtt: 300, minThroughput: 1 * 1024 * 1024 }, // < 300ms, > 1 MB/s
};

export function useConnectionStats({
  peerConnection,
  enabled = true,
  interval = 1000,
}: UseConnectionStatsOptions): ConnectionStats {
  const [stats, setStats] = useState<ConnectionStats>({
    rtt: null,
    throughput: null,
    quality: 'unknown',
    isCollecting: false,
  });

  const prevBytesRef = useRef<{ sent: number; received: number; timestamp: number } | null>(null);
  const collectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialDelayRef = useRef<NodeJS.Timeout | null>(null);

  const calculateQuality = useCallback((rtt: number | null, throughput: number | null): ConnectionQuality => {
    if (rtt === null) return 'unknown';

    // If RTT is very low, it's excellent
    if (rtt < QUALITY_THRESHOLDS.excellent.maxRtt) {
      if (throughput === null || throughput >= QUALITY_THRESHOLDS.excellent.minThroughput) {
        return 'excellent';
      }
    }

    // If RTT is moderate, it's good
    if (rtt < QUALITY_THRESHOLDS.good.maxRtt) {
      if (throughput === null || throughput >= QUALITY_THRESHOLDS.good.minThroughput) {
        return 'good';
      }
    }

    // Otherwise it's poor
    return 'poor';
  }, []);

  const collectStats = useCallback(async () => {
    if (!peerConnection || peerConnection.connectionState !== 'connected') {
      return;
    }

    try {
      const report = await peerConnection.getStats();
      let rtt: number | null = null;
      let bytesSent = 0;
      let bytesReceived = 0;

      report.forEach((stat) => {
        // Get RTT from candidate-pair
        if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
          if (stat.currentRoundTripTime !== undefined) {
            rtt = stat.currentRoundTripTime * 1000; // Convert to ms
          }
        }

        // Get bytes from data-channel or transport
        if (stat.type === 'data-channel') {
          bytesSent += stat.bytesSent || 0;
          bytesReceived += stat.bytesReceived || 0;
        }

        if (stat.type === 'transport') {
          bytesSent += stat.bytesSent || 0;
          bytesReceived += stat.bytesReceived || 0;
        }
      });

      // Calculate throughput
      let throughput: number | null = null;
      const now = Date.now();

      if (prevBytesRef.current) {
        const timeDelta = (now - prevBytesRef.current.timestamp) / 1000; // seconds
        if (timeDelta > 0) {
          const bytesDelta =
            (bytesSent - prevBytesRef.current.sent) +
            (bytesReceived - prevBytesRef.current.received);
          throughput = bytesDelta / timeDelta;
        }
      }

      prevBytesRef.current = { sent: bytesSent, received: bytesReceived, timestamp: now };

      const quality = calculateQuality(rtt, throughput);

      setStats({
        rtt: rtt !== null ? Math.round(rtt) : null,
        throughput,
        quality,
        isCollecting: true,
      });
    } catch (error) {
      console.error('Failed to collect connection stats:', error);
    }
  }, [peerConnection, calculateQuality]);

  useEffect(() => {
    if (!enabled || !peerConnection) {
      setStats({
        rtt: null,
        throughput: null,
        quality: 'unknown',
        isCollecting: false,
      });
      prevBytesRef.current = null;
      return;
    }

    // Wait 2 seconds before starting collection (stats not available immediately)
    initialDelayRef.current = setTimeout(() => {
      // Start collecting
      const collect = () => {
        collectStats();
        collectTimeoutRef.current = setTimeout(collect, interval);
      };

      collect();
    }, 2000);

    return () => {
      if (initialDelayRef.current) {
        clearTimeout(initialDelayRef.current);
      }
      if (collectTimeoutRef.current) {
        clearTimeout(collectTimeoutRef.current);
      }
      prevBytesRef.current = null;
    };
  }, [enabled, peerConnection, interval, collectStats]);

  return stats;
}

// Utility to format throughput for display
export function formatThroughput(bytesPerSecond: number | null): string {
  if (bytesPerSecond === null) return '--';

  if (bytesPerSecond >= 1024 * 1024) {
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
  }
  if (bytesPerSecond >= 1024) {
    return `${(bytesPerSecond / 1024).toFixed(0)} KB/s`;
  }
  return `${bytesPerSecond.toFixed(0)} B/s`;
}

// Utility to format RTT for display
export function formatRtt(rtt: number | null): string {
  if (rtt === null) return '--';
  return `${Math.round(rtt)} ms`;
}
