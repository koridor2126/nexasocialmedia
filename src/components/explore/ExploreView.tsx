import React, { useState, useEffect } from 'react';
import { User, Post } from '../../types.js';
import { api } from '../../services/api.js';
import { useApp } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Search, Hash, Users, Sparkles, Video, Play, Flame, UserCheck, UserPlus, X } from 'lucide-react';

export const ExploreView: React.FC = () => {
  const { openUserProfile, openPostDetail, showToast } = useApp();
  const { user: currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<{
    users: (User & { is_following?: boolean })[];
    posts: Post[];
    hashtags: { tag: string; count: number }[];
  } | null>(null);

  const [explorePosts, setExplorePosts] = useState<Post[]>([]);
  const [creators, setCreators] = useState<User[]>([]);
  const [trendingTags, setTrendingTags] = useState<{ tag: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadExploreData();
  }, []);

  const loadExploreData = async () => {
    setIsLoading(true);
    try {
      const res = await api.getExplore();
      setExplorePosts(res.posts || []);
      setCreators(res.creators || []);
      setTrendingTags(res.trending_hashtags || []);
    } catch (err) {
      console.error('Explore load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await api.search(searchQuery.trim());
        setSearchResults(results);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleFollowToggle = async (e: React.MouseEvent, targetUserId: string) => {
    e.stopPropagation();
    if (!currentUser) {
      showToast('Silakan masuk untuk mengikuti akun ini.', 'error');
      return;
    }

    try {
      const res = await api.toggleFollow(targetUserId);
      setFollowingMap(prev => ({
        ...prev,
        [targetUserId]: res.isFollowing
      }));
      showToast(res.isFollowing ? 'Berhasil mengikuti' : 'Berhenti mengikuti', 'info');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah status ikuti.', 'error');
    }
  };

  return (
    <div className="pb-24 pt-2">
      {/* Search Bar */}
      <div className="sticky top-14 z-30 bg-[#f8fafc]/95 backdrop-blur-md px-1 py-2 mb-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="explore-search-input"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari kreator, nama, atau #hashtag..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white border border-slate-200/90 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-2xs transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* SEARCH RESULTS VIEW */}
      {searchQuery.trim() ? (
        <div className="space-y-4 animate-in fade-in duration-150">
          {isSearching ? (
            <div className="p-8 text-center text-xs text-slate-400">
              <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-2" />
              Mencari di NEXA...
            </div>
          ) : searchResults ? (
            <>
              {/* Users Result */}
              {searchResults.users.length > 0 && (
                <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Pengguna & Kreator ({searchResults.users.length})
                  </h3>
                  <div className="space-y-2.5">
                    {searchResults.users.map(u => (
                      <div
                        key={u.id}
                        onClick={() => openUserProfile(u.id)}
                        className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={u.avatar_url}
                            alt={u.username}
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 block truncate">
                              {u.full_name}
                            </span>
                            <span className="text-[11px] text-slate-400">@{u.username}</span>
                          </div>
                        </div>

                        {currentUser && currentUser.id !== u.id && (
                          <button
                            onClick={e => handleFollowToggle(e, u.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                              followingMap[u.id] !== undefined ? followingMap[u.id] : u.is_following
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-slate-900 text-white shadow-xs'
                            }`}
                          >
                            {(followingMap[u.id] !== undefined ? followingMap[u.id] : u.is_following)
                              ? 'Mengikuti'
                              : 'Ikuti'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hashtags Result */}
              {searchResults.hashtags.length > 0 && (
                <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-2">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-indigo-600" />
                    Topik & Hashtag ({searchResults.hashtags.length})
                  </h3>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {searchResults.hashtags.map((h, i) => (
                      <button
                        key={i}
                        onClick={() => setSearchQuery(h.tag)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <span>#{h.tag}</span>
                        <span className="text-[10px] text-indigo-400 font-normal">({h.count})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Posts */}
              {searchResults.posts.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-2">
                    Postingan ({searchResults.posts.length})
                  </h3>
                  <div className="grid grid-cols-3 gap-1 rounded-2xl overflow-hidden">
                    {searchResults.posts.map(p => (
                      <div
                        key={p.id}
                        onClick={() => openPostDetail(p)}
                        className="relative aspect-square bg-slate-100 cursor-pointer group overflow-hidden"
                      >
                        {p.thumbnail_url || p.media_url ? (
                          <img
                            src={p.thumbnail_url || p.media_url}
                            alt={p.caption}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full p-2 bg-slate-900 text-white text-[10px] flex items-center justify-center text-center font-medium">
                            {p.caption?.slice(0, 30)}...
                          </div>
                        )}
                        {p.type === 'video' && (
                          <div className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 text-white backdrop-blur-xs">
                            <Play className="w-3 h-3 fill-current" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                searchResults.users.length === 0 && searchResults.hashtags.length === 0 && (
                  <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center text-slate-400">
                    <p className="text-sm font-semibold text-slate-700">Tidak ada hasil ditemukan.</p>
                    <p className="text-xs text-slate-400 mt-1">Coba kata kunci lain atau periksa ejaan.</p>
                  </div>
                )
              )}
            </>
          ) : null}
        </div>
      ) : (
        /* EXPLORE DEFAULT VIEW (Trending + Creators + Grid) */
        <div className="space-y-5">
          {/* Trending Hashtags */}
          {trendingTags.length > 0 && (
            <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-2xs">
              <div className="flex items-center gap-1.5 mb-3">
                <Flame className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Sedang Tren di NEXA
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingTags.map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSearchQuery(t.tag)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span className="text-indigo-600">#</span>
                    <span>{t.tag}</span>
                    <span className="text-[10px] text-slate-400 font-normal">· {t.count} post</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Creators */}
          {creators.length > 0 && (
            <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Rekomendasi Kreator
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {creators.slice(0, 4).map(c => (
                  <div
                    key={c.id}
                    onClick={() => openUserProfile(c.id)}
                    className="p-3 rounded-2xl bg-slate-50/80 hover:bg-slate-100/80 border border-slate-100 flex flex-col items-center text-center cursor-pointer transition-all"
                  >
                    <img
                      src={c.avatar_url}
                      alt={c.username}
                      className="w-12 h-12 rounded-full object-cover mb-2 ring-2 ring-white shadow-xs"
                    />
                    <span className="font-bold text-xs text-slate-900 truncate w-full">
                      {c.full_name}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate w-full">
                      @{c.username}
                    </span>
                    <button
                      onClick={e => handleFollowToggle(e, c.id)}
                      className={`mt-2.5 w-full py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        followingMap[c.id]
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-slate-900 text-white shadow-xs'
                      }`}
                    >
                      {followingMap[c.id] ? 'Mengikuti' : 'Ikuti'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explore Media Grid */}
          <div className="space-y-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-2">
              Jelajahi Media
            </span>
            <div className="grid grid-cols-3 gap-1 rounded-2xl overflow-hidden">
              {explorePosts.map(post => (
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
                      {post.caption?.slice(0, 35)}...
                    </div>
                  )}

                  {post.type === 'video' && (
                    <div className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 text-white backdrop-blur-xs">
                      <Play className="w-3 h-3 fill-current" />
                    </div>
                  )}

                  {/* Hover stats overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-xs font-bold">
                    <span>❤️ {post.like_count || 0}</span>
                    <span>💬 {post.comment_count || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
