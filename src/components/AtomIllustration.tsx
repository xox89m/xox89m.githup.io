import React from 'react';
import { PeriodicElement } from '../types';
import { CATEGORY_INFO } from '../data/elements';

interface Props {
  element: PeriodicElement;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

/**
 * Calculates electron shell counts based on the 2n^2 rule and standard subshell filling
 */
function getElectronShells(atomicNumber: number): number[] {
  // Shell capacities for elements 1-118
  const maxPerShell = [2, 8, 18, 32, 32, 18, 8];
  const shells: number[] = [];
  let remaining = atomicNumber;

  // Simple standard shell distribution approximation for educational display
  for (let i = 0; i < maxPerShell.length; i++) {
    if (remaining <= 0) break;
    const capacity = maxPerShell[i];
    if (remaining <= capacity) {
      shells.push(remaining);
      break;
    } else {
      shells.push(capacity);
      remaining -= capacity;
    }
  }

  // Refine known light elements for precise textbook shells
  if (atomicNumber <= 20) {
    if (atomicNumber === 1) return [1];
    if (atomicNumber === 2) return [2];
    if (atomicNumber <= 10) return [2, atomicNumber - 2];
    if (atomicNumber <= 18) return [2, 8, atomicNumber - 10];
    if (atomicNumber === 19) return [2, 8, 8, 1]; // K
    if (atomicNumber === 20) return [2, 8, 8, 2]; // Ca
  }

  return shells;
}

export const AtomIllustration: React.FC<Props> = ({
  element,
  size = 'md',
  showDetails = true
}) => {
  const cat = CATEGORY_INFO[element.category] || CATEGORY_INFO['nonmetal'];
  const shells = getElectronShells(element.atomicNumber);
  const shellCount = shells.length;

  const dimension = size === 'sm' ? 100 : size === 'lg' ? 220 : 160;
  const center = dimension / 2;
  const nucleusRadius = size === 'sm' ? 14 : size === 'lg' ? 26 : 20;

  // Spacing for orbital rings
  const maxOrbitRadius = center - (size === 'sm' ? 8 : 14);
  const orbitStep = (maxOrbitRadius - nucleusRadius - 6) / Math.max(1, shellCount);

  // Category glow colors for dark mode high visibility
  const glowColors: Record<string, { ring: string; electron: string; nucleus: string }> = {
    'alkali-metal': { ring: '#f43f5e', electron: '#fda4af', nucleus: '#e11d48' },
    'alkaline-earth-metal': { ring: '#f59e0b', electron: '#fde68a', nucleus: '#d97706' },
    'transition-metal': { ring: '#3b82f6', electron: '#bfdbfe', nucleus: '#2563eb' },
    'post-transition-metal': { ring: '#14b8a6', electron: '#99f6e4', nucleus: '#0d9488' },
    'metalloid': { ring: '#10b981', electron: '#a7f3d0', nucleus: '#059669' },
    'nonmetal': { ring: '#84cc16', electron: '#d9f99d', nucleus: '#65a30d' },
    'halogen': { ring: '#a855f7', electron: '#e9d5ff', nucleus: '#9333ea' },
    'noble-gas': { ring: '#06b6d4', electron: '#a5f3fc', nucleus: '#0891b2' }
  };

  const colors = glowColors[element.category] || glowColors['nonmetal'];

  return (
    <div className="flex flex-col items-center justify-center select-none">
      {/* Visual SVG Atom Orbit Model with Dark Mode Glow */}
      <div className="relative flex items-center justify-center p-2 rounded-2xl bg-slate-900/90 dark:bg-black/90 border-2 border-slate-700 dark:border-zinc-700 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
        <svg
          width={dimension}
          height={dimension}
          viewBox={`0 0 ${dimension} ${dimension}`}
          className="overflow-visible"
        >
          <defs>
            <radialGradient id={`nucleus-grad-${element.symbol}`} cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="40%" stopColor={colors.ring} stopOpacity="1" />
              <stop offset="100%" stopColor={colors.nucleus} stopOpacity="1" />
            </radialGradient>
            <filter id={`glow-${element.symbol}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Electron Orbits */}
          {shells.map((electronCount, sIdx) => {
            const r = nucleusRadius + 8 + (sIdx + 1) * orbitStep;
            return (
              <g key={`orbit-${sIdx}`}>
                {/* Orbit Ring */}
                <circle
                  cx={center}
                  cy={center}
                  r={r}
                  fill="none"
                  stroke={colors.ring}
                  strokeWidth={size === 'sm' ? 1 : 1.5}
                  strokeDasharray="3 3"
                  strokeOpacity={0.65}
                  className="transition-all duration-300"
                />

                {/* Electrons orbiting on this ring */}
                {Array.from({ length: Math.min(electronCount, 12) }).map((_, eIdx) => {
                  const angle = (2 * Math.PI * eIdx) / Math.min(electronCount, 12);
                  const ex = center + r * Math.cos(angle);
                  const ey = center + r * Math.sin(angle);
                  const eRadius = size === 'sm' ? 2 : size === 'lg' ? 4 : 3;

                  return (
                    <circle
                      key={`electron-${sIdx}-${eIdx}`}
                      cx={ex}
                      cy={ey}
                      r={eRadius}
                      fill={colors.electron}
                      stroke="#ffffff"
                      strokeWidth={1}
                      filter={`url(#glow-${element.symbol})`}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Central Nucleus with Glow */}
          <circle
            cx={center}
            cy={center}
            r={nucleusRadius}
            fill={`url(#nucleus-grad-${element.symbol})`}
            filter={`url(#glow-${element.symbol})`}
            className="animate-pulse"
          />

          {/* Symbol in Center */}
          <text
            cx={center}
            cy={center}
            x={center}
            y={center + (size === 'sm' ? 4 : 6)}
            textAnchor="middle"
            fill="#ffffff"
            fontWeight="900"
            fontSize={size === 'sm' ? 12 : size === 'lg' ? 18 : 14}
            fontFamily="'Sarabun', 'Mali', sans-serif"
            className="pointer-events-none drop-shadow-md"
          >
            {element.symbol}
          </text>
        </svg>

        {/* Floating Atomic Number Badge */}
        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[10px] font-black bg-white/10 text-white border border-white/20 backdrop-blur-xs">
          Z = {element.atomicNumber}
        </span>

        {/* State of matter tag */}
        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-white/10 text-white border border-white/20">
          {element.period <= 2 && element.group >= 17 ? 'แก๊ส' : element.symbol === 'Hg' || element.symbol === 'Br' ? 'ของเหลว' : 'ของแข็ง'}
        </span>
      </div>

      {/* Electron Configuration Breakdown */}
      {showDetails && (
        <div className="mt-2 text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-300 dark:text-slate-200">
            <span>อิเล็กตรอนรอบวง:</span>
            <span className="text-amber-300 font-black">
              [{shells.join(' · ')}]
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
