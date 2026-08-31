import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Video, Users2, ArrowRight } from 'lucide-react';

interface OnboardingScreenProps {
  onStartRegister: () => void;
  onStartLogin: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onStartRegister, onStartLogin }) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  const slides = [
    {
      title: 'Connect',
      subtitle: 'Terhubung dengan orang-orang yang memiliki cerita dan minat yang sama.',
      icon: Users2,
      accent: 'bg-indigo-50 text-indigo-600',
      badge: 'Komunitas Terhubung'
    },
    {
      title: 'Create',
      subtitle: 'Bagikan foto, video, dan cerita Anda.',
      icon: Video,
      accent: 'bg-emerald-50 text-emerald-600',
      badge: 'Kreativitas Tanpa Batas'
    },
    {
      title: 'Grow',
      subtitle: 'Bangun komunitas dan kembangkan profil Anda.',
      icon: Sparkles,
      accent: 'bg-amber-50 text-amber-600',
      badge: 'Ekosistem Masa Depan'
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onStartRegister();
    }
  };

  const slide = slides[currentSlide];
  const IconComponent = slide.icon;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between max-w-md mx-auto px-6 py-10 relative overflow-hidden">
      {/* Top Bar with Skip */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-xs">
            N
          </div>
          <span className="font-bold text-base tracking-tight text-slate-900">NEXA</span>
        </div>
        {currentSlide < slides.length - 1 && (
          <button
            id="onboarding-skip-btn"
            onClick={onStartLogin}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors px-2 py-1"
          >
            Lewati
          </button>
        )}
      </div>

      {/* Main Slide Carousel Area */}
      <div className="my-auto py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center"
          >
            {/* Visual Icon Illustration */}
            <div className={`w-28 h-28 rounded-3xl ${slide.accent} flex items-center justify-center mb-8 shadow-sm ring-8 ring-slate-100/80`}>
              <IconComponent className="w-12 h-12 stroke-[1.8px]" />
            </div>

            {/* Badge */}
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-xs mb-3">
              {slide.badge}
            </span>

            {/* Title */}
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
              {slide.title}
            </h2>

            {/* Subtitle */}
            <p className="text-slate-600 text-sm sm:text-base max-w-xs leading-relaxed">
              {slide.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Controls */}
      <div className="flex flex-col gap-5 z-10">
        {/* Step dots */}
        <div className="flex items-center justify-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentSlide === idx ? 'w-8 bg-slate-900' : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            id="onboarding-main-btn"
            onClick={handleNext}
            className="w-full py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-slate-900/10 transition-all"
          >
            <span>{currentSlide === slides.length - 1 ? 'Mulai' : 'Lanjutkan'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            id="onboarding-login-btn"
            onClick={onStartLogin}
            className="w-full py-3.5 px-6 rounded-xl bg-white hover:bg-slate-50 active:scale-[0.99] text-slate-700 border border-slate-200/80 font-semibold text-sm transition-all"
          >
            Sudah punya akun? Masuk
          </button>
        </div>
      </div>
    </div>
  );
};
