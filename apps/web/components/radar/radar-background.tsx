'use client';

import { motion } from 'framer-motion';

interface RadarBackgroundProps {
  size: number;
}

export function RadarBackground({ size }: RadarBackgroundProps) {
  const center = size / 2;
  const maxRadius = center - 8;
  const rings = [0.25, 0.5, 0.75, 1.0];

  return (
    <>
      {/* CSS for sweep rotation - more reliable than Framer Motion for SVG */}
      <style jsx>{`
        @keyframes sweep-rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .sweep-line {
          transform-origin: center center;
          animation: sweep-rotate 4s linear infinite;
        }
      `}</style>

      <svg
        width={size}
        height={size}
        className="absolute inset-0"
        viewBox={`0 0 ${size} ${size}`}
      >
        <defs>
          {/* Sweep cone gradient */}
          <linearGradient id="sweepConeGradient" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>

          {/* Sweep line gradient */}
          <linearGradient id="sweepLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="1" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
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
            className="stroke-primary/20"
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
            fill="none"
            className="stroke-primary"
            strokeWidth="1.5"
            initial={{ r: 0, opacity: 0.5 }}
            animate={{
              r: maxRadius,
              opacity: 0,
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 1,
              ease: 'easeOut',
            }}
          />
        ))}

        {/* Rotating sweep group - using CSS animation */}
        <g className="sweep-line">
          {/* Sweep cone (30 degree arc) */}
          <path
            d={`
              M ${center} ${center}
              L ${center + maxRadius} ${center}
              A ${maxRadius} ${maxRadius} 0 0 0
              ${center + maxRadius * Math.cos(-Math.PI / 6)}
              ${center + maxRadius * Math.sin(-Math.PI / 6)}
              Z
            `}
            fill="url(#sweepConeGradient)"
          />

          {/* Main sweep line */}
          <line
            x1={center}
            y1={center}
            x2={center + maxRadius}
            y2={center}
            stroke="url(#sweepLineGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            filter="url(#glow)"
          />

          {/* Tip dot */}
          <circle
            cx={center + maxRadius - 4}
            cy={center}
            r="3"
            className="fill-primary"
            filter="url(#glow)"
          />
        </g>

        {/* Center dot */}
        <circle
          cx={center}
          cy={center}
          r="5"
          className="fill-primary"
          filter="url(#glow)"
        />

        {/* Pulsing center ring */}
        <motion.circle
          cx={center}
          cy={center}
          fill="none"
          className="stroke-primary/50"
          strokeWidth="2"
          initial={{ r: 8 }}
          animate={{
            r: [8, 16, 8],
            opacity: [0.5, 0.2, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </svg>
    </>
  );
}
