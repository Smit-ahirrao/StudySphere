import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FolderProps {
  /** Main color of the folder */
  color?: string;
  /** Scale factor for the folder */
  size?: number;
  /** Array of React elements to display as "papers" inside the folder */
  items?: React.ReactNode[];
  /** Optional CSS class for the wrapper */
  className?: string;
  /** Title or label to display on the folder */
  label?: string;
  /** Callback when the folder is clicked */
  onClick?: () => void;
  /** Controlled open state */
  isOpen?: boolean;
  /** Whether the folder is selected/active */
  isActive?: boolean;
}

const darkenColor = (hex: string, percent: number): string => {
  let color = hex.startsWith('#') ? hex.slice(1) : hex;
  if (color.length === 3) {
    color = color.split('').map(c => c + c).join('');
  }
  const num = parseInt(color, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent))));
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent))));
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent))));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

export function InteractiveFolder({ 
  color = '#5227FF', 
  size = 1, 
  items = [], 
  className = '',
  label,
  onClick,
  isOpen: controlledIsOpen,
  isActive = false
}: FolderProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : isHovered;
  
  const [hoveredItemIndex, setHoveredItemIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const maxVisibleItems = 3;
  const displayItems = items.slice(0, maxVisibleItems);
  while (displayItems.length < maxVisibleItems) {
    displayItems.push(null);
  }

  const folderBackColor = darkenColor(color, 0.12);
  const paperColors = [
    darkenColor('#ffffff', 0.1),
    darkenColor('#ffffff', 0.05),
    '#ffffff'
  ];

  const handleMouseMove = (e: React.MouseEvent, index: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - (rect.left + rect.width / 2)) * 0.2;
    const y = (e.clientY - (rect.top + rect.height / 2)) * 0.2;
    setMousePos({ x, y });
    setHoveredItemIndex(index);
  };

  const handleMouseLeaveItem = () => {
    setMousePos({ x: 0, y: 0 });
    setHoveredItemIndex(null);
  };

  const getPaperTransform = (index: number) => {
    if (!isOpen) return { x: '-50%', y: '10%', rotate: 0, opacity: 0 };
    
    const baseTransforms = [
      { x: '-120%', y: '-75%', rotate: -15 },
      { x: '10%', y: '-75%', rotate: 15 },
      { x: '-50%', y: '-105%', rotate: 5 }
    ];

    const base = baseTransforms[index] || { x: '-50%', y: '-50%', rotate: 0 };
    
    if (hoveredItemIndex === index) {
      return {
        x: `calc(${base.x} + ${mousePos.x}px)`,
        y: `calc(${base.y} + ${mousePos.y}px)`,
        rotate: base.rotate,
        scale: 1.1,
        opacity: 1
      };
    }
    
    return { ...base, opacity: 1 };
  };

  return (
    <div 
      className={`relative flex items-center justify-center transition-all duration-300 ${className} ${isActive ? 'scale-105' : ''}`}
      style={{ 
        width: 140 * size, 
        height: 120 * size,
        paddingTop: 40 * size // Add space for papers to drift into
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative cursor-pointer group select-none"
        onClick={onClick}
      >
        {/* Active Glow */}
        {isActive && (
          <div 
            className="absolute -inset-4 blur-2xl opacity-20 rounded-full transition-all duration-500"
            style={{ backgroundColor: color }}
          />
        )}

        {/* Folder Back */}
        <div
          className="relative w-[110px] h-[85px] transition-all duration-500 rounded-tr-[12px] rounded-br-[12px] rounded-bl-[12px]"
          style={{ 
            backgroundColor: folderBackColor,
            boxShadow: isOpen ? '0 10px 30px -5px rgba(0,0,0,0.1)' : '0 4px 12px -2px rgba(0,0,0,0.05)',
            transform: `scale(${size})`
          }}
        >
          {/* Tab */}
          <div
            className="absolute bottom-full left-0 w-[35px] h-[12px] rounded-t-[6px]"
            style={{ backgroundColor: folderBackColor }}
          />

          {/* Papers */}
          {displayItems.map((item, i) => (
            <motion.div
              key={i}
              onMouseMove={(e) => handleMouseMove(e, i)}
              onMouseLeave={handleMouseLeaveItem}
              initial={false}
              animate={getPaperTransform(i)}
              transition={{ 
                type: 'spring', 
                stiffness: 260, 
                damping: 20,
                mass: 1 
              }}
              className="absolute left-1/2 flex items-center justify-center overflow-hidden"
              style={{
                zIndex: 20,
                backgroundColor: paperColors[i],
                borderRadius: '8px',
                width: i === 0 ? '75px' : i === 1 ? '85px' : '95px',
                height: i === 0 ? '65px' : i === 1 ? '70px' : '75px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.03)'
              }}
            >
              {item || (
                <div className="w-full h-full p-2 flex flex-col gap-1.5 opacity-20">
                  <div className="w-3/4 h-1 bg-current rounded-full" />
                  <div className="w-1/2 h-1 bg-current rounded-full" />
                  <div className="w-2/3 h-1 bg-current rounded-full" />
                </div>
              )}
            </motion.div>
          ))}

          {/* Folder Front Flap - Left Side */}
          <motion.div
            animate={{
              skewX: isOpen ? 15 : 0,
              scaleY: isOpen ? 0.6 : 1,
              translateY: isOpen ? 4 : 0
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute inset-0 z-30 origin-bottom"
            style={{
              backgroundColor: color,
              borderRadius: '6px 12px 12px 12px',
              clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)'
            }}
          />

          {/* Folder Front Flap - Right Side */}
          <motion.div
            animate={{
              skewX: isOpen ? -15 : 0,
              scaleY: isOpen ? 0.6 : 1,
              translateY: isOpen ? 4 : 0
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute inset-0 z-30 origin-bottom"
            style={{
              backgroundColor: color,
              borderRadius: '6px 12px 12px 12px',
              clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)'
            }}
          >
             {label && !isOpen && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-[10px] font-bold tracking-wider uppercase whitespace-nowrap px-2">
                {label}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
