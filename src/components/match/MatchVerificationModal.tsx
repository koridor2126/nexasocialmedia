import React, { useState } from 'react';
import { CheckCircle, Camera, X, Shield, Sparkles, Upload } from 'lucide-react';
import { matchApi } from '../../services/api.js';
import { useApp } from '../../context/AppContext.js';
import { MatchProfile } from '../../types.js';

interface MatchVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerifiedRequested: (updatedProfile: MatchProfile) => void;
}

const SAMPLE_VERIFY_IMAGES = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80'
];

export const MatchVerificationModal: React.FC<MatchVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerifiedRequested
}) => {
  const { showToast } = useApp();
  const [photoUrl, setPhotoUrl] = useState(SAMPLE_VERIFY_IMAGES[0]);
  const [customUrl, setCustomUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalPhoto = customUrl.trim() || photoUrl;
    if (!finalPhoto) {
      showToast('Harap pilih atau masukkan foto selfie untuk verifikasi.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await matchApi.requestVerification(finalPhoto);
      showToast(res.message, 'success');
      onVerifiedRequested(res.profile);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengajukan verifikasi.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90dvh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base flex items-center gap-1.5">
                Verifikasi Foto Profil <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </h3>
              <p className="text-xs text-zinc-500">Dapatkan lencana centang biru resmi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-blue-900 dark:text-blue-200 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Mengapa Verifikasi Itu Penting?
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Profil dengan lencana biru mendapatkan <strong>3x lebih banyak respon</strong> dan membangun rasa saling percaya bahwa Anda adalah orang sungguhan.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
              PILIH CONTOH SELFIE / UNGGAH FOTO:
            </label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {SAMPLE_VERIFY_IMAGES.map((img, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    setPhotoUrl(img);
                    setCustomUrl('');
                  }}
                  className={`relative rounded-xl overflow-hidden aspect-square border-2 transition ${
                    photoUrl === img && !customUrl
                      ? 'border-blue-600 ring-2 ring-blue-500/20'
                      : 'border-zinc-200 dark:border-zinc-700 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Sample ${idx}`} className="w-full h-full object-cover" />
                  {photoUrl === img && !customUrl && (
                    <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <span className="text-zinc-500 font-medium">Atau masukkan URL foto selfie:</span>
              <div className="relative">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <Camera className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl space-y-1 text-zinc-500">
            <div className="font-semibold text-zinc-700 dark:text-zinc-300">Petunjuk Foto Verifikasi:</div>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
              <li>Wajah terlihat jelas tanpa kacamata hitam atau masker</li>
              <li>Pencahayaan terang dan tidak buram</li>
              <li>Foto selfie pose natural menghadap kamera</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition shadow-sm flex items-center gap-1.5"
            >
              {isSubmitting ? 'Mengirim...' : (
                <>
                  <Upload className="w-3.5 h-3.5" /> Ajukan Verifikasi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
