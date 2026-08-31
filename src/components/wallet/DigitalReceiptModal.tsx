import React from 'react';
import { WalletTransaction } from '../../types.js';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Copy, 
  Share2, 
  Download, 
  X, 
  ArrowUpRight, 
  ArrowDownLeft,
  ShieldCheck,
  Building2,
  Smartphone
} from 'lucide-react';

interface DigitalReceiptModalProps {
  transaction: WalletTransaction | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  onToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({
  transaction,
  isOpen,
  onClose,
  currentUserId,
  onToast
}) => {
  // Lock body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !transaction) return null;

  const isCredit = transaction.direction === 'credit' || (transaction.type === 'transfer' && transaction.recipient_id === currentUserId);
  const isDebit = transaction.direction === 'debit';

  const formatCurrency = (val: number) => {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(val || 0);
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) + ' WIB';
    } catch {
      return isoString;
    }
  };

  const handleCopyRef = () => {
    navigator.clipboard.writeText(transaction.reference_id);
    onToast?.('Nomor referensi berhasil disalin ke clipboard!', 'success');
  };

  const handleCopySummary = () => {
    const summary = `🧾 BUKTI TRANSAKSI RESMI NEXA\n` +
      `---------------------------------\n` +
      `No. Ref: ${transaction.reference_id}\n` +
      `Status: ${transaction.status.toUpperCase()}\n` +
      `Jenis: ${transaction.type === 'topup' ? 'Isi Saldo' : transaction.type === 'transfer' ? 'Kirim Uang' : 'Penyesuaian'}\n` +
      `Nominal: ${formatCurrency(transaction.amount)}\n` +
      `Biaya Admin: ${formatCurrency(transaction.fee)}\n` +
      `Total: ${formatCurrency(transaction.total_amount)}\n` +
      `Penerima: ${transaction.recipient_name || '-'} (${transaction.recipient_provider || 'NEXA'})\n` +
      `Waktu: ${formatDate(transaction.completed_at || transaction.created_at)}\n` +
      `---------------------------------\n` +
      `Diverifikasi oleh Sistem NEXA Core.`;
    navigator.clipboard.writeText(summary);
    onToast?.('Rangkuman struk transaksi berhasil disalin!', 'success');
  };

  const getStatusBadge = () => {
    switch (transaction.status) {
      case 'completed':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Transaksi Berhasil</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-xs font-bold">
            <Clock className="w-4 h-4 text-amber-600 animate-spin" />
            <span>Menunggu Pembayaran / Verifikasi</span>
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Sedang Diproses Mitra</span>
          </div>
        );
      case 'failed':
      case 'cancelled':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-100 text-xs font-bold">
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>Transaksi Gagal</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-100 text-xs font-bold">
            <AlertCircle className="w-4 h-4 text-slate-500" />
            <span>{transaction.status}</span>
          </div>
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-sm sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-[94dvh] sm:h-auto sm:max-h-[calc(100dvh-32px)] max-h-[100dvh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Bar - Fixed */}
        <div className="p-4 sm:p-5 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-xs">
              N
            </div>
            <div>
              <span className="font-extrabold text-sm text-slate-900 block leading-tight">Bukti Transaksi Resmi</span>
              <span className="text-[10px] text-slate-500 font-medium">NEXA Financial Core</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Body - Scrollable */}
        <div className="p-5 sm:p-6 space-y-5 flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {/* Status & Amount Display */}
          <div className="text-center space-y-2 pb-4 border-b border-dashed border-slate-200">
            <div className="flex justify-center">{getStatusBadge()}</div>
            
            <div className="pt-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Transaksi
              </span>
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <span className={`text-2xl sm:text-3xl font-black tracking-tight ${
                  transaction.status === 'failed' ? 'text-slate-400 line-through' :
                  isCredit ? 'text-emerald-600' : 'text-slate-900'
                }`}>
                  {isCredit && '+'}{isDebit && '-'}{formatCurrency(transaction.amount)}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-medium max-w-xs mx-auto">
              {transaction.description}
            </p>
          </div>

          {/* Detailed Transaction Breakdown */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Nomor Referensi</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-slate-900">{transaction.reference_id}</span>
                <button
                  onClick={handleCopyRef}
                  title="Salin No Ref"
                  className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Waktu Transaksi</span>
              <span className="font-semibold text-slate-800 text-right">
                {formatDate(transaction.completed_at || transaction.created_at)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Jenis Transaksi</span>
              <span className="font-bold text-slate-800 uppercase text-[11px]">
                {transaction.type === 'topup' ? 'Isi Saldo (Top Up)' :
                 transaction.type === 'transfer' ? 'Transfer Uang' :
                 transaction.type === 'adjustment' ? 'Penyesuaian Saldo' : transaction.type}
              </span>
            </div>

            {transaction.payment_method && (
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Metode Pembayaran</span>
                <span className="font-semibold text-slate-800">{transaction.payment_method}</span>
              </div>
            )}

            {transaction.sender_name && (
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Pengirim</span>
                <span className="font-semibold text-slate-800">{transaction.sender_name}</span>
              </div>
            )}

            {transaction.recipient_name && (
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Penerima</span>
                <div className="text-right">
                  <span className="font-bold text-slate-900 block">{transaction.recipient_name}</span>
                  <span className="text-[10px] text-slate-500">
                    {transaction.recipient_provider || 'NEXA'} • {transaction.recipient_account}
                  </span>
                </div>
              </div>
            )}

            {transaction.notes && (
              <div className="flex items-start justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Catatan</span>
                <span className="font-medium text-slate-700 max-w-[200px] text-right italic">
                  "{transaction.notes}"
                </span>
              </div>
            )}

            {transaction.rejection_reason && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-[11px]">
                <span className="font-bold block mb-0.5">Alasan Penolakan:</span>
                <p>{transaction.rejection_reason}</p>
              </div>
            )}

            {/* Fee & Final Total */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between text-slate-600 text-xs">
                <span>Biaya Transaksi / Admin</span>
                <span className="font-medium text-emerald-600">
                  {transaction.fee === 0 ? 'Gratis (Rp 0)' : formatCurrency(transaction.fee)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-900 font-extrabold text-sm pt-1">
                <span>Total Ditagih</span>
                <span>{formatCurrency(transaction.total_amount || transaction.amount)}</span>
              </div>
            </div>
          </div>

          {/* Security & Verification Footer */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-[11px] text-slate-600">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Transaksi terenkripsi aman & tercatat resmi pada buku besar (ledger) NEXA.
            </span>
          </div>
        </div>

        {/* Action Buttons - Fixed Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            onClick={handleCopySummary}
            className="flex-1 py-2.5 px-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>Salin Struk</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
