import React, { useState } from 'react';
import { AlertCircle, X, ShieldAlert } from 'lucide-react';
import { MatchReportCategory } from '../../types.js';
import { matchApi } from '../../services/api.js';
import { useApp } from '../../context/AppContext.js';

interface MatchReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUserName: string;
  onReported?: () => void;
}

const REPORT_CATEGORIES: { key: MatchReportCategory; label: string; desc: string }[] = [
  { key: 'scam_financial', label: 'Penipuan / Meminta Uang', desc: 'Meminta transfer dana, pinjaman, investasi bodong, atau informasi rekening' },
  { key: 'fake_profile', label: 'Profil Palsu / Catfishing', desc: 'Menggunakan foto orang lain, data identitas palsu, atau impersonasi' },
  { key: 'harassment', label: 'Pelecehan / Kata-kata Kasar', desc: 'Mengirim pesan yang mengintimidasi, mengancam, atau merendahkan martabat' },
  { key: 'inappropriate_content', label: 'Konten Vulgar / Tidak Pantas', desc: 'Foto tidak senonoh, pornografi, atau konten yang melanggar norma' },
  { key: 'underage', label: 'Pengguna di Bawah Umur (< 18 Tahun)', desc: 'Pengguna yang diduga belum berusia 18 tahun' },
  { key: 'spam_bot', label: 'Spam / Akun Bot / Promosi Iklan', desc: 'Mengirim tautan promosi otomatis atau spam massal' },
  { key: 'other', label: 'Pelanggaran Lainnya', desc: 'Pelanggaran ketentuan layanan NEXA Match lainnya' }
];

export const MatchReportModal: React.FC<MatchReportModalProps> = ({
  isOpen,
  onClose,
  targetUserId,
  targetUserName,
  onReported
}) => {
  const { showToast } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<MatchReportCategory>('scam_financial');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      showToast('Harap jelaskan alasan laporan Anda.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await matchApi.reportProfile(targetUserId, selectedCategory, reason.trim());
      showToast('Laporan Anda berhasil dikirim dan akan segera ditinjau tim moderasi.', 'success');
      onReported?.();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengirim laporan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90dvh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">Laporkan Profil</h3>
              <p className="text-xs text-zinc-500">Laporkan pengguna: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{targetUserName}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-sm flex-1">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              PILIH KATEGORI PELANGGARAN
            </label>
            <div className="space-y-2">
              {REPORT_CATEGORIES.map(cat => (
                <label
                  key={cat.key}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    selectedCategory === cat.key
                      ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200'
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="report_category"
                    value={cat.key}
                    checked={selectedCategory === cat.key}
                    onChange={() => setSelectedCategory(cat.key)}
                    className="mt-1 accent-rose-600"
                  />
                  <div className="text-xs">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">{cat.label}</div>
                    <div className="text-zinc-500 dark:text-zinc-400 mt-0.5">{cat.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              JELASKAN DETAIL KEJADIAN
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Berikan detail informasi tambahan seperti waktu, perilaku, atau bukti agar kami dapat menindaklanjuti secara cepat..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none resize-none"
              required
            />
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl text-xs text-zinc-500 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
            <span>Laporan Anda dijaga kerahasiaannya. Pengguna yang dilaporkan tidak akan mengetahui siapa yang melaporkan.</span>
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
              className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition shadow-sm"
            >
              {isSubmitting ? 'Mengirim Laporan...' : 'Kirim Laporan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
