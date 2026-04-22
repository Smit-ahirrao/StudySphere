import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { NodeSphere } from './NodeSphere';

// Helper to generate random box shadows for the parallax stars
const generateBoxShadows = (n: number, color: string) => {
  const shadows: string[] = [];
  for (let i = 0; i < n; i++) {
    const x = Math.floor(Math.random() * 2000);
    const y = Math.floor(Math.random() * 2000);
    shadows.push(`${x}px ${y}px ${color}`);
  }
  return shadows.join(', ');
};

// Generate static shadows outside render to keep them stable
const shadowsSmallLight = generateBoxShadows(700, '#0284c7'); // sky-600 for better visibility on light background
const shadowsMediumLight = generateBoxShadows(200, '#0284c7');
const shadowsBigLight = generateBoxShadows(100, '#0284c7');

const shadowsSmallDark = generateBoxShadows(700, '#FFFFFF');
const shadowsMediumDark = generateBoxShadows(200, '#FFFFFF');
const shadowsBigDark = generateBoxShadows(100, '#FFFFFF');

const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { data } = useData();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Extended the timer so the 3D sphere and stars can be fully appreciated
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onComplete, 600);
    }, 2800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const isDark = data.settings.theme === 'dark';
  const subtitle = 'Learn · Focus · Achieve';

  // Select shadows based on theme
  const shadowsSmall = isDark ? shadowsSmallDark : shadowsSmallLight;
  const shadowsMedium = isDark ? shadowsMediumDark : shadowsMediumLight;
  const shadowsBig = isDark ? shadowsBigDark : shadowsBigLight;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden select-none ${
        isDark ? 'bg-[#090A0F]' : 'bg-[#f8fafc]'
      }`}
    >
      {/* ── Custom Font & Star Animations ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@800;900&display=swap');
        
        @keyframes animStar {
          from { transform: translateY(0px); }
          to { transform: translateY(-2000px); }
        }
      `}</style>

      {/* ── Background Atmosphere & Parallax Stars ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="absolute inset-0"
      >
        {isDark ? (
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%)' }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at center, #ecfeff 0%, #f8fafc 100%)' }}
          />
        )}

        {/* Stars Layer 1 (Small) */}
        <div 
          className="absolute left-0 top-0 w-[1px] h-[1px] bg-transparent opacity-60 animate-[animStar_50s_linear_infinite]"
          style={{ boxShadow: shadowsSmall }}
        >
          <div className="absolute top-[2000px] w-[1px] h-[1px] bg-transparent" style={{ boxShadow: shadowsSmall }} />
        </div>

        {/* Stars Layer 2 (Medium) */}
        <div 
          className="absolute left-0 top-0 w-[2px] h-[2px] bg-transparent opacity-60 animate-[animStar_100s_linear_infinite]"
          style={{ boxShadow: shadowsMedium }}
        >
          <div className="absolute top-[2000px] w-[2px] h-[2px] bg-transparent" style={{ boxShadow: shadowsMedium }} />
        </div>

        {/* Stars Layer 3 (Big) */}
        <div 
          className="absolute left-0 top-0 w-[3px] h-[3px] bg-transparent opacity-60 animate-[animStar_150s_linear_infinite]"
          style={{ boxShadow: shadowsBig }}
        >
          <div className="absolute top-[2000px] w-[3px] h-[3px] bg-transparent" style={{ boxShadow: shadowsBig }} />
        </div>
      </motion.div>

      {/* ── 3D Node Sphere Container ── */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        {/* Glow behind the sphere */}
        <div className={`absolute w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] rounded-full blur-[100px] ${isDark ? 'bg-sky-500/20' : 'bg-sky-400/10'}`} />

        <div className="relative w-[300px] h-[300px] sm:w-[450px] sm:h-[450px]">
          <NodeSphere 
            radius={window.innerWidth < 640 ? 120 : 180} 
            nodeCount={160} 
            connectionDistance={window.innerWidth < 640 ? 45 : 70} 
            baseHue={195} 
            backgroundOpacity={0} 
          />
        </div>
      </motion.div>

      {/* ── Typography Overlay ── */}
      <div className="relative z-10 flex flex-col items-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.5,
            duration: 0.8,
            ease: [0.2, 0.8, 0.2, 1],
          }}
        >
          <h1 
            className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight"
            style={{
              fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
              color: isDark ? 'transparent' : '#0f172a',
              background: isDark 
                ? 'linear-gradient(180deg, #ffffff 0%, #bae6fd 100%)' 
                : 'none',
              WebkitBackgroundClip: isDark ? 'text' : 'unset',
              WebkitTextFillColor: isDark ? 'transparent' : '#0f172a',
              filter: isDark ? 'drop-shadow(0 4px 12px rgba(14,165,233,0.3))' : 'drop-shadow(0 2px 4px rgba(255,255,255,0.5))',
            }}
          >
            StudySphere
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className={`mt-4 text-xs sm:text-sm font-bold uppercase tracking-[0.4em] ${
            isDark ? 'text-sky-300/80' : 'text-sky-700/80'
          }`}
        >
          {subtitle}
        </motion.p>
      </div>

      <AnimatePresence>
        {isExiting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className={`absolute inset-0 z-50 ${isDark ? 'bg-[#020617]' : 'bg-[#f8fafc]'}`}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SplashScreen;
