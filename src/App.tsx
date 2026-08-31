import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { AppProvider, useApp } from './context/AppContext.js';
import { SplashScreen } from './components/auth/SplashScreen.js';
import { OnboardingScreen } from './components/auth/OnboardingScreen.js';
import { AuthModal } from './components/auth/AuthModal.js';
import { Header } from './components/common/Header.js';
import { BottomNav } from './components/common/BottomNav.js';
import { Toast } from './components/common/Toast.js';
import { HomeFeed } from './components/feed/HomeFeed.js';
import { ExploreView } from './components/explore/ExploreView.js';
import { NotificationsView } from './components/notifications/NotificationsView.js';
import { ProfileView } from './components/profile/ProfileView.js';
import { ChatView } from './components/chat/ChatView.js';
import { CreatePostModal } from './components/feed/CreatePostModal.js';
import { ShareModal } from './components/feed/ShareModal.js';
import { ReportModal } from './components/modals/ReportModal.js';
import { PostDetailModal } from './components/feed/PostDetailModal.js';
import { NotificationPermissionBanner } from './components/notifications/NotificationPermissionBanner.js';
import { NotificationSettingsModal } from './components/notifications/NotificationSettingsModal.js';
import { CreatorDashboardModal } from './components/creator/CreatorDashboardModal.js';
import { WalletView } from './components/wallet/WalletView.js';
import { MatchView } from './components/match/MatchView.js';
import { api } from './services/api.js';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { 
    activeTab, 
    isCreateModalOpen, 
    setIsCreateModalOpen,
    shareModalPost,
    closeShareModal,
    viewingPost,
    setViewingPost,
    viewingProfileId,
    activeConversationId,
    refreshCounters,
    isNotificationSettingsOpen,
    closeNotificationSettings,
    isWalletModalOpen,
    walletInitialTab,
    closeWallet,
    showToast
  } = useApp();

  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | null>(null);

  // Check if first-time visitor in localStorage
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('nexa_has_seen_onboarding');
    if (!hasSeenOnboarding && !isAuthenticated) {
      setShowOnboarding(true);
    }
  }, [isAuthenticated]);

  // Body scroll locking when wallet modal is active
  useEffect(() => {
    if (isWalletModalOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isWalletModalOpen]);

  // Sync unread notification counts on mount
  useEffect(() => {
    if (isAuthenticated) {
      refreshCounters();
    }
  }, [isAuthenticated, refreshCounters]);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  const handleFinishOnboarding = (mode: 'login' | 'register') => {
    localStorage.setItem('nexa_has_seen_onboarding', 'true');
    setShowOnboarding(false);
    setAuthModalMode(mode);
  };

  if (showSplash || isAuthLoading) {
    return <SplashScreen onFinish={handleSplashFinish} onComplete={handleSplashFinish} />;
  }

  if (showOnboarding && !isAuthenticated) {
    return (
      <OnboardingScreen
        onStartRegister={() => handleFinishOnboarding('register')}
        onStartLogin={() => handleFinishOnboarding('login')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F4F7] text-[#1A1A1A] font-sans antialiased selection:bg-indigo-600 selection:text-white flex items-center justify-center p-0 sm:p-4 md:p-6 lg:p-8">
      {/* Outer Studio Container for Desktop / Tablet */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-center gap-8 lg:gap-12">
        
        {/* Left System Info Panel (Visible on Desktop) */}
        <aside className="hidden lg:flex flex-col w-72 shrink-0 space-y-6 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold tracking-tighter text-[#1A1A1A]">
                NEXA<span className="text-indigo-600">.</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-indigo-600 font-bold px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100">
                Phase 1
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Platform social media modern & ekosistem digital mobile-first untuk pengguna, creator, dan brand.
            </p>
          </div>

          {/* Color Palette Swatches */}
          <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-xs space-y-2.5">
            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
              Design System Palette
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-50 border border-gray-100">
                <div className="w-4 h-4 rounded-md bg-indigo-600 shadow-2xs"></div>
                <span className="text-[11px] font-medium text-gray-700">Indigo</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-50 border border-gray-100">
                <div className="w-4 h-4 rounded-md bg-[#1A1A1A] shadow-2xs"></div>
                <span className="text-[11px] font-medium text-gray-700">Obsidian</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-50 border border-gray-100">
                <div className="w-4 h-4 rounded-md bg-white border border-gray-200"></div>
                <span className="text-[11px] font-medium text-gray-700">Card White</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-50 border border-gray-100">
                <div className="w-4 h-4 rounded-md bg-[#F4F4F7] border border-gray-200"></div>
                <span className="text-[11px] font-medium text-gray-700">Canvas</span>
              </div>
            </div>
          </div>

          {/* Core Foundation Checklist */}
          <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                NEXA Ecosystem
              </span>
              <span className="px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-bold">
                Phase 5
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span>Mobile-First Responsive UX</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span>Hybrid Feed & Video Player</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span>Creator Monetisasi & Endorsement</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span>Dompet & Saldo NEXA</span>
              </div>
              <div className="flex items-center gap-2 font-semibold text-rose-600">
                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                <span>❤️ NEXA MATCH (Cari Jodoh 18+)</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Mobile App Device Shell */}
        <div className="w-full max-w-[440px] h-full sm:h-[880px] sm:max-h-[94vh] bg-[#F4F4F7] rounded-none sm:rounded-[36px] shadow-2xl sm:border sm:border-gray-200/90 flex flex-col relative overflow-hidden">
          
          {/* Top Device Speaker / Status Bar for Desktop */}
          <div className="hidden sm:flex items-center justify-between px-6 pt-3 pb-1 bg-white border-b border-gray-100/60 z-50">
            <span className="text-xs font-bold text-gray-800">9:41</span>
            <div className="w-16 h-4 bg-gray-900 rounded-full flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-black"></div>
            </div>
            <div className="flex items-center gap-1.5 text-gray-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>5G</span>
            </div>
          </div>

          {/* Sticky Header */}
          <Header onOpenAuth={(mode) => setAuthModalMode(mode)} />

          {/* Web Push Notification Opt-in Banner */}
          {isAuthenticated && <NotificationPermissionBanner />}

          {/* Main Content Scroll View */}
          <main className="flex-1 overflow-y-auto px-3 sm:px-4 pt-3 pb-20 no-scrollbar">
            {(activeTab === 'feed' || activeTab === 'home') && <HomeFeed />}
            {activeTab === 'explore' && <ExploreView />}
            {activeTab === 'notifications' && (
              isAuthenticated ? (
                <NotificationsView />
              ) : (
                <div className="py-20 text-center px-6">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-gray-100 flex items-center justify-center mx-auto mb-3 text-slate-900 font-bold">
                    N
                  </div>
                  <h3 className="font-bold text-[#1A1A1A] text-base mb-1">Masuk ke Akun Anda</h3>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto mb-4">
                    Masuk untuk melihat notifikasi suka, komentar, dan pengikut baru Anda.
                  </p>
                  <button
                    onClick={() => setAuthModalMode('login')}
                    className="px-6 py-2.5 rounded-xl bg-[#1A1A1A] hover:bg-slate-800 text-white font-semibold text-xs shadow-xs"
                  >
                    Masuk Sekarang
                  </button>
                </div>
              )
            )}
            {activeTab === 'match' && (
              isAuthenticated ? (
                <MatchView />
              ) : (
                <div className="py-20 text-center px-6 bg-white rounded-3xl border border-rose-100 m-3 shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3 font-bold shadow-sm">
                    ❤️
                  </div>
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <h3 className="font-bold text-[#1A1A1A] text-base">NEXA MATCH</h3>
                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold border border-rose-200">
                      18+ Khusus
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto mb-4">
                    Temukan seseorang yang cocok dengan Anda secara aman, privat, dan terverifikasi.
                  </p>
                  <button
                    onClick={() => setAuthModalMode('login')}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs shadow-md shadow-rose-500/25"
                  >
                    Masuk untuk Mulai Match
                  </button>
                </div>
              )
            )}
            {activeTab === 'profile' && (
              <ProfileView userId={viewingProfileId} />
            )}
            {activeTab === 'wallet' && (
              isAuthenticated ? (
                <WalletView onToast={showToast} />
              ) : (
                <div className="py-20 text-center px-6 bg-white rounded-3xl border border-slate-100 m-3">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 font-bold">
                    N
                  </div>
                  <h3 className="font-bold text-[#1A1A1A] text-base mb-1">Masuk untuk Mengakses Dompet</h3>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto mb-4">
                    Kelola saldo NEXA, top up instan, kirim uang, dan lihat riwayat transaksi Anda.
                  </p>
                  <button
                    onClick={() => setAuthModalMode('login')}
                    className="px-6 py-2.5 rounded-xl bg-[#1A1A1A] hover:bg-slate-800 text-white font-semibold text-xs shadow-xs"
                  >
                    Masuk Sekarang
                  </button>
                </div>
              )
            )}
            {activeTab === 'chat' && (
              isAuthenticated ? (
                <ChatView initialUserId={activeConversationId} />
              ) : (
                <div className="py-20 text-center px-6">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-gray-100 flex items-center justify-center mx-auto mb-3 text-slate-900 font-bold">
                    N
                  </div>
                  <h3 className="font-bold text-[#1A1A1A] text-base mb-1">Masuk untuk Mengirim Pesan</h3>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto mb-4">
                    Terhubung dan bertukar pesan langsung dengan kreator dan pengguna NEXA.
                  </p>
                  <button
                    onClick={() => setAuthModalMode('login')}
                    className="px-6 py-2.5 rounded-xl bg-[#1A1A1A] hover:bg-slate-800 text-white font-semibold text-xs shadow-xs"
                  >
                    Masuk Sekarang
                  </button>
                </div>
              )
            )}
          </main>

          {/* Mobile Bottom Navigation */}
          <BottomNav onOpenAuth={() => setAuthModalMode('login')} />

          {/* Global Modals */}
          {isCreateModalOpen && (
            <CreatePostModal
              isOpen={isCreateModalOpen}
              onClose={() => setIsCreateModalOpen(false)}
              onPostCreated={() => {
                // Post is added to feed by trigger
              }}
            />
          )}

          {shareModalPost && (
            <ShareModal
              post={shareModalPost}
              isOpen={Boolean(shareModalPost)}
              onClose={closeShareModal}
            />
          )}

          <ReportModal />

          {viewingPost && (
            <PostDetailModal
              post={viewingPost}
              onClose={() => setViewingPost(null)}
            />
          )}

          {authModalMode && (
            <AuthModal
              initialMode={authModalMode}
              onClose={() => setAuthModalMode(null)}
            />
          )}

          {isNotificationSettingsOpen && (
            <NotificationSettingsModal
              isOpen={isNotificationSettingsOpen}
              onClose={closeNotificationSettings}
            />
          )}

          {/* Creator Monetization & Endorsement Hub Modal */}
          <CreatorDashboardModal />

          {/* Wallet Modal */}
          {isWalletModalOpen && (
            <div 
              className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden animate-in fade-in duration-200"
              onClick={closeWallet}
            >
              <div 
                className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[94dvh] sm:h-auto sm:max-h-[calc(100dvh-32px)] max-h-[100dvh]"
                onClick={e => e.stopPropagation()}
              >
                <WalletView
                  initialTab={walletInitialTab}
                  onClose={closeWallet}
                  onToast={showToast}
                  isModal={true}
                />
              </div>
            </div>
          )}

          {/* Toast Alert */}
          <Toast />
        </div>

        {/* Right Capabilities Panel (Visible on Wide Desktop) */}
        <aside className="hidden xl:flex flex-col w-72 shrink-0 space-y-4 text-sm">
          <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                NEXA Financial & Creator Core
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            
            <div className="space-y-2 text-xs">
              <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                <span className="font-bold text-[#1A1A1A] block">Saldo & Transfer Instan</span>
                <span className="text-gray-500 text-[11px]">Top up VA/QRIS, kirim sesama/bank, PIN 6-digit</span>
              </div>
              <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                <span className="font-bold text-[#1A1A1A] block">Monetisasi & Endorsement</span>
                <span className="text-gray-500 text-[11px]">1k follow/4k jam, kampanye & escrow saldo</span>
              </div>
              <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                <span className="font-bold text-[#1A1A1A] block">FCM Web Push Engine</span>
                <span className="text-gray-500 text-[11px]">VAPID web push, mileston & interaksi</span>
              </div>
              <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                <span className="font-bold text-[#1A1A1A] block">Hybrid Media Feed</span>
                <span className="text-gray-500 text-[11px]">Video player, thumbnail & feed foto</span>
              </div>
            </div>
          </div>

          {/* Live Server Indicator */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
            <span className="font-semibold">Live Deployment</span>
            <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">
              ACTIVE
            </span>
          </div>
        </aside>

      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
