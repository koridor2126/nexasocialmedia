import React from 'react';
import { Heart, MessageCircle, Sparkles, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { MatchProfile, MatchItem } from '../../types.js';

interface MatchSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile?: MatchProfile | null;
  partnerProfile?: MatchProfile | null;
  match?: MatchItem | null;
  onStartChat: (targetUserId: string) => void;
}

export const MatchSuccessModal: React.FC<MatchSuccessModalProps> = ({
  isOpen,
  onClose,
  currentUserProfile,
  partnerProfile,
  onStartChat
}) => {
  if (!isOpen || !partnerProfile) return null;

  const currentPhoto = currentUserProfile?.profile_photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500';
  const partnerPhoto = partnerProfile.profile_photos?.[0] || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-sm shadow-2xl border border-rose-100 dark:border-rose-950/40 p-6 flex flex-col items-center text-center relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-rose-400/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-pink-400/20 rounded-full blur-2xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-semibold text-xs mb-3 border border-rose-200/50 dark:border-rose-800/40">
          <Sparkles className="w-3.5 h-3.5" /> KECOCOKAN DITEMUKAN!
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight mb-1">
          Kalian Saling Cocok! ❤️
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
          Kamu dan <span className="font-semibold text-zinc-800 dark:text-zinc-200">{partnerProfile.display_name}</span> saling menyukai.
        </p>

        {/* Overlapping Avatars with Center Heart */}
        <div className="relative flex items-center justify-center mb-6 w-full py-2">
          {/* Current User */}
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-zinc-800 shadow-xl z-0 transform -translate-x-3 rotate-[-6deg]">
            <img src={currentPhoto} alt="You" className="w-full h-full object-cover" />
          </div>

          {/* Glowing Center Heart */}
          <div className="absolute z-20 w-12 h-12 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/40 animate-pulse border-2 border-white dark:border-zinc-800">
            <Heart className="w-6 h-6 fill-current" />
          </div>

          {/* Partner User */}
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-zinc-800 shadow-xl z-10 transform translate-x-3 rotate-[6deg]">
            <img src={partnerPhoto} alt={partnerProfile.display_name} className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Partner Info Summary */}
        <div className="w-full p-3.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-100 dark:border-zinc-800 mb-4 text-xs">
          <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
            {partnerProfile.display_name}, {partnerProfile.age}
          </div>
          <div className="text-zinc-500 dark:text-zinc-400 mt-0.5">
            {partnerProfile.city} {partnerProfile.occupation ? `• ${partnerProfile.occupation}` : ''}
          </div>
          {partnerProfile.interests && partnerProfile.interests.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1 mt-2">
              {partnerProfile.interests.slice(0, 3).map((item, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-750 text-[10px] text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Safety Note */}
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mb-5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Ingat: Jangan pernah bagikan PIN / saldo transfer.</span>
        </div>

        {/* Actions */}
        <div className="w-full space-y-2">
          <button
            onClick={() => {
              onClose();
              onStartChat(partnerProfile.user_id);
            }}
            className="w-full py-3 px-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold rounded-2xl text-xs transition shadow-md shadow-rose-500/20 flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            Mulai Obrolan Sekarang
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition rounded-xl"
          >
            Lanjut Mencari yang Lain
          </button>
        </div>
      </div>
    </div>
  );
};
