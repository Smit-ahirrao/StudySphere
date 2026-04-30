import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import Waveform from './Waveform';

export interface Song {
  id: string;
  title: string;
  artist: string;
  cover: string;
  duration: string;
  bgGradient: string;
  headerText: string;
  subText: string;
}

interface CardProps {
  song: Song;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  index: number;
  isBackground?: boolean;
}

export default function Card({ song, isPlaying, onTogglePlay, onNext, onPrev, isBackground = false }: CardProps) {
  return (
    <div className={`relative w-full h-full bg-white rounded-[30px] overflow-hidden flex flex-col border border-zinc-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all ${isBackground ? 'brightness-95 grayscale-[0.3] shadow-none' : 'ring-1 ring-black/5'}`}>
      {/* Dynamic Background - subtle gradient */}
      
      {/* Enhanced glow effect for light mode */}
      {!isBackground && (
        <div className="absolute inset-0 rounded-[30px] shadow-[inset_0_0_20px_rgba(0,0,0,0.02)] pointer-events-none z-20" />
      )}
      <div 
        className="absolute inset-0 opacity-40 pointer-events-none transition-colors duration-500"
        style={{ background: `linear-gradient(to bottom, ${song.bgGradient}, #ffffff)` }}
      />
      
      {/* Card Content */}
      <div className="flex-1 px-8 flex flex-col relative z-10 pt-8 justify-center">
        <motion.h1 
          layoutId={`header-${song.id}`}
          className="font-display text-5xl font-black tracking-tighter text-black mb-2 leading-[0.9]"
        >
          {song.headerText}
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          className="text-base text-zinc-500 max-w-[90%] font-medium tracking-tight"
        >
          {song.subText}
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <button className="px-6 py-3 rounded-full bg-black hover:bg-zinc-800 text-white text-xs font-bold tracking-widest transition-colors uppercase shadow-lg shadow-black/10 active:scale-95">
            Get Premium
          </button>
        </motion.div>
      </div>

      {/* Player Section */}
      <div className="p-4">
        <div className="bg-white/80 rounded-[24px] p-5 flex items-center gap-5 shadow-lg shadow-zinc-200/50 border border-white/50 backdrop-blur-md relative overflow-hidden group ring-1 ring-black/5">
          {/* Mini Cover */}
          <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-md ring-1 ring-black/5">
             <img src={song.cover} alt="cover" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          </div>
          
          {/* Info & Controls */}
          <div className="flex-1 flex flex-col justify-center min-w-0 gap-2">
            <div className="flex justify-between items-start">
              <div className="min-w-0">
                <h3 className="text-zinc-900 font-bold text-base truncate pr-2">{song.title}</h3>
                <p className="text-zinc-400 text-xs truncate font-medium">{song.artist}</p>
              </div>
              
              {/* Controls */}
              <div className="flex items-center gap-3">
                 <button onClick={onPrev} className="text-zinc-400 hover:text-black transition-colors">
                   <SkipBack size={18} fill="currentColor" />
                 </button>
                 <button onClick={onTogglePlay} className="text-black hover:scale-110 transition-transform bg-zinc-100 p-1.5 rounded-full">
                   {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                 </button>
                 <button onClick={onNext} className="text-zinc-400 hover:text-black transition-colors">
                   <SkipForward size={18} fill="currentColor" />
                 </button>
              </div>
            </div>
            
            {/* Waveform & Time */}
            <div className="flex items-center gap-3 mt-1">
               <div className="flex-1 h-6 flex items-center">
                  <Waveform isPlaying={isPlaying} />
               </div>
               <span className="text-[10px] font-mono text-zinc-400">{song.duration}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
