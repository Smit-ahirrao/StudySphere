import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card, { Song } from './Card';

// Mock Data - Updated for Light Mode / Gen Z
const SONGS: Song[] = [
  {
    id: '1',
    title: "Can't Be Broke",
    artist: "Rick Ross feat. Yungeen Ace",
    cover: "https://images.unsplash.com/photo-1619983081563-430f63602796?q=80&w=1000&auto=format&fit=crop",
    duration: "00:48:00",
    bgGradient: "#dbeafe", // Light Blue
    headerText: "MOTION FACTORY",
    subText: "Best Suited For Freelancers, Content Creators"
  },
  {
    id: '2',
    title: "Midnight City",
    artist: "M83",
    cover: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=1000&auto=format&fit=crop",
    duration: "04:03:00",
    bgGradient: "#f3e8ff", // Light Purple
    headerText: "NEON DREAMS",
    subText: "Synth-pop anthems for late night drives"
  },
  {
    id: '3',
    title: "Starboy",
    artist: "The Weeknd",
    cover: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop",
    duration: "03:50:00",
    bgGradient: "#ffe4e6", // Light Red/Pink
    headerText: "STAR POWER",
    subText: "Chart topping hits from the modern legend"
  },
  {
    id: '4',
    title: "Levitating",
    artist: "Dua Lipa",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1000&auto=format&fit=crop",
    duration: "03:23:00",
    bgGradient: "#e0f2fe", // Light Sky
    headerText: "FUTURE NOSTALGIA",
    subText: "Retro disco vibes reimaged for today"
  }
];

const swipeVariants = {
  enter: (direction: number) => ({
    scale: 0.95,
    y: -35,
    opacity: 0.6,
    zIndex: 2,
    x: 0,
  }),
  center: {
    zIndex: 3,
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1]
    }
  },
  exit: (direction: number) => ({
    zIndex: 3,
    x: direction > 0 ? 350 : -350,
    opacity: 0,
    scale: 1,
    rotate: direction > 0 ? 10 : -10,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1]
    }
  })
};

export default function DeckPlayer() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % SONGS.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + SONGS.length) % SONGS.length);
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  const activeSong = SONGS[currentIndex];
  const nextSong = SONGS[(currentIndex + 1) % SONGS.length];
  const nextNextSong = SONGS[(currentIndex + 2) % SONGS.length];

  return (
    <div className="relative w-full h-[420px] flex items-center justify-center" style={{ perspective: '1000px' }}>
      
      {/* Background Stack 2 */}
      <motion.div
        key={`bg2-${nextNextSong.id}`}
        className="absolute inset-0 w-full h-full pointer-events-none"
        initial={{ scale: 0.85, y: -70, opacity: 0 }}
        animate={{
          scale: 0.9,
          y: -70,
          zIndex: 1,
          opacity: 0.5 // Increased opacity for light mode
        }}
        transition={{ duration: 0.4 }}
      >
         <Card 
            song={nextNextSong} 
            isPlaying={false}
            onTogglePlay={() => {}}
            onNext={() => {}}
            onPrev={() => {}}
            index={currentIndex + 2}
            isBackground={true}
          />
      </motion.div>

      {/* Background Stack 1 */}
      <motion.div
        key={`bg1-${nextSong.id}`}
        className="absolute inset-0 w-full h-full pointer-events-none"
        initial={{ scale: 0.9, y: -35, opacity: 0.3 }}
        animate={{
          scale: 0.95,
          y: -35,
          zIndex: 2,
          opacity: 0.8 // Increased opacity for light mode
        }}
        transition={{ duration: 0.4 }}
      >
         <Card 
            song={nextSong} 
            isPlaying={false}
            onTogglePlay={() => {}}
            onNext={() => {}}
            onPrev={() => {}}
            index={currentIndex + 1}
            isBackground={true}
          />
      </motion.div>

      {/* Active Card */}
      <AnimatePresence custom={direction} mode="popLayout">
        <motion.div
          key={activeSong.id}
          custom={direction}
          variants={swipeVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0 w-full h-full z-30 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] rounded-[30px]"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.7}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = offset.x;
            if (swipe < -100) {
              handlePrev();
            } else if (swipe > 100) {
              handleNext();
            }
          }}
        >
          <Card 
            song={activeSong} 
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
            onNext={handleNext}
            onPrev={handlePrev}
            index={currentIndex}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
