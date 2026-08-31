import React from 'react';
import { Post } from '../../types.js';
import { FeedItem } from './FeedItem.js';
import { X } from 'lucide-react';
import { motion } from 'motion/react';

interface PostDetailModalProps {
  post: Post | null;
  onClose: () => void;
  onPostDeleted?: (postId: string) => void;
  onTagClick?: (tag: string) => void;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  onClose,
  onPostDeleted,
  onTagClick
}) => {
  if (!post) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div onClick={onClose} className="absolute inset-0" />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto"
      >
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-slate-100 rounded-t-3xl">
          <span className="font-bold text-sm text-slate-900">Detail Postingan</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3">
          <FeedItem
            post={post}
            onPostDeleted={(id) => {
              onPostDeleted?.(id);
              onClose();
            }}
            onTagClick={(tag) => {
              onTagClick?.(tag);
              onClose();
            }}
          />
        </div>
      </motion.div>
    </div>
  );
};
