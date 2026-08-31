import React, { useState } from 'react';
import { 
  Heart, X, Star, Info, CheckCircle, MapPin, 
  Briefcase, GraduationCap, Sparkles, ChevronLeft, ChevronRight,
  ShieldCheck, RefreshCw, SlidersHorizontal
} from 'lucide-react';
import { MatchProfile, MATCH_CONFIG } from '../../types.js';

interface MatchDiscoverCardProps {
  profile: MatchProfile | null;
  remainingDaily: number;
  hasReachedLimit: boolean;
  onLike: (targetUserId: string, isSuperLike?: boolean) => void;
  onPass: (targetUserId: string) => void;
  onOpenDetail: (profile: MatchProfile) => void;
  onOpenPreferences: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const MatchDiscoverCard: React.FC<MatchDiscoverCardProps> = ({
  profile,
  remainingDaily,
  hasReachedLimit,
  onLike,
  onPass,
  onOpenDetail,
  onOpenPreferences,
  onRefresh,
  isLoading
}) => {
  const [photoIndex, setPhotoIndex] = useState(0);

  // Reset photo index when profile changes
  React.useEffect(() => {
    setPhotoIndex(0);
  }, [profile?.id]);

  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto aspect-[3/4] sm:aspect-[4/5] bg-zinc-100 dark:bg-zinc-800/60 rounded-3xl animate-pulse flex flex-col items-center justify-center p-6 text-center border border-zinc-200 dark:border-zinc-700">
        <Sparkles className="w-10 h-10 text-rose-400 animate-spin mb-3" />
        <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Mencari rekomendasi jodoh yang cocok...</p>
        <p className="text-xs text-zinc-400 mt-1">Menyelaraskan minat, lokasi, dan preferensi usia</p>
      </div>
    );
  }

  // Daily Limit Reached State
  if (hasReachedLimit) {
    return (
      <div className="w-full max-w-md mx-auto aspect-[3/4] sm:aspect-[4/5] bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
          <Sparkles className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Batas Rekomendasi Harian Tercapai</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
            Anda telah menjelajahi 50 rekomendasi hari ini. Batas harian ini dirancang untuk menjaga kualitas interaksi yang sehat dan terarah.
          </p>
        </div>
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl text-xs text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
          Kuota harian Anda akan diperbarui otomatis besok pukul 00:00.
        </div>
        <button
          onClick={onOpenPreferences}
          className="px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:opacity-90 transition flex items-center gap-2"
        >
          <SlidersHorizontal className="w-4 h-4" /> Ubah Filter Pencarian
        </button>
      </div>
    );
  }

  // No More Profiles / Empty State
  if (!profile) {
    return (
      <div className="w-full max-w-md mx-auto aspect-[3/4] sm:aspect-[4/5] bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center">
          <Heart className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Belum Ada Profil Baru</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
            Anda telah melihat semua profil yang sesuai dengan filter Anda saat ini. Coba perluas kriteria usia, lokasi, atau tujuan hubungan.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onOpenPreferences}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" /> Ubah Filter
          </button>
          <button
            onClick={onRefresh}
            className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium hover:bg-zinc-200 transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Muat Ulang
          </button>
        </div>
      </div>
    );
  }

  const photos = profile.profile_photos && profile.profile_photos.length > 0
    ? profile.profile_photos
    : ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600'];

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex(prev => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex(prev => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col space-y-3">
      {/* Main Discover Card */}
      <div 
        onClick={() => onOpenDetail(profile)}
        className="relative aspect-[3/4] sm:aspect-[4/5] w-full rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 cursor-pointer select-none group"
      >
        {/* Photo Image */}
        <img
          src={photos[photoIndex]}
          alt={profile.display_name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
        />

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 pointer-events-none"></div>

        {/* Top Indicators & Badges */}
        <div className="absolute top-3.5 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
          {/* Photo Indicator Bars */}
          {photos.length > 1 ? (
            <div className="flex gap-1 flex-1 max-w-[140px]">
              {photos.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    idx === photoIndex ? 'bg-white shadow' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          ) : <div />}

          {/* Match Compatibility Score Badge */}
          {profile.match_score ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold shadow-lg border border-white/20">
              <Sparkles className="w-3.5 h-3.5" /> {profile.match_score}% Cocok
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-white text-[11px] font-medium border border-white/10">
              18+ Terverifikasi
            </span>
          )}
        </div>

        {/* Left/Right Click Nav Handlers */}
        {photos.length > 1 && (
          <>
            <button
              onClick={prevPhoto}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition z-10 opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition z-10 opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Bottom Profile Details in Card */}
        <div className="absolute bottom-4 left-4 right-4 text-white z-10 pointer-events-none">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{profile.display_name}</h2>
            <span className="text-2xl font-light text-white/90">{profile.age}</span>
            {profile.is_verified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500 text-white text-[11px] font-semibold shadow">
                <CheckCircle className="w-3 h-3" /> Verifikasi
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-white/90 mb-2 flex-wrap">
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

          {/* Relationship Goal Tag */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-md text-[11px] font-medium text-white mb-2">
            <Heart className="w-3 h-3 text-rose-400 fill-current" />
            Mencari: {MATCH_CONFIG.RELATIONSHIP_GOALS[profile.relationship_goal] || profile.relationship_goal}
          </div>

          {/* Interests preview */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {profile.interests.slice(0, 3).map((interest, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-md text-[10px] text-white/90 border border-white/10"
                >
                  {interest}
                </span>
              ))}
              {profile.interests.length > 3 && (
                <span className="px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-md text-[10px] text-white/70">
                  +{profile.interests.length - 3} lainnya
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Accessible Interactive Controls Bar */}
      <div className="flex items-center justify-between px-2 pt-1">
        {/* Pass Button (✕) */}
        <button
          onClick={() => onPass(profile.user_id)}
          className="flex-1 py-3 px-3 mr-2 rounded-2xl bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 border border-zinc-200 dark:border-zinc-700 shadow-md flex items-center justify-center gap-1.5 text-xs font-semibold transition active:scale-95"
          title="Lewati Profil"
        >
          <X className="w-5 h-5 text-rose-500" />
          <span>Lewati</span>
        </button>

        {/* Detail Info Button (ℹ️) */}
        <button
          onClick={() => onOpenDetail(profile)}
          className="p-3 mx-1 rounded-2xl bg-white dark:bg-zinc-800 text-blue-500 hover:text-blue-600 border border-zinc-200 dark:border-zinc-700 shadow-md flex items-center justify-center transition active:scale-95"
          title="Lihat Detail Profil Lengkap"
        >
          <Info className="w-5 h-5" />
        </button>

        {/* Super Like Button (⭐) */}
        <button
          onClick={() => onLike(profile.user_id, true)}
          className="p-3 mx-1 rounded-2xl bg-white dark:bg-zinc-800 text-amber-500 hover:text-amber-600 border border-amber-200 dark:border-amber-900/40 shadow-md flex items-center justify-center transition active:scale-95"
          title="Kirim Super Like"
        >
          <Star className="w-5 h-5 fill-current" />
        </button>

        {/* Like Button (❤️) */}
        <button
          onClick={() => onLike(profile.user_id, false)}
          className="flex-1 py-3 px-3 ml-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg shadow-rose-500/25 flex items-center justify-center gap-1.5 text-xs font-bold transition active:scale-95"
          title="Sukai Profil"
        >
          <Heart className="w-5 h-5 fill-current" />
          <span>Suka</span>
        </button>
      </div>

      {/* Remaining limit subtext */}
      <div className="text-center">
        <span className="text-[11px] text-zinc-400">
          Sisa rekomendasi harian: <strong className="text-zinc-700 dark:text-zinc-300">{remainingDaily} profil</strong>
        </span>
      </div>
    </div>
  );
};
