import React, { useState, useRef } from 'react';
import { User } from '../../types.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { X, Camera, Globe, Sparkles, Upload, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: (user: User) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated
}) => {
  const { user, updateUser } = useAuth();
  const { showToast } = useApp();

  const [fullName, setFullName] = useState<string>(user?.full_name || '');
  const [bio, setBio] = useState<string>(user?.bio || '');
  const [website, setWebsite] = useState<string>(user?.website || '');
  const [category, setCategory] = useState<string>(user?.category || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatar_url || '');
  const [coverUrl, setCoverUrl] = useState<string>(user?.cover_url || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setAvatarUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('Nama lengkap tidak boleh kosong.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.updateProfile({
        full_name: fullName.trim(),
        bio: bio.trim(),
        website: website.trim(),
        category: category.trim(),
        avatar_url: avatarUrl,
        cover_url: coverUrl
      });

      updateUser(res.user);
      onProfileUpdated(res.user);
      showToast('Profil Anda berhasil diperbarui!', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui profil.', 'error');
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
        className="relative z-10 w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base">Edit Profil NEXA</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Avatar Edit Section */}
          <div className="flex flex-col items-center gap-2">
            <div 
              onClick={() => avatarInputRef.current?.click()}
              className="relative w-20 h-20 rounded-full overflow-hidden cursor-pointer group ring-4 ring-slate-100"
            >
              <img
                src={avatarUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${user?.username}`}
                alt="Avatar Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Camera className="w-6 h-6" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Ubah Foto Profil
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarFileSelect}
              className="hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Bio / Deskripsi Profil
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Ceritakan tentang Anda, minat, atau karya..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              Situs Web / Portofolio (Opsional)
            </label>
            <input
              type="url"
              value={website}
              onChange={e => setWebsite(e.target.value)}
              placeholder="https://portofolio.anda"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
