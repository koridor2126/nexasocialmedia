import React, { useState, useEffect, useRef } from 'react';
import { Comment, Post } from '../../types.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { X, Send, Trash2, CornerDownRight, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CommentDrawerProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onCommentCountChange?: (newCount: number) => void;
}

export const CommentDrawer: React.FC<CommentDrawerProps> = ({
  post,
  isOpen,
  onClose,
  onCommentCountChange
}) => {
  const { user } = useAuth();
  const { showToast, openUserProfile } = useApp();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && post.id) {
      loadComments();
    }
  }, [isOpen, post.id]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const res = await api.getComments(post.id);
      setComments(res.comments || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || isSubmitting) return;

    if (!user) {
      showToast('Silakan masuk untuk menulis komentar.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createComment(post.id, newCommentText, replyingTo?.id);
      
      // Update local comment tree
      if (replyingTo) {
        setComments(prev =>
          prev.map(c => {
            if (c.id === replyingTo.id) {
              return {
                ...c,
                replies: [...(c.replies || []), res.comment]
              };
            }
            return c;
          })
        );
      } else {
        setComments(prev => [...prev, res.comment]);
      }

      setNewCommentText('');
      setReplyingTo(null);
      
      // Count total comments
      const totalCount = comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0) + 1;
      onCommentCountChange?.(totalCount);
      showToast('Komentar terkirim', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengirim komentar.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.deleteComment(commentId);
      // Remove from top level or replies
      setComments(prev =>
        prev
          .filter(c => c.id !== commentId)
          .map(c => ({
            ...c,
            replies: c.replies?.filter(r => r.id !== commentId)
          }))
      );
      showToast('Komentar dihapus', 'success');
      loadComments();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus komentar.', 'error');
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}j`;
    return `${Math.floor(diff / 86400)}h`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        onClick={onClose} 
        className="absolute inset-0 z-0" 
      />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative z-10 w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl max-h-[85vh] sm:max-h-[80vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden"
      >
        {/* Drag handle for mobile */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-slate-700" />
            <h3 className="font-bold text-slate-900 text-base">Komentar</h3>
            <span className="text-xs text-slate-400 font-medium">({post.comment_count || comments.length})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[250px]">
          {isLoading ? (
            <div className="flex flex-col gap-3 py-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-1.5">
                    <div className="w-24 h-3.5 bg-slate-200 rounded" />
                    <div className="w-full h-3 bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
              <MessageCircle className="w-10 h-10 stroke-[1.5px] mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">Belum ada komentar.</p>
              <p className="text-xs text-slate-400 mt-0.5">Jadilah yang pertama untuk memulai percakapan!</p>
            </div>
          ) : (
            comments.map(c => (
              <div key={c.id} className="space-y-3">
                {/* Main comment */}
                <div className="flex items-start justify-between gap-3 group">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <img
                      src={c.user?.avatar_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${c.user_id}`}
                      alt={c.user?.username || 'User'}
                      onClick={() => {
                        onClose();
                        openUserProfile(c.user_id);
                      }}
                      className="w-8 h-8 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-slate-900 transition-all shrink-0 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span 
                          onClick={() => {
                            onClose();
                            openUserProfile(c.user_id);
                          }}
                          className="text-xs font-bold text-slate-900 cursor-pointer hover:underline"
                        >
                          {c.user?.full_name || 'Pengguna NEXA'}
                        </span>
                        <span className="text-[11px] text-slate-600">@{c.user?.username}</span>
                        <span className="text-[10px] text-slate-600">· {formatTimeAgo(c.created_at)}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 mt-1 break-words leading-relaxed font-normal">
                        {c.content}
                      </p>
                      <button
                        onClick={() => {
                          setReplyingTo({ id: c.id, username: c.user?.username || 'user' });
                          inputRef.current?.focus();
                        }}
                        className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 mt-1 inline-flex items-center gap-1"
                      >
                        <CornerDownRight className="w-3 h-3" /> Balas
                      </button>
                    </div>
                  </div>

                  {/* Delete button if owner or admin */}
                  {(user?.id === c.user_id || user?.role === 'admin') && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 p-1 transition-opacity"
                      title="Hapus komentar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Sub-replies */}
                {c.replies && c.replies.length > 0 && (
                  <div className="pl-10 space-y-2.5 border-l-2 border-slate-100 ml-4">
                    {c.replies.map(rep => (
                      <div key={rep.id} className="flex items-start justify-between gap-2.5 group">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <img
                            src={rep.user?.avatar_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${rep.user_id}`}
                            alt={rep.user?.username}
                            onClick={() => {
                              onClose();
                              openUserProfile(rep.user_id);
                            }}
                            className="w-6 h-6 rounded-full object-cover cursor-pointer shrink-0 mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span 
                                onClick={() => {
                                  onClose();
                                  openUserProfile(rep.user_id);
                                }}
                                className="text-xs font-bold text-slate-900 cursor-pointer hover:underline"
                              >
                                {rep.user?.full_name}
                              </span>
                              <span className="text-[10px] text-slate-600">@{rep.user?.username}</span>
                              <span className="text-[10px] text-slate-600">· {formatTimeAgo(rep.created_at)}</span>
                            </div>
                            <p className="text-xs text-slate-800 mt-0.5 break-words">
                              {rep.content}
                            </p>
                          </div>
                        </div>
                        {(user?.id === rep.user_id || user?.role === 'admin') && (
                          <button
                            onClick={() => handleDeleteComment(rep.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 p-1 transition-opacity"
                            title="Hapus balasan"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100">
          {replyingTo && (
            <div className="flex items-center justify-between px-3 py-1 mb-2 bg-indigo-50/80 rounded-lg text-xs text-indigo-900 font-medium">
              <span>Membalas <strong className="font-semibold">@{replyingTo.username}</strong></span>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-indigo-500 hover:text-indigo-800 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form onSubmit={handleSendComment} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newCommentText}
              onChange={e => setNewCommentText(e.target.value)}
              placeholder={replyingTo ? `Balas @${replyingTo.username}...` : 'Tulis komentar Anda...'}
              className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
            />
            <button
              type="submit"
              disabled={!newCommentText.trim() || isSubmitting}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white disabled:opacity-40 transition-all shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
