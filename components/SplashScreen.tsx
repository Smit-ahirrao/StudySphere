import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';

const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { data } = useData();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onComplete, 520);
    }, 1450);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const characters = 'StudySphere'.split('');
  const isDark = data.settings.theme === 'dark';
  const subtitle = 'Plan smart. Focus deep. Achieve more.';

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden ${
        isDark ? 'bg-[#020617] text-white' : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45 }}
        className={`absolute inset-0 ${
          isDark
            ? 'bg-[radial-gradient(circle_at_18%_12%,_rgba(14,165,233,0.22),_transparent_34%),radial-gradient(circle_at_82%_18%,_rgba(20,184,166,0.18),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#0b1120_52%,_#111827_100%)]'
            : 'bg-[radial-gradient(circle_at_18%_12%,_rgba(14,165,233,0.16),_transparent_34%),radial-gradient(circle_at_82%_18%,_rgba(20,184,166,0.12),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#ecfeff_52%,_#e2e8f0_100%)]'
        }`}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: [0.25, 0.65, 0.25], scale: 1.03 }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,_rgba(14,165,233,0.24),_transparent_64%)] blur-2xl"
      />

      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.84, opacity: 0, y: 6 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{
            duration: 0.42,
            ease: [0.2, 0.8, 0.2, 1],
          }}
          className="relative"
        >
          <motion.div
            animate={{
              rotate: [0, 10, 0, -10, 0],
              boxShadow: [
                '0 0 0 6px rgba(14,165,233,0.1)',
                '0 0 0 11px rgba(14,165,233,0.2)',
                '0 0 0 6px rgba(14,165,233,0.1)',
              ],
            }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -inset-4 rounded-[30px]"
          />

          <motion.img
            src="/pwa-512.png"
            alt="StudySphere Logo"
            className="relative h-32 w-32 rounded-[26px] object-cover shadow-[0_24px_60px_-30px_rgba(14,165,233,0.85)] sm:h-36 sm:w-36"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>

        <div className="mt-8 flex gap-1">
          {characters.map((char, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.34 + index * 0.04,
                duration: 0.3,
                ease: 'easeOut',
              }}
              className={`text-3xl font-bold tracking-tight sm:text-4xl ${isDark ? 'text-white' : 'text-slate-900'}`}
            >
              {char}
            </motion.span>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.45 }}
          className={`mt-3 text-[11px] font-semibold uppercase tracking-[0.32em] ${
            isDark ? 'text-sky-300/85' : 'text-sky-700/85'
          }`}
        >
          {subtitle}
        </motion.p>
      </div>

      <AnimatePresence>
        {isExiting && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.48, ease: [0.4, 0, 0.2, 1] }}
            className={`absolute inset-0 ${isDark ? 'bg-[#020617]' : 'bg-[#f8fafc]'}`}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SplashScreen;
