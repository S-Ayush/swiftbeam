'use client';

import { motion } from 'framer-motion';

interface RadarBackgroundProps {
  size: number;
}

export function RadarBackground({ size }: RadarBackgroundProps) {
  const center = size / 2;
  const maxRadius = center - 8;
  const rings = [0.25, 0.5, 0.75, 1.0]; // Radius percentages

  return (
    <svg
      width={size}
      height={size}
      className="absolute inset-0"
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Sweep line gradient */}
        <linearGradient id="sweepGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          <stop offset="70%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
        </linearGradient>

        {/* Sweep trail gradient (cone effect) */}
        <linearGradient id="sweepTrail" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>

        {/* Glow filter for sweep line */}
        <filter id="sweepGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Outer glow for rings */}
        <filter id="ringGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background circle with subtle gradient */}
      <circle
        cx={center}
        cy={center}
        r={maxRadius}
        className="fill-background/80 stroke-border"
        strokeWidth="2"
      />

      {/* Concentric rings */}
      {rings.map((ratio, i) => (
        <circle
          key={i}
          cx={center}
          cy={center}
          r={maxRadius * ratio}
          fill="none"
          className="stroke-primary/20"
          strokeWidth="1"
          filter="url(#ringGlow)"
        />
      ))}

      {/* Cross hairs - vertical */}
      <line
        x1={center}
        y1={center - maxRadius}
        x2={center}
        y2={center + maxRadius}
        className="stroke-primary/10"
        strokeWidth="1"
      />

      {/* Cross hairs - horizontal */}
      <line
        x1={center - maxRadius}
        y1={center}
        x2={center + maxRadius}
        y2={center}
        className="stroke-primary/10"
        strokeWidth="1"
      />

      {/* Diagonal lines for extra detail */}
      <line
        x1={center - maxRadius * 0.7}
        y1={center - maxRadius * 0.7}
        x2={center + maxRadius * 0.7}
        y2={center + maxRadius * 0.7}
        className="stroke-primary/5"
        strokeWidth="1"
      />
      <line
        x1={center + maxRadius * 0.7}
        y1={center - maxRadius * 0.7}
        x2={center - maxRadius * 0.7}
        y2={center + maxRadius * 0.7}
        className="stroke-primary/5"
        strokeWidth="1"
      />

      {/* Animated sweep line group */}
      <motion.g
        animate={{ rotate: 360 }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{ originX: `${center}px`, originY: `${center}px` }}
      >
        {/* Sweep trail (cone/arc effect) */}
        <path
          d={`
            M ${center} ${center}
            L ${center + maxRadius} ${center}
            A ${maxRadius} ${maxRadius} 0 0 0
            ${center + maxRadius * Math.cos(-Math.PI * 0.12)}
            ${center + maxRadius * Math.sin(-Math.PI * 0.12)}
            Z
          `}
          className="fill-primary/10"
        />

        {/* Main sweep line */}
        <line
          x1={center}
          y1={center}
          x2={center + maxRadius}
          y2={center}
          stroke="url(#sweepGradient)"
          strokeWidth="2"
          filter="url(#sweepGlow)"
          strokeLinecap="round"
        />

        {/* Sweep line tip glow */}
        <circle
          cx={center + maxRadius - 4}
          cy={center}
          r="4"
          className="fill-primary/60"
          filter="url(#sweepGlow)"
        />
      </motion.g>

      {/* Center dot */}
      <circle
        cx={center}
        cy={center}
        r="4"
        className="fill-primary/40"
      />

      {/* Pulsing center ring */}
      <motion.circle
        cx={center}
        cy={center}
        r="8"
        fill="none"
        className="stroke-primary/30"
        strokeWidth="2"
        animate={{
          r: [8, 12, 8],
          opacity: [0.3, 0.1, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </svg>
  );
}
