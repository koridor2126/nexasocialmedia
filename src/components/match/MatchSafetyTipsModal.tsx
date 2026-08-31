import React from 'react';
import { ShieldCheck, AlertTriangle, Eye, Lock, MapPin, X } from 'lucide-react';

interface MatchSafetyTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MatchSafetyTipsModal: React.FC<MatchSafetyTipsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90dvh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">Panduan Keamanan NEXA Match</h3>
              <p className="text-xs text-zinc-500">Kencan & interaksi aman, nyaman, dan bertanggung jawab (18+)</p>
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
        <div className="p-5 overflow-y-auto space-y-4 text-sm text-zinc-700 dark:text-zinc-300">
          {/* Critical Warning */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900 dark:text-amber-200 text-sm mb-1">
                Waspada Penipuan Finansial (Anti-Scam)
              </h4>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                <strong>JANGAN PERNAH</strong> mengirim uang, mentransfer saldo Dompet NEXA, memberikan nomor rekening, PIN, OTP, atau password kepada siapapun yang Anda temui di NEXA Match. Pihak NEXA tidak pernah meminta data rahasia.
              </p>
            </div>
          </div>

          {/* Rule 1 */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
            <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h5 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">Jaga Privasi & Informasi Pribadi</h5>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                Jangan membagikan alamat rumah lengkap, informasi kantor spesifik, atau dokumen identitas di obrolan awal sebelum Anda benar-benar mengenal orang tersebut.
              </p>
            </div>
          </div>

          {/* Rule 2 */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h5 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">Pertemuan Pertama di Tempat Umum</h5>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                Jika memutuskan bertemu langsung, pilih tempat umum yang ramai (misal kafe atau pusat perbelanjaan), gunakan transportasi sendiri, dan beri tahu teman atau keluarga tentang lokasi Anda.
              </p>
            </div>
          </div>

          {/* Rule 3 */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h5 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">Prioritaskan Profil Terverifikasi</h5>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                Cari lencana centang biru (✓ Terverifikasi) untuk memastikan foto profil cocok dengan pemilik akun asli. Anda juga dapat memverifikasi profil Anda sendiri.
              </p>
            </div>
          </div>

          {/* Rule 4 */}
          <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
            <h5 className="font-semibold text-rose-900 dark:text-rose-200 text-sm mb-1">Laporkan & Blokir Akun Mencurigakan</h5>
            <p className="text-xs text-rose-800/80 dark:text-rose-300/80 leading-relaxed">
              Jika ada pengguna yang meminta uang, membagikan tautan mencurigakan, berperilaku kasar, atau menyamar sebagai orang lain, segera gunakan tombol <strong>Laporkan</strong> dan <strong>Blokir</strong> di menu profil mereka.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl text-sm transition shadow-sm"
          >
            Saya Mengerti & Setuju
          </button>
        </div>
      </div>
    </div>
  );
};
