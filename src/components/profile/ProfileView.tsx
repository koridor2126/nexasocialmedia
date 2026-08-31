import React, { useState, useEffect } from 'react';
import { User, Post } from '../../types.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { EditProfileModal } from './EditProfileModal.js';
import { FollowListModal } from './FollowListModal.js';
import { 
  BadgeCheck, 
  Calendar, 
  Globe, 
  Grid, 
  Video, 
  Settings, 
  LogOut, 
  MessageSquare, 
  Sparkles, 
  Share2, 
  Heart, 
  Play, 
  ShieldAlert,
  Edit3,
  Bell,
  Award,
  DollarSign,
  ChevronRight,
  TrendingUp,
  Briefcase,
  CheckCircle2,
  Wallet
} from 'lucide-react';

interface ProfileViewProps {
  userId?: string | null;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ userId }) => {
  const { user: currentUser, logout } = useAuth();
  const { 
    openPostDetail, 
    openReportModal, 
    openChatWithUser, 
    openNotificationSettings,
    openCreatorDashboard,
    openWallet,
    openMatch,
    showToast,
    setActiveTab
  } = useApp();

  const targetId = userId || currentUser?.id;
  const isOwnProfile = currentUser?.id === targetId;

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTabFilter] = useState<'posts' | 'videos'>('posts');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [likesReceivedCount, setLikesReceivedCount] = useState<number>(0);

  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [followModalType, setFollowModalType] = useState<'followers' | 'following' | null>(null);

  useEffect(() => {
    if (targetId) {
      loadProfile();
    }
  }, [targetId]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const res = await api.getUserProfile(targetId!);
      setProfileUser(res.user);
      setPosts(res.posts || []);
      setIsFollowing(Boolean(res.is_following));
      setFollowersCount(res.followers_count || 0);
      setFollowingCount(res.following_count || 0);

      // Calculate total likes received across all posts
      const totalLikes = (res.posts || []).reduce((acc: number, p: Post) => acc + (p.like_count || 0), 0);
      setLikesReceivedCount(totalLikes);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser) {
      showToast('Silakan masuk untuk mengikuti pengguna ini.', 'error');
      return;
    }
    if (!targetId) return;

    try {
      const res = await api.toggleFollow(targetId);
      setIsFollowing(res.isFollowing);
      setFollowersCount(res.followersCount);
      showToast(res.isFollowing ? 'Berhasil mengikuti akun ini' : 'Berhenti mengikuti', 'info');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah ikuti.', 'error');
    }
  };

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari akun NEXA?')) {
      logout();
      showToast('Anda telah keluar dari akun NEXA.', 'info');
    }
  };

  const formatJoinDate = (dateStr?: string) => {
    if (!dateStr) return 'Maret 2024';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('id-ID').format(num || 0);
  };

  if (isLoading) {
    return (
      <div className="pb-24 pt-4 px-4 space-y-4">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 animate-pulse space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-18 h-18 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="w-32 h-4 bg-slate-200 rounded" />
              <div className="w-20 h-3 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Pengguna tidak ditemukan.</p>
      </div>
    );
  }

  const filteredPosts = activeTab === 'videos' ? posts.filter(p => p.type === 'video') : posts;

  return (
    <div className="pb-24 pt-2">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-5 sm:p-6 mb-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          {/* Avatar with role ring */}
          <div className="relative">
            <img
              src={profileUser.avatar_url}
              alt={profileUser.username}
              className="w-18 h-18 sm:w-20 sm:h-20 rounded-full object-cover ring-4 ring-slate-100 shadow-xs"
            />
            {profileUser.role === 'creator' && (
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-indigo-600 text-white rounded-full text-[9px] font-bold shadow-xs">
                Creator
              </span>
            )}
            {profileUser.role === 'brand' && (
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-amber-500 text-white rounded-full text-[9px] font-bold shadow-xs">
                Brand
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {isOwnProfile ? (
              <>
                <button
                  id="profile-edit-btn"
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profil</span>
                </button>
                <button
                  id="profile-notification-settings-btn"
                  onClick={openNotificationSettings}
                  title="Pengaturan Notifikasi & Push"
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                </button>
                <button
                  id="profile-logout-btn"
                  onClick={handleLogout}
                  title="Keluar"
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  id="profile-follow-btn"
                  onClick={handleFollowToggle}
                  className={`px-4 py-2 rounded-xl font-semibold text-xs transition-all shadow-xs ${
                    isFollowing
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {isFollowing ? 'Mengikuti' : 'Ikuti'}
                </button>
                <button
                  onClick={() => openChatWithUser(profileUser.id)}
                  title="Kirim Pesan"
                  className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openReportModal('user', profileUser.id)}
                  title="Laporkan Pengguna"
                  className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <ShieldAlert className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* User Identity */}
        <div className="space-y-1 mb-4">
          <div className="flex items-center gap-1.5">
            <h2 className="font-extrabold text-base sm:text-lg text-slate-900">
              {profileUser.full_name}
            </h2>
            {profileUser.is_verified && (
              <BadgeCheck className="w-4 h-4 text-indigo-600 fill-indigo-50" />
            )}
          </div>
          <p className="text-xs text-slate-600 font-medium">@{profileUser.username}</p>
        </div>

        {/* Bio & Details */}
        {profileUser.bio && (
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-3 break-words">
            {profileUser.bio}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-600 mb-5">
          {profileUser.website && (
            <a
              href={profileUser.website.startsWith('http') ? profileUser.website : `https://${profileUser.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-indigo-600 hover:underline font-medium"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{profileUser.website.replace(/^https?:\/\//, '')}</span>
            </a>
          )}
          <div className="flex items-center gap-1 text-slate-600">
            <Calendar className="w-3.5 h-3.5" />
            <span>Bergabung {formatJoinDate(profileUser.created_at)}</span>
          </div>
        </div>

        {/* Social Metrics Counter Bar */}
        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-center">
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-extrabold text-slate-900">
              {formatNumber(posts.length)}
            </span>
            <span className="text-[10px] text-slate-600 uppercase font-semibold">Post</span>
          </div>

          <button
            onClick={() => setFollowModalType('followers')}
            className="flex flex-col hover:opacity-75 transition-opacity"
          >
            <span className="text-sm sm:text-base font-extrabold text-slate-900">
              {formatNumber(followersCount)}
            </span>
            <span className="text-[10px] text-slate-600 uppercase font-semibold">Pengikut</span>
          </button>

          <button
            onClick={() => setFollowModalType('following')}
            className="flex flex-col hover:opacity-75 transition-opacity"
          >
            <span className="text-sm sm:text-base font-extrabold text-slate-900">
              {formatNumber(followingCount)}
            </span>
            <span className="text-[10px] text-slate-600 uppercase font-semibold">Mengikuti</span>
          </button>

          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-extrabold text-rose-600">
              {formatNumber(likesReceivedCount)}
            </span>
            <span className="text-[10px] text-slate-600 uppercase font-semibold">Suka</span>
          </div>
        </div>

        {/* Creator Center Entry Banner (If viewing own profile) */}
        {isOwnProfile && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
            {/* NEXA MATCH Card */}
            <button
              id="profile-open-match-btn"
              onClick={() => openMatch('discover')}
              className="w-full p-3.5 rounded-2xl bg-white border border-rose-200/80 hover:border-rose-300 flex items-center justify-between shadow-2xs transition-all group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center font-bold shadow-sm shadow-rose-500/20">
                  <Heart className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-900 tracking-tight">❤️ NEXA MATCH</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-bold">
                      18+ Khusus
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Temukan seseorang yang cocok dengan Anda.</p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all text-xs font-bold">
                <span>Buka</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            {/* Dompet & Saldo NEXA Card */}
            <button
              id="profile-open-wallet-btn"
              onClick={() => openWallet('overview')}
              className="w-full p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-300 flex items-center justify-between shadow-2xs transition-all group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-900 tracking-tight">Dompet & Saldo NEXA</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[9px] font-bold">
                      Keuangan
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Isi saldo, kirim uang sesama/bank, dan kelola PIN</p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all text-xs font-bold">
                <span>Buka</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            {/* Pusat Kreator & Monetisasi Card */}
            <button
              id="profile-open-creator-hub-btn"
              onClick={openCreatorDashboard}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shadow-xs hover:opacity-95 transition-all group"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white tracking-tight">Pusat Kreator & Monetisasi</span>
                    {currentUser?.monetization_status === 'active' ? (
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold">
                        Aktif
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold">
                        1k/4k Syarat
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300">Kelola endorsement brand, jam tayang, dan penghasilan</p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-slate-300 group-hover:translate-x-0.5 transition-transform text-xs font-semibold">
                <span>Buka</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Profile Content Tabs */}
      <div className="flex items-center justify-center gap-3 bg-white p-1 rounded-2xl border border-slate-100 shadow-2xs mb-3">
        <button
          onClick={() => setActiveTabFilter('posts')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'posts'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Semua Post ({posts.length})</span>
        </button>
        <button
          onClick={() => setActiveTabFilter('videos')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'videos'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Video ({posts.filter(p => p.type === 'video').length})</span>
        </button>
      </div>

      {/* Posts Media Grid */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center text-slate-400">
          <p className="text-xs font-medium text-slate-500">
            {activeTab === 'videos' ? 'Belum ada video yang diunggah.' : 'Belum ada postingan.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 rounded-2xl overflow-hidden">
          {filteredPosts.map(post => (
            <div
              key={post.id}
              onClick={() => openPostDetail(post)}
              className="relative aspect-square bg-slate-100 cursor-pointer group overflow-hidden"
            >
              {post.thumbnail_url || post.media_url ? (
                <img
                  src={post.thumbnail_url || post.media_url}
                  alt={post.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full p-2 bg-slate-900 text-white text-[10px] flex items-center justify-center text-center font-medium">
                  {post.caption?.slice(0, 30)}...
                </div>
              )}

              {post.type === 'video' && (
                <div className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 text-white backdrop-blur-xs flex items-center gap-1 text-[10px]">
                  <Play className="w-3 h-3 fill-current" />
                  <span>{formatNumber(post.view_count || 0)}</span>
                </div>
              )}

              <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold">
                <span>❤️ {post.like_count || 0}</span>
                <span>💬 {post.comment_count || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onProfileUpdated={(updated) => setProfileUser(updated)}
        />
      )}

      {/* Followers / Following Modal */}
      {followModalType && (
        <FollowListModal
          userId={targetId!}
          type={followModalType}
          isOpen={Boolean(followModalType)}
          onClose={() => setFollowModalType(null)}
        />
      )}
    </div>
  );
};
