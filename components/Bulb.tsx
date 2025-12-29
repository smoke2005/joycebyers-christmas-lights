
import React, { useState, useEffect, useRef } from 'react';
import { BulbColor } from '../types';
import { audioService } from '../services/audioService';

interface BulbProps {
  color: BulbColor;
  isLit: boolean;
  char: string;
}

const Bulb: React.FC<BulbProps> = ({ color, isLit, char }) => {
  const [isSparking, setIsSparking] = useState(false);
  const sparkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const colorMap = {
    red: 'rgb(var(--c-red))',
    blue: 'rgb(var(--c-blue))',
    green: 'rgb(var(--c-green))',
    yellow: 'rgb(var(--c-yellow))',
    pink: 'rgb(var(--c-pink))',
  };

  const handleManualClick = () => {
    // Clear any existing timeout
    if (sparkTimeoutRef.current) clearTimeout(sparkTimeoutRef.current);
    
    // Play the manual interaction sound
    audioService.playManualBulbZap();
    
    // Trigger intense glow
    setIsSparking(true);
    
    // Reset spark after a short burst
    sparkTimeoutRef.current = setTimeout(() => {
      setIsSparking(false);
    }, 400);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sparkTimeoutRef.current) clearTimeout(sparkTimeoutRef.current);
    };
  }, []);

  const effectiveLit = isLit || isSparking;
  const spillClass = effectiveLit ? `glow-spill-${color}` : '';
  const intensityClass = isSparking ? 'brightness-150 scale-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]' : '';

  return (
    <div 
      onClick={handleManualClick}
      className={`bulb-container flex flex-col items-center group select-none transition-all duration-300 cursor-pointer ${effectiveLit ? 'scale-105' : 'scale-100'} ${intensityClass}`}
    >
      <div className={`relative w-8 h-12 flex justify-center items-start ${spillClass} transition-all duration-150`}>
        <svg viewBox="0 0 40 60" className="w-full h-full overflow-visible">
          <defs>
            <radialGradient id={`glass-grad-${color}`} cx="40%" cy="30%" r="50%">
              <stop offset="0%" stopColor="white" stopOpacity={effectiveLit ? "0.6" : "0.1"} />
              <stop offset="60%" stopColor={colorMap[color]} stopOpacity={effectiveLit ? "0.7" : "0.3"} />
              <stop offset="100%" stopColor={colorMap[color]} stopOpacity={effectiveLit ? "0.9" : "0.5"} />
            </radialGradient>
            
            <filter id="flicker-filter">
               <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
            </filter>
          </defs>

          {/* Metal Base (Socket) */}
          <g transform="translate(10, 0)">
            <rect x="0" y="0" width="20" height="12" fill="#222" rx="1" />
            <path d="M0 3 H20 M0 6 H20 M0 9 H20" stroke="#444" strokeWidth="1" />
            <rect x="-2" y="10" width="24" height="4" fill="#1a2e1a" rx="1" />
          </g>

          {/* The Glass Bulb Body */}
          <path 
            className={`transition-all duration-300 ${effectiveLit ? 'bulb-lit' : ''}`}
            d="M20 14 C 10 14, 2 22, 2 35 C 2 48, 12 58, 20 58 C 28 58, 38 48, 38 35 C 38 22, 30 14, 20 14 Z" 
            fill={`url(#glass-grad-${color})`}
            stroke={effectiveLit ? "white" : "rgba(0,0,0,0.3)"}
            strokeWidth={effectiveLit ? "0.3" : "0.1"}
            fillOpacity={effectiveLit ? "1" : "0.6"}
          />

          {/* The Internal Filament */}
          {effectiveLit && (
            <g className="bulb-lit">
              <path 
                d="M16 45 Q 20 35, 24 45" 
                fill="none" 
                stroke="white" 
                strokeWidth={isSparking ? "2.5" : "1.2"} 
                strokeLinecap="round"
                strokeOpacity="0.8"
                style={{ filter: 'drop-shadow(0 0 1px white)' }}
              />
              <circle cx="20" cy="40" r={isSparking ? "4" : "2.5"} fill="white" fillOpacity="0.6" style={{ filter: 'blur(1.5px)' }} />
            </g>
          )}

          {/* Glass Highlight (Reflection) */}
          <path 
            d="M12 25 Q 15 20, 20 20" 
            fill="none" 
            stroke="white" 
            strokeOpacity={effectiveLit ? "0.4" : "0.2"} 
            strokeWidth="1.5" 
            strokeLinecap="round" 
          />
        </svg>

        {/* Dynamic Glow Aura */}
        {effectiveLit && (
          <div 
            className={`absolute inset-0 rounded-full blur-3xl transition-all duration-150 z-0 ${isSparking ? 'opacity-60 scale-150' : 'opacity-30 scale-125'}`}
            style={{ 
              backgroundColor: colorMap[color],
              boxShadow: `0 0 ${isSparking ? '40px 15px' : '25px 10px'} ${colorMap[color]}`
            }}
          />
        )}
      </div>

      <span className={`
        font-handwritten text-4xl mt-3 select-none transition-all duration-500
        ${effectiveLit 
            ? 'text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.7)] scale-105 rotate-[-1deg]' 
            : 'text-stone-800/60 dark:text-stone-500/30'
        }
        ${isSparking ? 'scale-125 !text-white' : ''}
      `}>
        {char}
      </span>
    </div>
  );
};

export default Bulb;
