import React, { useState } from 'react';
import { Post } from '../../types.js';
import { api } from '../../services/api.js';
import { useApp } from '../../context/AppContext.js';
import { X, Copy, Check, Share2, Link as LinkIcon, Send } from 'lucide-react';
import { motion } from 'motion/react';

interface ShareModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onShareSuccess?: (newCount: number) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  post,
  isOpen,
  onClose,
  onShareSuccess
}) => {
  const { showToast } = useApp();
  const [isCopied, setIsCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const postUrl = `${window.location.origin}/#post-${post.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setIsCopied(true);
      showToast('Tautan postingan berhasil disalin ke clipboard!', 'success');

      // Record share
      const res = await api.recordShare(post.id);
      if (res.share_count) {
        onShareSuccess?.(res.share_count);
      }

      setTimeout(() => {
        setIsCopied(false);
        onClose();
      }, 1200);
    } catch (err) {
      showToast('Gagal menyalin tautan.', 'error');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Postingan oleh @${post.user?.username || 'NEXA'}`,
          text: post.caption || 'Lihat postingan ini di NEXA Social Platform',
          url: postUrl
        });
        const res = await api.recordShare(post.id);
        if (res.share_count) {
          onShareSuccess?.(res.share_count);
        }
        showToast('Berhasil membagikan postingan!', 'success');
        onClose();
      } catch (err) {
        // user aborted share
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div onClick={onClose} className="absolute inset-0" />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative z-10 w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-slate-800" />
            <h3 className="font-bold text-slate-900 text-base">Bagikan Postingan</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Post Preview Thumbnail & Snippet */}
        <div className="p-3 bg-slate-50 rounded-2xl flex items-center gap-3 mb-5 border border-slate-100">
          {post.thumbnail_url || post.media_url ? (
            <img
              src={post.thumbnail_url || post.media_url}
              alt="Post preview"
              className="w-12 h-12 rounded-xl object-cover shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400 shrink-0 font-bold">
              N
            </div>
          )}
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-slate-900 block truncate">
              {post.user?.full_name || 'Pengguna NEXA'}
            </span>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {post.caption || 'Tanpa teks'}
            </p>
          </div>
        </div>

        {/* Share Action Buttons */}
        <div className="flex flex-col gap-2.5">
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>Bagikan Lewat Aplikasi Lain</span>
            </button>
          )}

          <button
            onClick={handleCopyLink}
            className={`w-full py-3 px-4 rounded-xl border font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              isCopied
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <LinkIcon className="w-4 h-4" />}
            <span>{isCopied ? 'Tautan Tersalin!' : 'Salin Tautan Postingan'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
