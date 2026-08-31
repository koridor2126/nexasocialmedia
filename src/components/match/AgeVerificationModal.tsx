import React, { useState } from 'react';
import { ShieldAlert, Heart, Lock, ArrowRight, X } from 'lucide-react';

interface AgeVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmAge: (dob: string) => void;
}

export const AgeVerificationModal: React.FC<AgeVerificationModalProps> = ({
  isOpen,
  onClose,
  onConfirmAge
}) => {
  const [dob, setDob] = useState('2000-01-01');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const currentAge = calculateAge(dob);
  const isAdult = currentAge >= 18;

  const handleProceed = () => {
    if (!dob) {
      setErrorMsg('Silakan pilih tanggal lahir Anda.');
      return;
    }
    if (!isAdult) {
      setErrorMsg('Maaf, Anda harus berusia minimal 18 tahun untuk menggunakan layanan NEXA Match.');
      return;
    }
    if (!agreedTerms) {
      setErrorMsg('Anda harus menyetujui pedoman keamanan & ketentuan usia 18+.');
      return;
    }

    onConfirmAge(dob);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 relative overflow-hidden">
        {/* Decorative heart glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon Header */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/25 mb-4">
          <Heart className="w-7 h-7 fill-current" />
        </div>

        <div className="space-y-1 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              NEXA MATCH
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-xs font-black border border-rose-200 dark:border-rose-800/40">
              18+ ONLY
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Temukan pasangan dan seseorang yang cocok dengan Anda secara aman, jujur, dan terverifikasi.
          </p>
        </div>

        {/* 18+ Warning Notice */}
        <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/40 mb-4 space-y-2">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Persyaratan Usia Dewasa (18+)</span>
          </div>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Fitur kencan & matching NEXA dirancang khusus untuk pengguna dewasa. Kami menerapkan moderasi ketat terhadap akun di bawah umur, perilaku pelecehan, dan penipuan finansial.
          </p>
        </div>

        {/* DOB Input */}
        <div className="space-y-3 mb-5 text-xs">
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Masukkan Tanggal Lahir Anda:
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => {
                setDob(e.target.value);
                setErrorMsg('');
              }}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between px-1 text-xs">
            <span className="text-zinc-500">Usia Anda saat ini:</span>
            <span className={`font-black text-sm ${isAdult ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {currentAge} Tahun {isAdult ? '✓ (Memenuhi Syarat)' : '✕ (Di Bawah 18)'}
            </span>
          </div>

          {/* Checkbox agreement */}
          <label className="flex items-start gap-2 pt-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreedTerms}
              onChange={(e) => {
                setAgreedTerms(e.target.checked);
                setErrorMsg('');
              }}
              className="mt-0.5 rounded border-zinc-300 text-rose-600 focus:ring-rose-500"
            />
            <span className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
              Saya menyatakan bahwa saya berusia 18 tahun ke atas dan bersedia mematuhi pedoman komunitas NEXA Match.
            </span>
          </label>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[11px] font-semibold">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleProceed}
            disabled={!isAdult || !agreedTerms}
            className="flex-[2] py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold shadow-lg shadow-rose-500/25 transition disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            <span>Lanjutkan ke NEXA Match</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
