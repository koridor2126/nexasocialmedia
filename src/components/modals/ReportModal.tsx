import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export const ReportModal: React.FC = () => {
  const { reportModalData, closeReportModal, showToast } = useApp();
  const [selectedReason, setSelectedReason] = useState<string>('Konten tidak pantas atau vulgar');
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!reportModalData) return null;

  const reasons = [
    'Konten tidak pantas atau vulgar',
    'Spam atau tautan berbahaya',
    'Pelecehan atau ujaran kebencian',
    'Informasi palsu / menyesatkan',
    'Pelanggaran hak cipta',
    'Lainnya'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = selectedReason === 'Lainnya' ? customReason : selectedReason;
    if (!finalReason.trim()) {
      showToast('Harap tentukan alasan laporan.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createReport(reportModalData.targetType, reportModalData.targetId, finalReason);
      showToast('Laporan berhasil dikirim. Tim moderasi akan meninjau.', 'success');
      closeReportModal();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengirim laporan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div onClick={closeReportModal} className="absolute inset-0" />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative z-10 w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-slate-900 text-base">
              Laporkan {reportModalData.targetType === 'post' ? 'Postingan' : 'Pengguna'}
            </h3>
          </div>
          <button
            onClick={closeReportModal}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Bantu kami menjaga komunitas NEXA tetap aman, nyaman, dan beretika.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="space-y-2">
            {reasons.map((r, idx) => (
              <label
                key={idx}
                className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedReason === r
                    ? 'border-slate-900 bg-slate-50 text-slate-900 font-semibold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="reportReason"
                  value={r}
                  checked={selectedReason === r}
                  onChange={() => setSelectedReason(r)}
                  className="accent-slate-900"
                />
                <span>{r}</span>
              </label>
            ))}
          </div>

          {selectedReason === 'Lainnya' && (
            <textarea
              rows={2}
              value={customReason}
              onChange={e => setCustomReason(e.target.value)}
              placeholder="Jelaskan alasan laporan Anda..."
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-slate-900 focus:outline-none"
              required
            />
          )}

          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={closeReportModal}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
