import React, { useState, useEffect } from 'react';
import { 
  AdminFinancialDashboard, 
  WalletTransaction, 
  FinancialAuditLog, 
  WalletAdjustment 
} from '../../types.js';
import { api } from '../../services/api.js';
import { 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  FileText, 
  AlertCircle, 
  Sliders, 
  RefreshCw,
  Eye,
  Send,
  ExternalLink
} from 'lucide-react';

interface AdminFinancialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onTransactionUpdated?: () => void;
}

export const AdminFinancialModal: React.FC<AdminFinancialModalProps> = ({
  isOpen,
  onClose,
  onToast,
  onTransactionUpdated
}) => {
  const [data, setData] = useState<AdminFinancialDashboard | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'topups' | 'transfers' | 'adjustments' | 'audit_logs'>('overview');
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Top Up Review Modal State
  const [selectedTopup, setSelectedTopup] = useState<WalletTransaction | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  // Manual Adjustment State
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState<boolean>(false);
  const [adjUserId, setAdjUserId] = useState<string>('');
  const [adjAmount, setAdjAmount] = useState<string>('');
  const [adjType, setAdjType] = useState<'credit' | 'debit'>('credit');
  const [adjReason, setAdjReason] = useState<string>('');
  const [isSubmittingAdj, setIsSubmittingAdj] = useState<boolean>(false);

  // Proof Image Preview
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      loadDashboard();
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminFinancialOverview();
      setData(res);
    } catch (err: any) {
      onToast(err.message || 'Gagal memuat data keuangan admin.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewTopupSubmit = async () => {
    if (!selectedTopup || !reviewAction) return;

    if (reviewAction === 'reject' && !rejectReason.trim()) {
      onToast('Alasan penolakan wajib dicantumkan.', 'error');
      return;
    }

    setIsSubmittingReview(true);
    try {
      await api.adminReviewTopUp(selectedTopup.id, {
        action: reviewAction,
        reason: reviewAction === 'reject' ? rejectReason.trim() : undefined
      });
      onToast(
        reviewAction === 'approve' 
          ? 'Top up berhasil disetujui & saldo ditambahkan ke pengguna.' 
          : 'Top up ditolak.',
        'success'
      );
      setSelectedTopup(null);
      setReviewAction(null);
      setRejectReason('');
      await loadDashboard();
      onTransactionUpdated?.();
    } catch (err: any) {
      onToast(err.message || 'Gagal memproses review top up.', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleManualAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjUserId.trim() || !adjAmount || !adjReason.trim()) {
      onToast('Harap lengkapi semua bidang penyesuaian saldo.', 'error');
      return;
    }

    const numAmount = Number(adjAmount.replace(/\D/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
      onToast('Nominal harus lebih besar dari Rp 0.', 'error');
      return;
    }

    setIsSubmittingAdj(true);
    try {
      await api.adminManualAdjustment({
        target_user_id: adjUserId.trim(),
        amount: numAmount,
        type: adjType,
        reason: adjReason.trim()
      });
      onToast('Penyesuaian saldo berhasil diterapkan ke pengguna.', 'success');
      setIsAdjustmentModalOpen(false);
      setAdjUserId('');
      setAdjAmount('');
      setAdjReason('');
      await loadDashboard();
      onTransactionUpdated?.();
    } catch (err: any) {
      onToast(err.message || 'Gagal melakukan penyesuaian saldo.', 'error');
    } finally {
      setIsSubmittingAdj(false);
    }
  };

  const formatCurrency = (val: number) => {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(val || 0);
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-4xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-[95dvh] sm:h-auto sm:max-h-[calc(100dvh-32px)] max-h-[100dvh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header - Fixed */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight">Manajemen Keuangan & Saldo</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                  Admin Core
                </span>
              </div>
              <p className="text-xs text-slate-400">Verifikasi Top Up, Audit Buku Besar & Penyesuaian Saldo</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadDashboard}
              disabled={isLoading}
              title="Segarkan Data"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation - Fixed */}
        <div className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 pt-3 pb-2 border-b border-slate-100 bg-slate-50/50 overflow-x-auto no-scrollbar text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Ringkasan
          </button>
          <button
            onClick={() => setActiveTab('topups')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'topups'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Permintaan Top Up</span>
            {data?.overview.pending_topups_count ? (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px]">
                {data.overview.pending_topups_count}
              </span>
            ) : null}
          </button>
          <button
            onClick={() => setActiveTab('transfers')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'transfers'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Buku Besar & Transfer
          </button>
          <button
            onClick={() => setActiveTab('adjustments')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'adjustments'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Penyesuaian Saldo
          </button>
          <button
            onClick={() => setActiveTab('audit_logs')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'audit_logs'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Audit Log
          </button>
        </div>

        {/* Content Body - Scrollable */}
        <div className="p-4 sm:p-6 flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {isLoading && !data ? (
            <div className="py-20 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
              <p className="text-xs">Memuat data keuangan sistem...</p>
            </div>
          ) : !data ? (
            <div className="py-20 text-center text-slate-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
              <p className="text-xs">Gagal memuat data keuangan.</p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                      <span className="text-[11px] font-bold text-indigo-900/70 block uppercase">Total Saldo Beredar</span>
                      <span className="text-lg sm:text-xl font-black text-indigo-950 mt-1 block">
                        {formatCurrency(data.overview.total_circulating_balance)}
                      </span>
                      <span className="text-[10px] text-indigo-700/80 mt-0.5 block">Akun pengguna aktif</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
                      <span className="text-[11px] font-bold text-amber-900/70 block uppercase">Top Up Menunggu</span>
                      <span className="text-lg sm:text-xl font-black text-amber-950 mt-1 block">
                        {data.overview.pending_topups_count} Permintaan
                      </span>
                      <span className="text-[10px] text-amber-700/80 mt-0.5 block">
                        Volume: {formatCurrency(data.overview.pending_topups_volume)}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                      <span className="text-[11px] font-bold text-emerald-900/70 block uppercase">Volume Top Up Masuk</span>
                      <span className="text-lg sm:text-xl font-black text-emerald-950 mt-1 block">
                        {formatCurrency(data.overview.total_topup_volume)}
                      </span>
                      <span className="text-[10px] text-emerald-700/80 mt-0.5 block">Berhasil disetujui</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-600 block uppercase">Volume Transfer</span>
                      <span className="text-lg sm:text-xl font-black text-slate-900 mt-1 block">
                        {formatCurrency(data.overview.total_transfer_volume)}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        {data.overview.completed_transactions_count} Transaksi
                      </span>
                    </div>
                  </div>

                  {/* Pending Top Ups Quick Review Section */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <h4 className="font-bold text-sm text-slate-900">Permintaan Top Up Menunggu Verifikasi</h4>
                      </div>
                      <button
                        onClick={() => setActiveTab('topups')}
                        className="text-xs text-indigo-600 hover:underline font-semibold"
                      >
                        Lihat Semua ({data.topups.filter(t => t.status === 'pending').length})
                      </button>
                    </div>

                    {data.topups.filter(t => t.status === 'pending').length === 0 ? (
                      <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl text-xs">
                        Tidak ada permintaan top up yang menunggu persetujuan saat ini.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {data.topups.filter(t => t.status === 'pending').slice(0, 3).map(tx => (
                          <div
                            key={tx.id}
                            className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{formatCurrency(tx.amount)}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                                  {tx.payment_method}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                User: <span className="font-mono">{tx.user_id}</span> • Ref: {tx.reference_id}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              {tx.payment_proof_url && (
                                <button
                                  onClick={() => setPreviewProofUrl(tx.payment_proof_url!)}
                                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 text-[11px] font-semibold flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Bukti</span>
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedTopup(tx);
                                  setReviewAction('approve');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                              >
                                Setujui
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedTopup(tx);
                                  setReviewAction('reject');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                              >
                                Tolak
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions & Tools */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
                    <div>
                      <h4 className="font-bold text-sm">Penyesuaian Saldo Manual (Manual Adjustment)</h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Koreksi saldo pengguna dengan pencatatan audit trail yang wajib & terverifikasi.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAdjustmentModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs shadow-xs"
                    >
                      + Penyesuaian Saldo
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: TOP UPS */}
              {activeTab === 'topups' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-slate-900 text-sm">Daftar Transaksi Top Up Saldo</h3>
                    <span className="text-xs text-slate-500">Total: {data.topups.length} Transaksi</span>
                  </div>

                  {data.topups.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl text-xs">
                      Belum ada riwayat permintaan top up.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {data.topups.map(tx => (
                        <div
                          key={tx.id}
                          className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-slate-900">{formatCurrency(tx.amount)}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                tx.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                tx.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                'bg-rose-50 text-rose-700 border border-rose-100'
                              }`}>
                                {tx.status.toUpperCase()}
                              </span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-600 font-medium">{tx.payment_method}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-slate-500 font-mono">
                              <span>Ref: {tx.reference_id}</span>
                              <span>User ID: {tx.user_id}</span>
                              <span>{formatDate(tx.created_at)}</span>
                            </div>
                            {tx.rejection_reason && (
                              <p className="text-[11px] text-rose-600 italic">Alasan: {tx.rejection_reason}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {tx.payment_proof_url && (
                              <button
                                onClick={() => setPreviewProofUrl(tx.payment_proof_url!)}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Lihat Bukti</span>
                              </button>
                            )}

                            {tx.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedTopup(tx);
                                    setReviewAction('approve');
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                                >
                                  Setujui
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedTopup(tx);
                                    setReviewAction('reject');
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                                >
                                  Tolak
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: TRANSFERS & LEDGER */}
              {activeTab === 'transfers' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-slate-900 text-sm">Buku Besar Transaksi Sistem (Ledger)</h3>
                    <span className="text-xs text-slate-500">Total: {data.ledger.length} Catatan</span>
                  </div>

                  {data.ledger.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl text-xs">
                      Belum ada transaksi tercatat pada buku besar.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data.ledger.map(tx => (
                        <div
                          key={tx.id}
                          className="p-3 rounded-2xl bg-white border border-slate-100 shadow-2xs flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              tx.direction === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {tx.direction === 'credit' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{tx.description}</span>
                                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                  tx.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {tx.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 font-mono">
                                {tx.reference_id} • Saldo: {formatCurrency(tx.balance_before)} ➔ {formatCurrency(tx.balance_after)} • {formatDate(tx.created_at)}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`font-black text-sm block ${
                              tx.direction === 'credit' ? 'text-emerald-600' : 'text-slate-900'
                            }`}>
                              {tx.direction === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                            </span>
                            <span className="text-[10px] text-slate-400">Fee: {formatCurrency(tx.fee)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: ADJUSTMENTS */}
              {activeTab === 'adjustments' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">Riwayat Penyesuaian Saldo Manual</h3>
                      <p className="text-xs text-slate-500">Tercatat transparan dengan ID Admin dan Alasan</p>
                    </div>
                    <button
                      onClick={() => setIsAdjustmentModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                    >
                      + Buat Penyesuaian
                    </button>
                  </div>

                  {data.adjustments.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl text-xs">
                      Belum pernah ada penyesuaian saldo manual.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data.adjustments.map(adj => (
                        <div
                          key={adj.id}
                          className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-2xs space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`font-black text-sm ${
                                adj.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
                              }`}>
                                {adj.type === 'credit' ? '+' : '-'}{formatCurrency(adj.amount)}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                                {adj.type}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">{formatDate(adj.created_at)}</span>
                          </div>

                          <div className="text-slate-600 text-xs">
                            <span className="font-bold text-slate-800">Target User:</span> {adj.user_name || adj.user_id}
                          </div>
                          <div className="text-slate-600 text-xs">
                            <span className="font-bold text-slate-800">Admin:</span> {adj.admin_name || adj.admin_id}
                          </div>
                          <div className="p-2 rounded-xl bg-slate-50 text-slate-700 text-[11px] italic">
                            "{adj.reason}"
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: AUDIT LOGS */}
              {activeTab === 'audit_logs' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-slate-900 text-sm">Jejak Audit Keuangan (Immutable Log)</h3>
                    <span className="text-xs text-slate-500">{data.audit_logs.length} Aktivitas</span>
                  </div>

                  {data.audit_logs.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl text-xs">
                      Belum ada jejak audit keuangan.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data.audit_logs.map(log => (
                        <div
                          key={log.id}
                          className="p-3 rounded-2xl bg-white border border-slate-100 shadow-2xs flex items-start justify-between text-xs gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[10px] uppercase font-mono">
                                {log.action}
                              </span>
                              {log.amount !== undefined && (
                                <span className="font-bold text-slate-900">{formatCurrency(log.amount)}</span>
                              )}
                            </div>
                            <p className="text-slate-700 text-xs">{log.reason}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              Admin: {log.admin_name || log.admin_id} • Target: {log.target_type} ({log.target_id})
                            </p>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {formatDate(log.created_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer - Fixed */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* TOP UP APPROVE / REJECT SUB-MODAL */}
      {selectedTopup && reviewAction && (
        <div 
          className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden"
          onClick={() => {
            setSelectedTopup(null);
            setReviewAction(null);
            setRejectReason('');
          }}
        >
          <div 
            className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-extrabold text-base text-slate-900 shrink-0 mb-4">
              {reviewAction === 'approve' ? 'Setujui Permintaan Top Up' : 'Tolak Permintaan Top Up'}
            </h3>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-4 pr-1">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nominal:</span>
                  <span className="font-extrabold text-slate-900">{formatCurrency(selectedTopup.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Metode:</span>
                  <span className="font-bold text-slate-900">{selectedTopup.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">User ID:</span>
                  <span className="font-mono text-slate-700">{selectedTopup.user_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Referensi:</span>
                  <span className="font-mono text-slate-700">{selectedTopup.reference_id}</span>
                </div>
              </div>

              {reviewAction === 'reject' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Alasan Penolakan <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Contoh: Bukti transfer tidak jelas / nominal tidak sesuai rekening koran."
                    className="w-full h-24 p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-slate-100 mt-4 shrink-0 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => {
                  setSelectedTopup(null);
                  setReviewAction(null);
                  setRejectReason('');
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleReviewTopupSubmit}
                disabled={isSubmittingReview}
                className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs shadow-xs transition-colors ${
                  reviewAction === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isSubmittingReview ? 'Memproses...' : reviewAction === 'approve' ? 'Konfirmasi Setujui' : 'Konfirmasi Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL ADJUSTMENT MODAL */}
      {isAdjustmentModalOpen && (
        <div 
          className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden"
          onClick={() => setIsAdjustmentModalOpen(false)}
        >
          <form 
            onSubmit={handleManualAdjustmentSubmit} 
            className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between shrink-0 mb-4">
              <h3 className="font-extrabold text-base text-slate-900">Penyesuaian Saldo Pengguna</h3>
              <button
                type="button"
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3.5 text-xs pr-1">
              <div>
                <label className="font-bold text-slate-700 block mb-1">User ID Target</label>
                <input
                  type="text"
                  value={adjUserId}
                  onChange={e => setAdjUserId(e.target.value)}
                  placeholder="user_xxxxxx"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 font-mono text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jenis Penyesuaian</label>
                  <select
                    value={adjType}
                    onChange={e => setAdjType(e.target.value as 'credit' | 'debit')}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-xs"
                  >
                    <option value="credit">Tambah Saldo (+ Credit)</option>
                    <option value="debit">Kurangi Saldo (- Debit)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nominal (Rp)</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={adjAmount}
                    onChange={e => setAdjAmount(e.target.value)}
                    placeholder="Contoh: 50000"
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Alasan Penyesuaian (Wajib Diisi)</label>
                <textarea
                  value={adjReason}
                  onChange={e => setAdjReason(e.target.value)}
                  placeholder="Kompensasi kendala sistem / Pengembalian dana transaksi / dsb..."
                  className="w-full h-20 p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 text-xs"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-slate-100 mt-4 shrink-0 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmittingAdj}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors"
              >
                {isSubmittingAdj ? 'Menerapkan...' : 'Terapkan Penyesuaian'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PROOF IMAGE PREVIEW MODAL */}
      {previewProofUrl && (
        <div 
          className="fixed inset-0 z-70 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          onClick={() => setPreviewProofUrl(null)}
        >
          <div className="relative max-w-md w-full bg-white rounded-3xl p-4 overflow-hidden flex flex-col max-h-[92dvh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3 shrink-0">
              <span className="font-bold text-xs text-slate-800">Bukti Pembayaran Top Up</span>
              <button
                onClick={() => setPreviewProofUrl(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden flex items-center justify-center bg-slate-100 rounded-2xl p-2">
              <img 
                src={previewProofUrl} 
                alt="Bukti Transfer" 
                className="max-w-full max-h-[70dvh] object-contain rounded-xl" 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
