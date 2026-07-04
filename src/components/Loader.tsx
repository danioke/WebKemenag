import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface LoaderProps {
  onComplete: () => void;
}

export default function Loader({ onComplete }: LoaderProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Elegant, custom progress step animation
    const duration = 2000; // 2 seconds total animation time
    const intervalTime = 30;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep += 1;
      const progressPercent = Math.min(Math.round((currentStep / steps) * 100), 100);
      setProgress(progressPercent);

      if (currentStep >= steps) {
        clearInterval(timer);
        // Add a slight delay before triggering onComplete for a smoother exit
        setTimeout(() => {
          onComplete();
        }, 300);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ 
        opacity: 0,
        y: -100,
        transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } 
      }}
      className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center font-sans overflow-hidden select-none"
    >
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 opacity-40 bg-radial-gradient from-green-50/50 via-white to-white pointer-events-none" />

      {/* Center Branding Content */}
      <div className="flex flex-col items-center z-10 max-w-md px-6 text-center">
        
        {/* Modern Rotating/Pulsing Logo Container */}
        <div className="relative mb-8 flex items-center justify-center">
          {/* External rotating decorative ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            className="absolute w-28 h-28 border border-dashed border-green-200 rounded-full"
          />

          {/* Golden expanding ripple rings */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 1.3, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
            className="absolute w-24 h-24 border border-amber-300 rounded-full"
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0.3 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 2, delay: 0.7, ease: "easeOut" }}
            className="absolute w-24 h-24 border border-green-300 rounded-full"
          />

          {/* Core Logo Ball */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl shadow-green-700/20 relative z-10 p-1"
          >
            <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="46" fill="#15803d" stroke="#f59e0b" strokeWidth="3" />
              <circle cx="50" cy="50" r="38" fill="#166534" />
              <path d="M50 18L53.5 26.5H62.5L55.5 31.5L58 40L50 35L42 40L44.5 31.5L37.5 26.5H46.5L50 18Z" fill="#fbbf24" />
              <path d="M50 52C45 47 37 47 32 49V64C37 62 45 62 50 67C55 62 63 62 68 64V49C63 47 55 47 50 52Z" fill="#ffffff" stroke="#fbbf24" strokeWidth="2" strokeLinejoin="round" />
              <path d="M35 53H45M35 57H45M35 60H45M65 53H55M65 57H55M65 60H55" stroke="#166534" strokeWidth="1" />
              <path d="M44 68H56V74H44V68Z" fill="#fbbf24" />
              <path d="M22 50C22 35 34 26 44 26" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
              <path d="M78 50C78 35 66 26 56 26" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
              <path d="M50 33L70 43V60C70 72 50 82 50 82C50 82 30 72 30 60V43L50 33Z" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
            </svg>
          </motion.div>
        </div>

        {/* Brand Text with staggered reveal */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-wider uppercase mb-1">
            Kementerian Agama
          </h1>
          <h2 className="text-xs md:text-sm font-bold text-green-700 uppercase tracking-widest mb-6">
            Kabupaten Ogan Komering Ilir
          </h2>
        </motion.div>

        {/* Progress Bar Container */}
        <div className="w-48 h-[3px] bg-gray-100 rounded-full overflow-hidden mb-3 relative">
          <motion.div
            className="h-full bg-gradient-to-r from-green-600 to-amber-500 rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ ease: "easeInOut" }}
          />
        </div>

        {/* Progress Text */}
        <motion.span
          className="text-[10px] font-mono font-medium text-gray-400 tracking-widest uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Memuat halaman... {progress}%
        </motion.span>
      </div>

      {/* Decorative Minimalist Bottom Text */}
      <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none">
        <p className="text-[10px] text-gray-300 font-mono tracking-widest uppercase">
          Kementerian Agama Republik Indonesia
        </p>
      </div>
    </motion.div>
  );
}
