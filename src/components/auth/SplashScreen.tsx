import React, { useEffect } from 'react';
import { motion } from 'motion/react';

interface SplashScreenProps {
  onComplete?: () => void;
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof onFinish === 'function') {
        onFinish();
      } else if (typeof onComplete === 'function') {
        onComplete();
      }
    }, 1800);
    return () => clearTimeout(timer);
  }, [onComplete, onFinish]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 bg-[#ffffff] flex flex-col items-center justify-center px-6"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Modern minimal emblem */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-slate-900/10"
        >
          N
        </motion.div>

        {/* Wordmark */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center"
        >
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
            NEXA
          </h1>
          <p className="text-xs tracking-widest text-slate-600 uppercase font-medium mt-1">
            Social Platform
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="absolute bottom-10 flex flex-col items-center gap-2"
      >
        <div className="w-5 h-5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-[11px] text-slate-600 font-medium">Memuat ekosistem digital...</span>
      </motion.div>
    </motion.div>
  );
};
