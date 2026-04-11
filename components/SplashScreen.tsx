import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onComplete, 800); // Wait for exit animation
    }, 2500); // Show splash for 2.5s

    return () => clearTimeout(timer);
  }, [onComplete]);

  const characters = "StudySphere".split("");

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#020617] overflow-hidden">
      {/* Background radial glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(14,165,233,0.15),_transparent_60%)]"
      />

      <div className="relative flex flex-col items-center">
        {/* Animated 3D Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -20, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.2
          }}
          className="relative"
        >
          {/* Outer Ring Glow */}
          <motion.div
            animate={{ 
              boxShadow: ["0 0 20px rgba(14,165,233,0.3)", "0 0 50px rgba(14,165,233,0.6)", "0 0 20px rgba(14,165,233,0.3)"]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full"
          />
          
          <img 
            src="/icon.png" 
            alt="StudySphere Logo" 
            className="relative h-32 w-32 object-contain"
          />
        </motion.div>

        {/* Text Reveal */}
        <div className="mt-8 flex gap-1">
          {characters.map((char, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.8 + index * 0.08,
                duration: 0.5,
                ease: "easeOut"
              }}
              className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
            >
              {char}
            </motion.span>
          ))}
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1 }}
          className="mt-3 text-sm font-medium uppercase tracking-[0.4em] text-sky-400/80"
        >
          Your Academic Command Center
        </motion.p>
      </div>

      {/* Exit Background Curtain */}
      <AnimatePresence>
        {isExiting && (
          <motion.div
            initial={{ y: "0%" }}
            animate={{ y: "-100%" }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            className="absolute inset-0 bg-[#020617]"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SplashScreen;
