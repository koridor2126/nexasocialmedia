import React, { useState, useEffect, useCallback } from 'react';
import { Post, User } from '../../types.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { FeedItem } from './FeedItem.js';
import { 
  Sparkles, 
  Users, 
  Video, 
  RefreshCw, 
  PlusCircle, 
  Compass, 
  Flame,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const HomeFeed: React.FC = () => {
  const { user } = useAuth();
  const { openUserProfile, setIsCreateModalOpen, setActiveTab } = useApp();

  const [posts, setPosts] = useState<Post[]>([]);
  const [creators, setCreators] = useState<User[]>([]);
  const [activeFilter, setActiveFilter] = useState<'for_you' | 'following' | 'videos'>('for_you');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchFeed = useCallback(async () => {
    try {
      const res = await api.getPosts(activeFilter, selectedTag || undefined);
      setPosts(res.posts || []);

      // Also get creators for story carousel
      const exploreRes = await api.getExplore();
      setCreators(exploreRes.creators || []);
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeFilter, selectedTag]);

  useEffect(() => {
    setIsLoading(true);
    fetchFeed();
  }, [fetchFeed]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchFeed();
  };

  const handlePostDeleted = (deletedId: string) => {
    setPosts(prev => prev.filter(p => p.id !== deletedId));
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
  };

  return (
    <div className="pb-24 pt-2">
      {/* Top Stories / Creators Ribbon */}
      <div className="bg-white border border-gray-100 py-3 px-4 mb-3 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Creator & Teman NEXA
          </span>
          <button
            onClick={() => setActiveTab('explore')}
            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Lihat Semua
          </button>
        </div>

        <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar pb-1">
          {/* Add story / my profile shortcut */}
          <div 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex flex-col items-center gap-1 cursor-pointer shrink-0 group"
          >
            <div className="relative w-14 h-14 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 group-hover:border-indigo-600 flex items-center justify-center transition-colors">
              <PlusCircle className="w-6 h-6 text-gray-400 group-hover:text-indigo-600" />
            </div>
            <span className="text-[10px] font-semibold text-gray-700 max-w-[60px] truncate text-center">
              Post Baru
            </span>
          </div>

          {/* Creators list */}
          {creators.map(creator => (
            <div
              key={creator.id}
              onClick={() => openUserProfile(creator.id)}
              className="flex flex-col items-center gap-1 cursor-pointer shrink-0 group"
            >
              <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-amber-500 group-hover:scale-105 transition-transform">
                <img
                  src={creator.avatar_url}
                  alt={creator.username}
                  className="w-13 h-13 rounded-full object-cover border-2 border-white"
                />
              </div>
              <span className="text-[10px] font-semibold text-gray-800 max-w-[64px] truncate text-center">
                {creator.full_name.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Feed Filters Tab */}
      <div className="sticky top-14 z-30 bg-[#F4F4F7]/95 backdrop-blur-md px-0.5 py-2 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-gray-100 shadow-xs">
            <button
              id="feed-tab-foryou"
              onClick={() => {
                setSelectedTag(null);
                setActiveFilter('for_you');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeFilter === 'for_you' && !selectedTag
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Untuk Anda
            </button>
            <button
              id="feed-tab-following"
              onClick={() => {
                setSelectedTag(null);
                setActiveFilter('following');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeFilter === 'following' && !selectedTag
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Mengikuti
            </button>
            <button
              id="feed-tab-videos"
              onClick={() => {
                setSelectedTag(null);
                setActiveFilter('videos');
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeFilter === 'videos' && !selectedTag
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Video</span>
            </button>
          </div>

          <button
            onClick={handleRefresh}
            title="Segarkan Feed"
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-white border border-gray-100 text-gray-500 hover:text-gray-900 shadow-xs transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>

        {/* Selected tag banner */}
        {selectedTag && (
          <div className="mt-2 flex items-center justify-between px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900">
            <span>Menampilkan tag: <strong>#{selectedTag}</strong></span>
            <button
              onClick={() => setSelectedTag(null)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Hapus Filter
            </button>
          </div>
        )}
      </div>

      {/* Main Posts Stream */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(idx => (
            <div key={idx} className="bg-white rounded-3xl p-4 border border-slate-100 space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-28 h-3.5 bg-slate-200 rounded" />
                  <div className="w-16 h-2.5 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="w-full h-56 bg-slate-200 rounded-2xl" />
              <div className="w-3/4 h-3 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center shadow-xs flex flex-col items-center my-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mb-4">
            {activeFilter === 'following' ? <Users className="w-8 h-8" /> : <Compass className="w-8 h-8" />}
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {activeFilter === 'following' ? 'Belum Ada Postingan dari Pengikut' : 'Belum Ada Postingan'}
          </h3>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed mb-5">
            {activeFilter === 'following'
              ? 'Mulai ikuti kreator dan pengguna menarik untuk melihat aktivitas harian mereka di feed ini.'
              : 'Jadilah yang pertama membagikan cerita, foto, atau video inspiratif hari ini.'}
          </p>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
            >
              + Buat Postingan
            </button>
            {activeFilter === 'following' && (
              <button
                onClick={() => setActiveFilter('for_you')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Lihat Feed Untuk Anda
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {posts.map(post => (
            <FeedItem
              key={post.id}
              post={post}
              onPostDeleted={handlePostDeleted}
              onTagClick={handleTagClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};
