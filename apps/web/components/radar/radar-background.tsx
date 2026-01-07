'use client';

import { motion } from 'framer-motion';

interface RadarBackgroundProps {
  size: number;
}

export function RadarBackground({ size }: RadarBackgroundProps) {
  const center = size / 2;
  const maxRadius = center - 8;
  const rings = [0.25, 0.5, 0.75, 1.0]; // Static ring positions

  return (
    <svg
      width={size}
      height={size}
      className="absolute inset-0"
      viewBox={`0 0 ${size} ${size}`}
    >
      <defs>
        {/* Gradient for expanding ping circles */}
        <radialGradient id="pingGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          <stop offset="70%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </radialGradient>

        {/* Sweep line gradient */}
        <linearGradient id="sweepGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
        </linearGradient>

        {/* Glow filter */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background circle */}
      <circle
        cx={center}
        cy={center}
        r={maxRadius}
        className="fill-background/90 stroke-primary/20"
        strokeWidth="2"
      />

      {/* Static concentric rings */}
      {rings.map((ratio, i) => (
        <circle
          key={`static-${i}`}
          cx={center}
          cy={center}
          r={maxRadius * ratio}
          fill="none"
          className="stroke-primary/15"
          strokeWidth="1"
        />
      ))}

      {/* Cross hairs */}
      <line
        x1={center}
        y1={center - maxRadius}
        x2={center}
        y2={center + maxRadius}
        className="stroke-primary/10"
        strokeWidth="1"
      />
      <line
        x1={center - maxRadius}
        y1={center}
        x2={center + maxRadius}
        y2={center}
        className="stroke-primary/10"
        strokeWidth="1"
      />

      {/* Animated expanding ping circles */}
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={`ping-${i}`}
          cx={center}
          cy={center}
          r={10}
          fill="none"
          className="stroke-primary/40"
          strokeWidth="2"
          initial={{ r: 10, opacity: 0.6 }}
          animate={{
            r: maxRadius,
            opacity: 0,
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 1, // Stagger each circle by 1 second
            ease: 'easeOut',
          }}
        />
      ))}

      {/* Rotating sweep line */}
      <g style={{ transformOrigin: `${center}px ${center}px` }}>
        <motion.g
          animate={{ rotate: 360 }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ transformOrigin: `${center}px ${center}px` }}
        >
          {/* Sweep cone/trail */}
          <path
            d={`
              M ${center} ${center}
              L ${center + maxRadius} ${center}
              A ${maxRadius} ${maxRadius} 0 0 1
              ${center + maxRadius * Math.cos(Math.PI / 6)}
              ${center - maxRadius * Math.sin(Math.PI / 6)}
              Z
            `}
            fill="url(#pingGradient)"
            className="opacity-40"
          />

          {/* Main sweep line */}
          <line
            x1={center}
            y1={center}
            x2={center + maxRadius}
            y2={center}
            stroke="url(#sweepGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            filter="url(#glow)"
          />

          {/* Sweep line tip dot */}
          <circle
            cx={center + maxRadius - 6}
            cy={center}
            r="4"
            className="fill-primary"
            filter="url(#glow)"
          />
        </motion.g>
      </g>

      {/* Center dot */}
      <circle
        cx={center}
        cy={center}
        r="6"
        className="fill-primary/60"
        filter="url(#glow)"
      />

      {/* Pulsing center ring */}
      <motion.circle
        cx={center}
        cy={center}
        r={12}
        fill="none"
        className="stroke-primary/40"
        strokeWidth="2"
        animate={{
          r: [12, 20, 12],
          opacity: [0.4, 0.1, 0.4],
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
