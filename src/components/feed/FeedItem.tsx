import React, { useState } from 'react';
import { Post } from '../../types.js';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { VideoPlayer } from './VideoPlayer.js';
import { CommentDrawer } from './CommentDrawer.js';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreVertical, 
  Trash2, 
  ShieldAlert, 
  Copy, 
  Check, 
  Sparkles,
  BadgeCheck,
  Globe,
  Lock
} from 'lucide-react';
import { motion } from 'motion/react';

interface FeedItemProps {
  post: Post;
  onPostDeleted?: (postId: string) => void;
  onTagClick?: (tag: string) => void;
}

export const FeedItem: React.FC<FeedItemProps> = ({
  post,
  onPostDeleted,
  onTagClick
}) => {
  const { user } = useAuth();
  const { 
    openUserProfile, 
    openShareModal, 
    openReportModal, 
    showToast,
    openPostDetail 
  } = useApp();

  const [isLiked, setIsLiked] = useState<boolean>(Boolean(post.is_liked));
  const [likeCount, setLikeCount] = useState<number>(post.like_count || 0);
  const [commentCount, setCommentCount] = useState<number>(post.comment_count || 0);
  const [shareCount, setShareCount] = useState<number>(post.share_count || 0);
  const [viewCount, setViewCount] = useState<number>(post.view_count || 0);
  const [isCommentDrawerOpen, setIsCommentDrawerOpen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState<boolean>(false);

  const isOwner = user?.id === post.user_id;
  const isAdmin = user?.role === 'admin';

  const handleToggleLike = async () => {
    if (!user) {
      showToast('Silakan masuk untuk menyukai postingan.', 'error');
      return;
    }

    // Optimistic UI
    const prevLiked = isLiked;
    const prevCount = likeCount;

    setIsLiked(!prevLiked);
    setLikeCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);
    if (!prevLiked) {
      setIsLikeAnimating(true);
      setTimeout(() => setIsLikeAnimating(false), 500);
    }

    try {
      const res = await api.toggleLike(post.id);
      setIsLiked(res.isLiked);
      setLikeCount(res.likeCount);
    } catch (err: any) {
      // Revert if error
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      showToast(err.message || 'Gagal mengubah like.', 'error');
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus postingan ini?')) return;
    try {
      await api.deletePost(post.id);
      showToast('Postingan berhasil dihapus.', 'success');
      onPostDeleted?.(post.id);
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus postingan.', 'error');
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)}m yang lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}j yang lalu`;
    return `${Math.floor(diff / 86400)}h yang lalu`;
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('id-ID').format(num || 0);
  };

  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden transition-all hover:border-gray-200 mb-4">
      {/* Post Header */}
      <div className="p-3.5 sm:p-4 flex items-center justify-between">
        <div 
          onClick={() => openUserProfile(post.user_id)}
          className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
        >
          <div className="relative">
            <img
              src={post.user?.avatar_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${post.user_id}`}
              alt={post.user?.username || 'User'}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-indigo-600 transition-all"
            />
            {post.user?.role === 'creator' && (
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[9px] shadow-xs">
                ★
              </span>
            )}
            {post.user?.role === 'brand' && (
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full flex items-center justify-center text-[9px] shadow-xs">
                ◆
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-xs sm:text-sm text-[#1A1A1A] truncate group-hover:text-indigo-600 transition-colors">
                {post.user?.full_name || 'Pengguna NEXA'}
              </span>
              {post.user?.is_verified && (
                <BadgeCheck className="w-4 h-4 text-indigo-600 fill-indigo-50 shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className="font-medium">@{post.user?.username}</span>
              <span>·</span>
              <span>{formatTimeAgo(post.created_at)}</span>
              {post.visibility === 'followers' && (
                <Lock className="w-3 h-3 text-gray-400 ml-0.5" title="Hanya Pengikut" />
              )}
            </div>
          </div>
        </div>

        {/* 3-Dot Options Dropdown */}
        <div className="relative">
          <button
            id={`post-menu-btn-${post.id}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <>
              <div 
                onClick={() => setIsMenuOpen(false)} 
                className="fixed inset-0 z-20" 
              />
              <div className="absolute right-0 top-full mt-1 z-30 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 animate-in fade-in duration-150">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    openShareModal({ ...post, like_count: likeCount, comment_count: commentCount, share_count: shareCount });
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Share2 className="w-3.5 h-3.5 text-gray-400" />
                  <span>Bagikan Link</span>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    openReportModal('post', post.id);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  <span>Laporkan Post</span>
                </button>

                {(isOwner || isAdmin) && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleDeletePost();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-gray-100 mt-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Postingan</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Post Media: Photo or Video */}
      {post.type === 'video' && post.media_url ? (
        <div className="px-3.5 sm:px-4 pb-2">
          <VideoPlayer
            postId={post.id}
            videoUrl={post.media_url}
            thumbnailUrl={post.thumbnail_url}
            viewCount={viewCount}
            likeCount={likeCount}
            commentCount={commentCount}
            shareCount={shareCount}
            onViewIncrement={newViews => setViewCount(newViews)}
          />
        </div>
      ) : post.media_url ? (
        <div 
          onClick={() => openPostDetail({ ...post, is_liked: isLiked, like_count: likeCount, comment_count: commentCount, share_count: shareCount })}
          className="relative w-full max-h-[500px] bg-gray-100 overflow-hidden cursor-pointer"
        >
          <img
            src={post.media_url}
            alt={post.caption || 'NEXA post media'}
            loading="lazy"
            className="w-full h-full object-cover max-h-[500px] hover:scale-[1.01] transition-transform duration-300"
          />
        </div>
      ) : null}

      {/* Post Caption & Hashtags */}
      <div className="px-3.5 sm:px-4 pt-2.5 pb-1">
        {post.caption && (
          <p className="text-xs sm:text-sm text-gray-800 leading-relaxed break-words">
            <span 
              onClick={() => openUserProfile(post.user_id)}
              className="font-bold text-[#1A1A1A] mr-2 cursor-pointer hover:text-indigo-600 hover:underline"
            >
              @{post.user?.username}
            </span>
            {post.caption}
          </p>
        )}

        {/* Clickable Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.hashtags.map((tag, idx) => (
              <button
                key={idx}
                onClick={() => onTagClick?.(tag)}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline bg-indigo-50/70 px-2 py-0.5 rounded-md"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Engagement Action Buttons & Visible Counters */}
      <div className="px-3.5 sm:px-4 py-3 border-t border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Like Button */}
          <button
            id={`post-like-btn-${post.id}`}
            onClick={handleToggleLike}
            className="flex items-center gap-1.5 group select-none"
          >
            <motion.div
              animate={isLikeAnimating ? { scale: [1, 1.4, 0.9, 1] } : {}}
              transition={{ duration: 0.4 }}
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  isLiked
                    ? 'fill-rose-500 text-rose-500'
                    : 'text-gray-400 group-hover:text-rose-500 stroke-[1.8px]'
                }`}
              />
            </motion.div>
            <span className={`text-xs font-semibold ${isLiked ? 'text-rose-600' : 'text-gray-600'}`}>
              {formatNumber(likeCount)}
            </span>
          </button>

          {/* Comment Button */}
          <button
            id={`post-comment-btn-${post.id}`}
            onClick={() => setIsCommentDrawerOpen(true)}
            className="flex items-center gap-1.5 text-gray-500 hover:text-indigo-600 group transition-colors"
          >
            <MessageCircle className="w-5 h-5 stroke-[1.8px]" />
            <span className="text-xs font-semibold text-gray-600 group-hover:text-indigo-600">
              {formatNumber(commentCount)}
            </span>
          </button>

          {/* Share Button */}
          <button
            id={`post-share-btn-${post.id}`}
            onClick={() => openShareModal({ ...post, like_count: likeCount, comment_count: commentCount, share_count: shareCount })}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 group transition-colors"
          >
            <Share2 className="w-5 h-5 stroke-[1.8px]" />
            <span className="text-xs font-semibold text-gray-600 group-hover:text-gray-800">
              {formatNumber(shareCount)}
            </span>
          </button>
        </div>

        {/* View Count Badge for photos */}
        {post.type === 'photo' && viewCount > 0 && (
          <span className="text-[11px] font-medium text-gray-500">
            {formatNumber(viewCount)} tayangan
          </span>
        )}
      </div>

      {/* Comment Drawer Sheet */}
      <CommentDrawer
        post={post}
        isOpen={isCommentDrawerOpen}
        onClose={() => setIsCommentDrawerOpen(false)}
        onCommentCountChange={newCount => setCommentCount(newCount)}
      />
    </article>
  );
};
