import React, { useState, useEffect, useCallback } from 'react';
import { 
  Heart, Flame, Users, Sparkles, SlidersHorizontal, ShieldCheck, 
  MessageCircle, Star, X, CheckCircle, RefreshCw, UserCheck, 
  Settings, AlertTriangle, Eye, ShieldAlert, Ban, Info, ChevronRight 
} from 'lucide-react';
import { 
  MatchProfile, MatchItem, MatchSearchPreferences, MATCH_CONFIG 
} from '../../types.js';
import { matchApi } from '../../services/api.js';
import { useApp } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';

import { MatchDiscoverCard } from './MatchDiscoverCard.js';
import { MatchDetailModal } from './MatchDetailModal.js';
import { MatchSuccessModal } from './MatchSuccessModal.js';
import { MatchPreferencesModal } from './MatchPreferencesModal.js';
import { MatchSafetyTipsModal } from './MatchSafetyTipsModal.js';
import { MatchVerificationModal } from './MatchVerificationModal.js';
import { MatchReportModal } from './MatchReportModal.js';
import { MatchAdminPanel } from './MatchAdminPanel.js';
import { MatchOnboardingWizard } from './MatchOnboardingWizard.js';

export const MatchView: React.FC = () => {
  const { matchInitialTab, openChatWithUser, showToast } = useApp();
  const { user } = useAuth();

  // Navigation & Tabs
  const [activeSubTab, setActiveSubTab] = useState<'discover' | 'matches' | 'likes' | 'profile'>('discover');

  // Main State
  const [myProfile, setMyProfile] = useState<MatchProfile | null>(null);
  const [discoverProfiles, setDiscoverProfiles] = useState<MatchProfile[]>([]);
  const [currentDiscoverIndex, setCurrentDiscoverIndex] = useState<number>(0);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [likes, setLikes] = useState<MatchProfile[]>([]);
  const [remainingDaily, setRemainingDaily] = useState<number>(50);
  const [hasReachedLimit, setHasReachedLimit] = useState<boolean>(false);

  // Loadings
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [isLoadingDiscover, setIsLoadingDiscover] = useState<boolean>(false);
  const [isLoadingMatches, setIsLoadingMatches] = useState<boolean>(false);
  const [isLoadingLikes, setIsLoadingLikes] = useState<boolean>(false);

  // Modals & Panels
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [inspectProfile, setInspectProfile] = useState<MatchProfile | null>(null);
  const [inspectIsMatched, setInspectIsMatched] = useState<boolean>(false);
  const [successMatchData, setSuccessMatchData] = useState<{ match: MatchItem; partner: MatchProfile } | null>(null);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState<boolean>(false);
  const [isSafetyTipsOpen, setIsSafetyTipsOpen] = useState<boolean>(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [reportTarget, setReportTarget] = useState<{ id: string; name: string } | null>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);

  // Synchronize initial tab from context
  useEffect(() => {
    if (matchInitialTab) {
      setActiveSubTab(matchInitialTab);
    }
  }, [matchInitialTab]);

  // 1. Load User's Match Profile
  const loadMyProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    try {
      const res = await matchApi.getProfile();
      setMyProfile(res.profile);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat profil match', 'error');
    } finally {
      setIsLoadingProfile(false);
    }
  }, [showToast]);

  // 2. Load Discover Queue
  const loadDiscover = useCallback(async (customPrefs?: MatchSearchPreferences) => {
    setIsLoadingDiscover(true);
    try {
      const params: any = {};
      if (customPrefs) {
        if (customPrefs.min_age) params.min_age = customPrefs.min_age;
        if (customPrefs.max_age) params.max_age = customPrefs.max_age;
        if (customPrefs.gender_preference && customPrefs.gender_preference[0] && (customPrefs.gender_preference[0] as string) !== 'all' && (customPrefs.gender_preference[0] as string) !== 'semua') {
          params.gender = customPrefs.gender_preference[0];
        }
        if (customPrefs.city_preference) params.city = customPrefs.city_preference;
        if (customPrefs.relationship_goals && customPrefs.relationship_goals.length > 0) {
          params.goal = customPrefs.relationship_goals[0];
        }
        if (customPrefs.verified_only) params.verified_only = true;
      }

      const res = await matchApi.getDiscover(params);
      setDiscoverProfiles(res.profiles || []);
      setCurrentDiscoverIndex(0);
      setRemainingDaily(res.remaining_daily);
      setHasReachedLimit(res.has_reached_limit);
      if (res.user_profile) setMyProfile(res.user_profile);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat rekomendasi jodoh.', 'error');
    } finally {
      setIsLoadingDiscover(false);
    }
  }, [showToast]);

  // 3. Load Matches List
  const loadMatches = useCallback(async () => {
    setIsLoadingMatches(true);
    try {
      const res = await matchApi.getMatches();
      setMatches(res.matches || []);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat daftar match.', 'error');
    } finally {
      setIsLoadingMatches(false);
    }
  }, [showToast]);

  // 4. Load Likes List
  const loadLikes = useCallback(async () => {
    setIsLoadingLikes(true);
    try {
      const res = await matchApi.getLikes();
      setLikes(res.likes || []);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat daftar orang yang menyukai Anda.', 'error');
    } finally {
      setIsLoadingLikes(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadMyProfile();
  }, [loadMyProfile]);

  useEffect(() => {
    if (myProfile) {
      if (activeSubTab === 'discover') {
        loadDiscover();
      } else if (activeSubTab === 'matches') {
        loadMatches();
      } else if (activeSubTab === 'likes') {
        loadLikes();
      }
    }
  }, [activeSubTab, myProfile?.id]);

  // Handle Like Action
  const handleLike = async (targetUserId: string, isSuperLike: boolean = false) => {
    try {
      const res = await matchApi.likeProfile(targetUserId, isSuperLike);
      
      // If it's a match, trigger celebration modal!
      if (res.isMatch && res.match && res.partnerProfile) {
        setSuccessMatchData({ match: res.match, partner: res.partnerProfile });
        // Refresh matches
        loadMatches();
      } else {
        showToast(isSuperLike ? '⭐ Super Like terkirim!' : '❤️ Anda menyukai profil ini.', 'info');
      }

      // Advance card in queue
      setDiscoverProfiles(prev => prev.filter(p => p.user_id !== targetUserId));
      setRemainingDaily(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      showToast(err.message || 'Gagal menyukai profil.', 'error');
    }
  };

  // Handle Pass Action
  const handlePass = async (targetUserId: string) => {
    try {
      await matchApi.passProfile(targetUserId);
      setDiscoverProfiles(prev => prev.filter(p => p.user_id !== targetUserId));
      setRemainingDaily(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      showToast(err.message || 'Gagal melewati profil.', 'error');
    }
  };

  // Toggle Active/Paused Status
  const handleToggleStatus = async () => {
    try {
      const nextStatus = myProfile?.status === 'active' ? 'paused' : 'active';
      const res = await matchApi.toggleStatus(nextStatus);
      setMyProfile(res.profile);
      showToast(res.message, 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah status profil.', 'error');
    }
  };

  // Unmatch
  const handleUnmatch = async (matchId: string) => {
    try {
      await matchApi.unmatch(matchId);
      showToast('Match telah dibatalkan.', 'info');
      setInspectProfile(null);
      loadMatches();
    } catch (err: any) {
      showToast(err.message || 'Gagal membatalkan match.', 'error');
    }
  };

  // Block
  const handleBlock = async (targetUserId: string) => {
    try {
      await matchApi.blockUser(targetUserId);
      showToast('Pengguna berhasil diblokir.', 'info');
      setInspectProfile(null);
      loadDiscover();
      loadMatches();
      loadLikes();
    } catch (err: any) {
      showToast(err.message || 'Gagal memblokir pengguna.', 'error');
    }
  };

  // Open Report Modal
  const openReport = (targetUserId: string, name: string) => {
    setReportTarget({ id: targetUserId, name });
    setIsReportOpen(true);
  };

  // Initial Loading state
  if (isLoadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-500 animate-pulse">
          <Heart className="w-6 h-6 fill-current animate-bounce" />
        </div>
        <p className="text-xs text-zinc-500 font-medium">Memuat NEXA Match...</p>
      </div>
    );
  }

  // If user does not have a Match Profile, or is editing profile
  if (!myProfile || isEditingProfile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <MatchOnboardingWizard
          existingProfile={myProfile}
          onSaved={(savedProfile) => {
            setMyProfile(savedProfile);
            setIsEditingProfile(false);
            setActiveSubTab('discover');
            loadDiscover();
          }}
          onCancel={myProfile ? () => setIsEditingProfile(false) : undefined}
        />
      </div>
    );
  }

  const currentDiscoverProfile = discoverProfiles[0] || null;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 pb-20 space-y-4 animate-fade-in">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 sm:p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Brand & 18+ Label */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/25">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                NEXA MATCH
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-[11px] font-bold border border-rose-200 dark:border-rose-800/40">
                18+
              </span>
              {myProfile.is_verified && (
                <span className="inline-flex items-center gap-0.5 text-blue-500 text-[11px] font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" /> Terverifikasi
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500">Temukan seseorang yang cocok dengan Anda secara aman & nyaman</p>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          {/* Status Toggle Pill */}
          <button
            onClick={handleToggleStatus}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
              myProfile.status === 'active'
                ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                : 'border-amber-200 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
            }`}
            title="Klik untuk mengubah status aktif/jeda"
          >
            <span className={`w-2 h-2 rounded-full ${myProfile.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{myProfile.status === 'active' ? 'Profil Aktif' : 'Dijeda'}</span>
          </button>

          {/* Safety Tips Icon Button */}
          <button
            onClick={() => setIsSafetyTipsOpen(true)}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-rose-600 transition"
            title="Panduan Keamanan (Anti-Scam)"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>

          {/* Verification Modal Button */}
          {!myProfile.is_verified && (
            <button
              onClick={() => setIsVerificationOpen(true)}
              className="px-2.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 transition flex items-center gap-1"
              title="Ajukan Verifikasi Foto"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Verifikasi
            </button>
          )}

          {/* Admin Moderation Button (Only for admin) */}
          {user?.role === 'admin' && (
            <button
              onClick={() => setIsAdminPanelOpen(true)}
              className="p-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold hover:opacity-90 transition"
              title="Moderasi Admin NEXA Match"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Safety Notice Warning Ribbon */}
      <div className="p-3 px-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Waspada Penipuan:</strong> Jangan pernah mengirim saldo transfer atau membagikan PIN/OTP Anda.
          </span>
        </div>
        <button
          onClick={() => setIsSafetyTipsOpen(true)}
          className="text-[11px] underline font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-900 shrink-0 ml-2"
        >
          Pelajari Selengkapnya
        </button>
      </div>

      {/* Primary Sub-Navigation Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('discover')}
          className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'discover'
              ? 'bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span className="hidden sm:inline">Temukan</span>
        </button>

        <button
          onClick={() => setActiveSubTab('matches')}
          className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 relative ${
            activeSubTab === 'matches'
              ? 'bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Match Saya</span>
          {matches.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {matches.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('likes')}
          className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 relative ${
            activeSubTab === 'likes'
              ? 'bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Menyukai Saya</span>
          {likes.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
              {likes.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('profile')}
          className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'profile'
              ? 'bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span className="hidden sm:inline">Profil Match</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: DISCOVER (TEMUKAN JODOH) */}
      {/* ======================================================== */}
      {activeSubTab === 'discover' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Rekomendasi Terbaik Hari Ini
              </span>
              <button
                onClick={() => loadDiscover()}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
                title="Refresh Rekomendasi"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDiscover ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <button
              onClick={() => setIsPreferencesOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-rose-500 text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-rose-500" />
              <span>Filter Preferensi</span>
            </button>
          </div>

          {/* Interactive Card */}
          <MatchDiscoverCard
            profile={currentDiscoverProfile}
            remainingDaily={remainingDaily}
            hasReachedLimit={hasReachedLimit}
            onLike={handleLike}
            onPass={handlePass}
            onOpenDetail={(p) => {
              setInspectProfile(p);
              setInspectIsMatched(false);
            }}
            onOpenPreferences={() => setIsPreferencesOpen(true)}
            onRefresh={() => loadDiscover()}
            isLoading={isLoadingDiscover}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MY MATCHES (PASANGAN SALING SUKA) */}
      {/* ======================================================== */}
      {activeSubTab === 'matches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Pasangan Saling Menyukai</h3>
              <p className="text-xs text-zinc-500">Kalian berdua telah saling cocok. Mulai percakapan sekarang!</p>
            </div>
            <button
              onClick={loadMatches}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 transition"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingMatches ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {matches.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 text-center border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto">
                <Heart className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">Belum Ada Pasangan yang Cocok</h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                Jelajahi lebih banyak profil di tab <strong>Temukan</strong> dan kirimkan like. Saat mereka menyukai Anda kembali, mereka akan muncul di sini!
              </p>
              <button
                onClick={() => setActiveSubTab('discover')}
                className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition"
              >
                Mulai Mencari
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {matches.map(m => {
                const partner = m.partner_profile;
                if (!partner) return null;
                const photo = partner.profile_photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400';

                return (
                  <div
                    key={m.id}
                    className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between gap-3 hover:border-rose-200 transition"
                  >
                    <div 
                      onClick={() => {
                        setInspectProfile(partner);
                        setInspectIsMatched(true);
                      }}
                      className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                    >
                      <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700">
                        <img src={photo} alt={partner.display_name} className="w-full h-full object-cover" />
                        {partner.is_verified && (
                          <div className="absolute top-1 right-1 bg-blue-500 text-white p-0.5 rounded-full">
                            <CheckCircle className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm truncate flex items-center gap-1">
                          {partner.display_name}, {partner.age}
                        </div>
                        <div className="text-xs text-zinc-500 truncate">
                          {partner.city} {partner.occupation ? `• ${partner.occupation}` : ''}
                        </div>
                        <div className="text-[10px] text-rose-500 font-medium mt-0.5">
                          {MATCH_CONFIG.RELATIONSHIP_GOALS[partner.relationship_goal] || partner.relationship_goal}
                        </div>
                      </div>
                    </div>

                    {/* Chat Action */}
                    <button
                      onClick={() => openChatWithUser(partner.user_id)}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-semibold hover:from-rose-600 hover:to-pink-700 transition flex items-center gap-1.5 shadow-sm shrink-0"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: WHO LIKED ME (MENYUKAI SAYA) */}
      {/* ======================================================== */}
      {activeSubTab === 'likes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Orang yang Menyukai Anda</h3>
              <p className="text-xs text-zinc-500">Sukai balik profil mereka untuk langsung menjadi match!</p>
            </div>
            <button
              onClick={loadLikes}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 transition"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingLikes ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {likes.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 text-center border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">Belum Ada Like Baru</h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                Lengkapi foto profil Anda dan perbarui bio Anda agar lebih banyak pengguna tertarik menyukai Anda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {likes.map(person => {
                const photo = person.profile_photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400';

                return (
                  <div
                    key={person.id}
                    className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col group"
                  >
                    <div 
                      onClick={() => {
                        setInspectProfile(person);
                        setInspectIsMatched(false);
                      }}
                      className="relative aspect-[3/4] cursor-pointer select-none"
                    >
                      <img src={photo} alt={person.display_name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                      <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white pointer-events-none">
                        <div className="font-bold text-sm leading-tight flex items-center gap-1">
                          {person.display_name}, {person.age}
                          {person.is_verified && <CheckCircle className="w-3 h-3 text-blue-400 inline" />}
                        </div>
                        <div className="text-[11px] text-white/80">{person.city}</div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-white dark:bg-zinc-900 flex gap-2">
                      <button
                        onClick={() => handlePass(person.user_id)}
                        className="flex-1 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-700 text-xs font-semibold flex items-center justify-center transition"
                        title="Lewati"
                      >
                        <X className="w-4 h-4 text-zinc-400" />
                      </button>

                      <button
                        onClick={() => handleLike(person.user_id, false)}
                        className="flex-[2] py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition"
                        title="Suka Balik (Match Langsung)"
                      >
                        <Heart className="w-3.5 h-3.5 fill-current" />
                        <span>Suka Balik</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: MY MATCH PROFILE (LIHAT & EDIT PROFIL) */}
      {/* ======================================================== */}
      {activeSubTab === 'profile' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
            {/* Header & Quick Action */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">Profil NEXA Match Anda</h3>
                <p className="text-xs text-zinc-500">Tampilan profil Anda di mata pengguna lain</p>
              </div>
              <button
                onClick={() => setIsEditingProfile(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5"
              >
                Edit Profil
              </button>
            </div>

            {/* Photos Strip */}
            <div>
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                Foto Profil ({myProfile.profile_photos?.length || 0}/6)
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {myProfile.profile_photos?.map((photo, idx) => (
                  <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-sm">
                    <img src={photo} alt={`My Photo ${idx}`} className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-[9px] font-bold rounded">
                        Utama
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Profile Data Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 space-y-1">
                <span className="text-zinc-400 block text-[11px]">Nama & Usia:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                  {myProfile.display_name}, {myProfile.age} Tahun
                </span>
                <span className="text-zinc-500 block">Gender: {myProfile.gender === 'female' ? 'Wanita' : 'Pria'}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 space-y-1">
                <span className="text-zinc-400 block text-[11px]">Kota Domisili:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{myProfile.city}</span>
                {myProfile.occupation && <span className="text-zinc-500 block">Profesi: {myProfile.occupation}</span>}
              </div>
            </div>

            {/* Relationship Goal & Bio */}
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                <span className="text-[11px] font-bold text-rose-500 uppercase">Tujuan Hubungan:</span>
                <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mt-0.5">
                  {MATCH_CONFIG.RELATIONSHIP_GOALS[myProfile.relationship_goal] || myProfile.relationship_goal}
                </div>
              </div>

              {myProfile.bio && (
                <div>
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                    Bio:
                  </span>
                  <p className="text-zinc-700 dark:text-zinc-300 text-xs leading-relaxed p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    {myProfile.bio}
                  </p>
                </div>
              )}

              {/* Interests */}
              {myProfile.interests && myProfile.interests.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                    Minat & Hobi:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {myProfile.interests.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Account Status / Privacy Controls */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-zinc-500">
                Status Visibilitas: <strong className={myProfile.status === 'active' ? 'text-emerald-600' : 'text-amber-600'}>
                  {myProfile.status === 'active' ? 'Aktif (Tampil di Pencarian)' : 'Dijeda'}
                </strong>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleToggleStatus}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 text-xs font-medium transition"
                >
                  {myProfile.status === 'active' ? 'Jeda Profil Saya' : 'Aktifkan Kembali'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALS */}
      {/* ======================================================== */}

      {/* 1. Profile Inspection Modal */}
      <MatchDetailModal
        isOpen={Boolean(inspectProfile)}
        onClose={() => setInspectProfile(null)}
        profile={inspectProfile}
        isMatched={inspectIsMatched}
        onLike={(isSuperLike) => {
          if (inspectProfile) handleLike(inspectProfile.user_id, isSuperLike);
        }}
        onPass={() => {
          if (inspectProfile) handlePass(inspectProfile.user_id);
        }}
        onReport={() => {
          if (inspectProfile) openReport(inspectProfile.user_id, inspectProfile.display_name);
        }}
        onBlock={() => {
          if (inspectProfile) handleBlock(inspectProfile.user_id);
        }}
        onUnmatch={() => {
          if (inspectProfile) {
            const foundMatch = matches.find(m => m.user1_id === inspectProfile.user_id || m.user2_id === inspectProfile.user_id);
            if (foundMatch) handleUnmatch(foundMatch.id);
          }
        }}
      />

      {/* 2. Celebratory Match Success Modal */}
      <MatchSuccessModal
        isOpen={Boolean(successMatchData)}
        onClose={() => setSuccessMatchData(null)}
        currentUserProfile={myProfile}
        partnerProfile={successMatchData?.partner}
        match={successMatchData?.match}
        onStartChat={(targetUserId) => openChatWithUser(targetUserId)}
      />

      {/* 3. Search Preferences Filter Modal */}
      <MatchPreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        currentPreferences={myProfile.search_preferences || { min_age: 18, max_age: 40, gender_preference: ['all'] }}
        onSave={(prefs) => {
          loadDiscover(prefs);
        }}
      />

      {/* 4. Safety Tips Modal */}
      <MatchSafetyTipsModal
        isOpen={isSafetyTipsOpen}
        onClose={() => setIsSafetyTipsOpen(false)}
      />

      {/* 5. Photo Verification Modal */}
      <MatchVerificationModal
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
        onVerifiedRequested={(updated) => setMyProfile(updated)}
      />

      {/* 6. Report Modal */}
      {reportTarget && (
        <MatchReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          targetUserId={reportTarget.id}
          targetUserName={reportTarget.name}
          onReported={() => {
            loadDiscover();
            loadMatches();
            loadLikes();
          }}
        />
      )}

      {/* 7. Admin Moderation Panel */}
      <MatchAdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
      />
    </div>
  );
};
