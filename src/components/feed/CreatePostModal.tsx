import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { Post, PostType, PostVisibility } from '../../types.js';
import { 
  X, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Globe, 
  Lock, 
  Sparkles, 
  Hash, 
  Upload, 
  Check, 
  Play 
} from 'lucide-react';
import { motion } from 'motion/react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (newPost: Post) => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onPostCreated
}) => {
  const { user } = useAuth();
  const { showToast } = useApp();

  const [postType, setPostType] = useState<PostType>('photo');
  const [caption, setCaption] = useState<string>('');
  const [hashtagsInput, setHashtagsInput] = useState<string>('');
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  const [mediaDataUrl, setMediaDataUrl] = useState<string | null>(null);
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 25MB for smooth browser handling)
    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('Ukuran file maksimal 25MB.');
      return;
    }

    const isVideo = file.type.startsWith('video/');
    setPostType(isVideo ? 'video' : 'photo');
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result as string;
      setMediaDataUrl(result);

      if (isVideo) {
        // Generate auto thumbnail using video element and canvas
        generateVideoThumbnail(result);
      } else {
        setThumbnailDataUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const generateVideoThumbnail = (videoSrc: string) => {
    const video = document.createElement('video');
    video.src = videoSrc;
    video.currentTime = 1;
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumb = canvas.toDataURL('image/jpeg', 0.8);
          setThumbnailDataUrl(thumb);
        }
      } catch (e) {
        console.warn('Auto thumbnail generation fallback:', e);
      }
    };
  };

  const handlePresetSampleMedia = (type: 'photo' | 'video', url: string, thumb?: string) => {
    setPostType(type);
    setMediaDataUrl(url);
    setThumbnailDataUrl(thumb || url);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim() && !mediaDataUrl) {
      setErrorMsg('Harap tambahkan teks atau unggah media foto/video.');
      return;
    }

    if (!user) {
      showToast('Silakan masuk terlebih dahulu untuk membuat postingan.', 'error');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    // Extract hashtags
    const rawTags = hashtagsInput
      .split(/[\s,#]+/)
      .filter(t => t.trim().length > 0)
      .map(t => t.trim().toLowerCase());

    try {
      const res = await api.createPost({
        type: postType,
        caption: caption.trim(),
        hashtags: rawTags,
        media_url: mediaDataUrl || undefined,
        thumbnail_url: thumbnailDataUrl || mediaDataUrl || undefined,
        visibility
      });

      showToast('Postingan Anda berhasil dibagikan ke NEXA!', 'success');
      onPostCreated(res.post);
      
      // Reset form
      setCaption('');
      setHashtagsInput('');
      setMediaDataUrl(null);
      setThumbnailDataUrl(null);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal membuat postingan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div onClick={onClose} className="absolute inset-0" />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative z-10 w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              +
            </div>
            <h2 className="font-bold text-slate-900 text-base sm:text-lg">Buat Postingan Baru</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User preview header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <img
              src={user?.avatar_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${user?.username || 'me'}`}
              alt={user?.username || 'You'}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100"
            />
            <div>
              <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                {user?.full_name || 'Pengguna NEXA'}
              </span>
              <span className="text-[11px] text-slate-600">@{user?.username}</span>
            </div>
          </div>

          {/* Visibility Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setVisibility('public')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                visibility === 'public'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Publik</span>
            </button>
            <button
              type="button"
              onClick={() => setVisibility('followers')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                visibility === 'followers'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Pengikut</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
          {/* Caption textarea */}
          <div>
            <textarea
              rows={3}
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Apa yang ingin Anda bagikan hari ini? Ceritakan ide atau momen Anda..."
              className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all resize-none"
            />
          </div>

          {/* Media Preview Box */}
          {mediaDataUrl ? (
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 max-h-64 flex items-center justify-center group">
              {postType === 'video' ? (
                <video
                  src={mediaDataUrl}
                  controls
                  className="max-h-64 w-full object-contain"
                />
              ) : (
                <img
                  src={mediaDataUrl}
                  alt="Upload preview"
                  className="max-h-64 w-full object-contain"
                />
              )}
              <button
                type="button"
                onClick={() => {
                  setMediaDataUrl(null);
                  setThumbnailDataUrl(null);
                }}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 hover:bg-black text-white backdrop-blur-xs transition-colors shadow-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Upload Drop Area */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/60 hover:bg-slate-50 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-600 mb-2 group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6 text-slate-700" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                Pilih atau Tarik Foto / Video
              </span>
              <span className="text-[11px] text-slate-600 mt-0.5">
                Mendukung format JPG, PNG, WebP, MP4, MOV (Maks 25MB)
              </span>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Quick presets for testing */}
          {!mediaDataUrl && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
              <span className="text-[11px] text-slate-600 font-semibold shrink-0">Contoh Media:</span>
              <button
                type="button"
                onClick={() =>
                  handlePresetSampleMedia(
                    'video',
                    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80'
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold shrink-0"
              >
                + Video Pantai
              </button>
              <button
                type="button"
                onClick={() =>
                  handlePresetSampleMedia(
                    'photo',
                    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&auto=format&fit=crop&q=80'
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold shrink-0"
              >
                + Foto Workspace
              </button>
            </div>
          )}

          {/* Hashtags input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-indigo-600" />
              Hashtag (Pisahkan dengan spasi atau koma)
            </label>
            <input
              type="text"
              value={hashtagsInput}
              onChange={e => setHashtagsInput(e.target.value)}
              placeholder="contoh: nexa, tech, creative, design"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Submit button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Batal
            </button>
            <button
              id="create-post-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white text-xs sm:text-sm font-semibold shadow-md shadow-slate-900/10 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Menerbitkan...' : 'Bagikan Sekarang'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
