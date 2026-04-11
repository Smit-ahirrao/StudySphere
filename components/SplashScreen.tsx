import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onComplete, 700);
    }, 1900);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const characters = 'StudySphere'.split('');

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#020617]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,_rgba(14,165,233,0.22),_transparent_34%),radial-gradient(circle_at_82%_18%,_rgba(20,184,166,0.18),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#0b1120_52%,_#111827_100%)]"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.75 }}
        animate={{ opacity: [0.35, 0.8, 0.35], scale: 1.04 }}
        transition={{ duration: 2.3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle,_rgba(14,165,233,0.28),_transparent_62%)] blur-2xl"
      />

      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.68, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{
            type: 'spring',
            stiffness: 230,
            damping: 20,
            delay: 0.08,
          }}
          className="relative"
        >
          <motion.div
            animate={{
              rotate: [0, 360],
              boxShadow: [
                '0 0 0 8px rgba(14,165,233,0.14)',
                '0 0 0 14px rgba(14,165,233,0.28)',
                '0 0 0 8px rgba(14,165,233,0.14)',
              ],
            }}
            transition={{ duration: 6.8, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-4 rounded-[30px]"
          />

          <motion.img
            src="/brand-mark.svg"
            alt="StudySphere Logo"
            className="relative h-32 w-32 rounded-[26px] object-cover shadow-[0_24px_60px_-30px_rgba(14,165,233,0.85)] sm:h-36 sm:w-36"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>

        <div className="mt-8 flex gap-1">
          {characters.map((char, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.8 + index * 0.08,
                duration: 0.42,
                ease: 'easeOut',
              }}
              className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
            >
              {char}
            </motion.span>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.35, duration: 0.7 }}
          className="mt-3 text-sm font-medium uppercase tracking-[0.4em] text-sky-400/80"
        >
          Your Academic Command Center
        </motion.p>
      </div>

      <AnimatePresence>
        {isExiting && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 bg-[#020617]"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SplashScreen;
