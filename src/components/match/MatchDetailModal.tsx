import React, { useState } from 'react';
import { 
  X, CheckCircle, MapPin, Briefcase, GraduationCap, 
  Heart, XCircle, Star, MoreVertical, ShieldAlert, 
  Ban, ShieldCheck, Sparkles, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { MatchProfile, MATCH_CONFIG } from '../../types.js';

interface MatchDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: MatchProfile | null;
  onLike?: (isSuperLike?: boolean) => void;
  onPass?: () => void;
  onReport?: () => void;
  onBlock?: () => void;
  onUnmatch?: () => void;
  isMatched?: boolean;
}

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({
  isOpen,
  onClose,
  profile,
  onLike,
  onPass,
  onReport,
  onBlock,
  onUnmatch,
  isMatched
}) => {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  if (!isOpen || !profile) return null;

  const photos = profile.profile_photos && profile.profile_photos.length > 0 
    ? profile.profile_photos 
    : ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600'];

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[92dvh] overflow-hidden relative">
        {/* Top Floating Buttons */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          <button
            onClick={onClose}
            className="pointer-events-auto p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition shadow-md"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative pointer-events-auto">
            <button
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition shadow-md"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showOptionsMenu && (
              <div className="absolute right-0 top-12 w-48 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 py-1.5 z-30 text-xs animate-fade-in">
                {isMatched && onUnmatch && (
                  <button
                    onClick={() => {
                      setShowOptionsMenu(false);
                      onUnmatch();
                    }}
                    className="w-full text-left px-4 py-2.5 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4 text-zinc-400" />
                    Batalkan Match (Unmatch)
                  </button>
                )}
                {onBlock && (
                  <button
                    onClick={() => {
                      setShowOptionsMenu(false);
                      onBlock();
                    }}
                    className="w-full text-left px-4 py-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                  >
                    <Ban className="w-4 h-4" />
                    Blokir Pengguna
                  </button>
                )}
                {onReport && (
                  <button
                    onClick={() => {
                      setShowOptionsMenu(false);
                      onReport();
                    }}
                    className="w-full text-left px-4 py-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Laporkan Profil
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1 pb-24">
          {/* Photo Gallery Area */}
          <div className="relative aspect-[3/4] sm:aspect-[4/5] w-full bg-zinc-950 select-none">
            <img
              src={photos[photoIndex]}
              alt={profile.display_name}
              className="w-full h-full object-cover"
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none"></div>

            {/* Photo Indicator Bars */}
            {photos.length > 1 && (
              <div className="absolute top-3 left-4 right-4 z-10 flex gap-1.5">
                {photos.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      idx === photoIndex ? 'bg-white shadow' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Tap areas for photo nav */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition z-10"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition z-10"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* In-Card Title Info */}
            <div className="absolute bottom-4 left-4 right-4 text-white z-10">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{profile.display_name}</h2>
                <span className="text-2xl font-light text-white/90">{profile.age}</span>
                {profile.is_verified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500 text-white text-xs font-semibold shadow">
                    <CheckCircle className="w-3.5 h-3.5" /> Terverifikasi
                  </span>
                )}
                {profile.match_score && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold shadow">
                    <Sparkles className="w-3 h-3" /> {profile.match_score}% Cocok
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-white/90 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" /> {profile.city}
                </span>
                {profile.occupation && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-blue-300" /> {profile.occupation}
                  </span>
                )}
                {profile.education && (
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-300" /> {profile.education}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-5 space-y-5 text-sm">
            {/* Relationship Goal Card */}
            <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold tracking-wider text-rose-500 uppercase">Mencari:</span>
                <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mt-0.5">
                  {MATCH_CONFIG.RELATIONSHIP_GOALS[profile.relationship_goal] || profile.relationship_goal}
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Heart className="w-4 h-4 fill-current" />
              </div>
            </div>

            {/* About Me Bio */}
            {profile.bio && (
              <div>
                <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                  Tentang Saya
                </h4>
                <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Interests Chips */}
            {profile.interests && profile.interests.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                  Minat & Hobi
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Extra Info (Height, Religion) */}
            {(profile.height_optional || profile.religion_preference_optional) && (
              <div>
                <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                  Informasi Tambahan
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {profile.height_optional && (
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                      <span className="text-zinc-400 block text-[11px]">Tinggi Badan:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{profile.height_optional} cm</span>
                    </div>
                  )}
                  {profile.religion_preference_optional && (
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                      <span className="text-zinc-400 block text-[11px]">Agama / Kepercayaan:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{profile.religion_preference_optional}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Anti-Scam Reminder */}
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 text-xs flex items-start gap-2.5 text-amber-800 dark:text-amber-300">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>
                <strong>Jaga Keamanan:</strong> Jangan pernah mengirim saldo transfer uang atau membagikan kata sandi/PIN kepada siapa pun.
              </span>
            </div>
          </div>
        </div>

        {/* Floating Bottom Action Bar (if not already matched) */}
        {!isMatched && (onLike || onPass) && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white dark:from-zinc-900 dark:via-zinc-900 to-transparent flex items-center justify-center gap-4 z-20">
            {onPass && (
              <button
                onClick={() => {
                  onPass();
                  onClose();
                }}
                className="w-14 h-14 rounded-full bg-white dark:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 shadow-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center transition active:scale-95"
                title="Lewati"
              >
                <X className="w-7 h-7" />
              </button>
            )}

            {onLike && (
              <button
                onClick={() => {
                  onLike(true);
                  onClose();
                }}
                className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800 text-amber-500 hover:text-amber-600 shadow-xl border border-amber-200 dark:border-amber-900/40 flex items-center justify-center transition active:scale-95"
                title="Super Like"
              >
                <Star className="w-6 h-6 fill-current" />
              </button>
            )}

            {onLike && (
              <button
                onClick={() => {
                  onLike(false);
                  onClose();
                }}
                className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-xl shadow-rose-500/30 flex items-center justify-center transition active:scale-95"
                title="Suka"
              >
                <Heart className="w-7 h-7 fill-current" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
