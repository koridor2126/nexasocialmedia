import React, { useState, useEffect, useCallback } from 'react';
import { 
  UserWalletInfo, 
  WalletTransaction, 
  WalletRecipient, 
  RecipientType,
  WALLET_CONFIG,
  User
} from '../../types.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { DigitalReceiptModal } from './DigitalReceiptModal.js';
import { AdminFinancialModal } from './AdminFinancialModal.js';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Clock, 
  Search, 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ChevronRight, 
  Copy, 
  Eye, 
  EyeOff, 
  Building2, 
  Smartphone, 
  QrCode, 
  CreditCard,
  Trash2,
  RefreshCw,
  FileText,
  SlidersHorizontal,
  Send,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface WalletViewProps {
  initialTab?: 'overview' | 'topup' | 'transfer' | 'recipients' | 'history' | 'security';
  onClose?: () => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isModal?: boolean;
}

export const WalletView: React.FC<WalletViewProps> = ({
  initialTab = 'overview',
  onClose,
  onToast,
  isModal = false
}) => {
  const { user } = useAuth();
  const [walletInfo, setWalletInfo] = useState<UserWalletInfo | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [recipients, setRecipients] = useState<WalletRecipient[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'topup' | 'transfer' | 'recipients' | 'history' | 'security'>(initialTab);

  // Balance Visibility
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(false);

  // Selected Transaction for Digital Receipt Modal
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<WalletTransaction | null>(null);

  // Admin Financial Modal
  const [isAdminFinancialOpen, setIsAdminFinancialOpen] = useState<boolean>(false);

  // ==================== TOP UP STATE ====================
  const [topUpAmount, setTopUpAmount] = useState<number>(50000);
  const [customTopUpInput, setCustomTopUpInput] = useState<string>('50.000');
  const [topUpMethod, setTopUpMethod] = useState<string>('BCA Virtual Account');
  const [isSubmittingTopUp, setIsSubmittingTopUp] = useState<boolean>(false);
  const [activeTopUpTx, setActiveTopUpTx] = useState<WalletTransaction | null>(null);
  const [paymentProofInput, setPaymentProofInput] = useState<string>('');
  const [isUploadingProof, setIsUploadingProof] = useState<boolean>(false);

  // ==================== TRANSFER STATE ====================
  const [transferType, setTransferType] = useState<RecipientType>('nexa_user');
  const [searchUserQuery, setSearchUserQuery] = useState<string>('');
  const [foundUsers, setFoundUsers] = useState<Partial<User>[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState<boolean>(false);
  const [selectedUserRecipient, setSelectedUserRecipient] = useState<Partial<User> | null>(null);

  const [bankName, setBankName] = useState<string>('BCA');
  const [bankAccountNumber, setBankAccountNumber] = useState<string>('');
  const [bankAccountHolder, setBankAccountHolder] = useState<string>('');

  const [ewalletProvider, setEwalletProvider] = useState<string>('GoPay');
  const [ewalletPhone, setEwalletPhone] = useState<string>('');
  const [ewalletAccountHolder, setEwalletAccountHolder] = useState<string>('');

  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferNotes, setTransferNotes] = useState<string>('');
  const [saveToRecipients, setSaveToRecipients] = useState<boolean>(true);

  // Transfer Step: 'form' -> 'confirm' -> 'pin' -> 'success'
  const [transferStep, setTransferStep] = useState<'form' | 'confirm' | 'pin' | 'success'>('form');
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState<boolean>(false);
  const [completedTransferTx, setCompletedTransferTx] = useState<WalletTransaction | null>(null);

  // ==================== PIN SETUP / CHANGE STATE ====================
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [oldPinInput, setOldPinInput] = useState<string>('');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  const [pinModalError, setPinModalError] = useState<string>('');
  const [isSavingPin, setIsSavingPin] = useState<boolean>(false);

  // ==================== ADD RECIPIENT MODAL STATE ====================
  const [isAddRecipientOpen, setIsAddRecipientOpen] = useState<boolean>(false);
  const [newRecipName, setNewRecipName] = useState<string>('');
  const [newRecipType, setNewRecipType] = useState<RecipientType>('bank_account');
  const [newRecipProvider, setNewRecipProvider] = useState<string>('BCA');
  const [newRecipAccount, setNewRecipAccount] = useState<string>('');
  const [isSavingRecipient, setIsSavingRecipient] = useState<boolean>(false);

  // ==================== TRANSACTION HISTORY FILTER STATE ====================
  const [historyFilterType, setHistoryFilterType] = useState<string>('all');
  const [historyFilterStatus, setHistoryFilterStatus] = useState<string>('all');
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');

  // Initial Load
  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [walletRes, txRes, recipRes] = await Promise.all([
        api.getWalletInfo(),
        api.getWalletTransactions(),
        api.getWalletRecipients()
      ]);
      setWalletInfo(walletRes);
      setTransactions(txRes.transactions || []);
      setRecipients(recipRes.recipients || []);

      // Check if there is an active pending top up
      const pendingTopUp = (txRes.transactions || []).find(
        t => t.type === 'topup' && t.status === 'pending'
      );
      if (pendingTopUp) {
        setActiveTopUpTx(pendingTopUp);
      }
    } catch (err: any) {
      onToast(err.message || 'Gagal memuat data dompet.', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [onToast]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    loadWalletData();
  };

  // Search NEXA user debounce
  useEffect(() => {
    if (transferType !== 'nexa_user' || !searchUserQuery.trim()) {
      setFoundUsers([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const res = await api.searchTransferUsers(searchUserQuery.trim());
        setFoundUsers(res.users || []);
      } catch {
        setFoundUsers([]);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchUserQuery, transferType]);

  const formatCurrency = (val: number) => {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(val || 0);
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  // Top Up Presets
  const TOP_UP_PRESETS = [10000, 25000, 50000, 100000, 250000, 500000, 1000000];

  const handleSelectPreset = (amount: number) => {
    setTopUpAmount(amount);
    setCustomTopUpInput(new Intl.NumberFormat('id-ID').format(amount));
  };

  const handleCustomTopUpChange = (val: string) => {
    const rawNumber = Number(val.replace(/\D/g, ''));
    setTopUpAmount(rawNumber);
    setCustomTopUpInput(rawNumber ? new Intl.NumberFormat('id-ID').format(rawNumber) : '');
  };

  const handleCreateTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (topUpAmount < WALLET_CONFIG.MIN_TOPUP_AMOUNT) {
      onToast(`Minimal isi saldo adalah ${formatCurrency(WALLET_CONFIG.MIN_TOPUP_AMOUNT)}.`, 'error');
      return;
    }
    if (topUpAmount > WALLET_CONFIG.MAX_TOPUP_AMOUNT) {
      onToast(`Maksimal isi saldo adalah ${formatCurrency(WALLET_CONFIG.MAX_TOPUP_AMOUNT)}.`, 'error');
      return;
    }

    setIsSubmittingTopUp(true);
    try {
      const res = await api.createTopUp({
        amount: topUpAmount,
        payment_method: topUpMethod
      });
      setActiveTopUpTx(res.transaction);
      onToast('Instruksi isi saldo berhasil dibuat. Silakan selesaikan pembayaran.', 'success');
      loadWalletData();
    } catch (err: any) {
      onToast(err.message || 'Gagal membuat permintaan isi saldo.', 'error');
    } finally {
      setIsSubmittingTopUp(false);
    }
  };

  const handleUploadPaymentProof = async (proofUrl: string) => {
    if (!activeTopUpTx) return;
    setIsUploadingProof(true);
    try {
      const res = await api.uploadTopUpProof(activeTopUpTx.id, proofUrl);
      setActiveTopUpTx(res.transaction);
      onToast('Bukti pembayaran berhasil diunggah. Menunggu verifikasi admin.', 'success');
      loadWalletData();
    } catch (err: any) {
      onToast(err.message || 'Gagal mengunggah bukti pembayaran.', 'error');
    } finally {
      setIsUploadingProof(false);
    }
  };

  // Transfer Processing Flow
  const handleProceedToConfirmTransfer = () => {
    const numAmount = Number(transferAmount.replace(/\D/g, ''));
    if (!numAmount || numAmount < WALLET_CONFIG.MIN_TRANSFER_AMOUNT) {
      onToast(`Minimal transfer adalah ${formatCurrency(WALLET_CONFIG.MIN_TRANSFER_AMOUNT)}.`, 'error');
      return;
    }

    if (!walletInfo || numAmount > walletInfo.balance) {
      onToast('Saldo NEXA Anda tidak mencukupi untuk nominal ini.', 'error');
      return;
    }

    if (numAmount > (walletInfo.daily_limit_remaining || WALLET_CONFIG.DAILY_TRANSFER_LIMIT)) {
      onToast(`Nominal melebihi sisa limit harian Anda (${formatCurrency(walletInfo.daily_limit_remaining || 0)}).`, 'error');
      return;
    }

    if (transferType === 'nexa_user' && !selectedUserRecipient) {
      onToast('Silakan pilih pengguna NEXA tujuan transfer.', 'error');
      return;
    }

    if (transferType === 'bank_account' && (!bankAccountNumber.trim() || !bankAccountHolder.trim())) {
      onToast('Harap lengkapi nomor rekening dan nama pemilik rekening.', 'error');
      return;
    }

    if (transferType === 'ewallet' && (!ewalletPhone.trim() || !ewalletAccountHolder.trim())) {
      onToast('Harap lengkapi nomor HP dan nama akun e-wallet.', 'error');
      return;
    }

    if (!walletInfo.pin_set) {
      onToast('Anda belum mengatur PIN transaksi 6 digit. Silakan atur PIN terlebih dahulu.', 'info');
      setIsPinModalOpen(true);
      return;
    }

    setTransferStep('confirm');
  };

  const handleProceedToPin = () => {
    setEnteredPin('');
    setPinError('');
    setTransferStep('pin');
  };

  const handleExecuteTransfer = async () => {
    if (enteredPin.length !== 6) {
      setPinError('PIN transaksi harus 6 digit angka.');
      return;
    }

    const numAmount = Number(transferAmount.replace(/\D/g, ''));
    let recipient_name = '';
    let account_identifier = '';
    let provider = 'NEXA';
    let recipient_id: string | undefined = undefined;

    if (transferType === 'nexa_user' && selectedUserRecipient) {
      recipient_name = selectedUserRecipient.full_name || selectedUserRecipient.username || 'Pengguna NEXA';
      account_identifier = `@${selectedUserRecipient.username}`;
      provider = 'NEXA';
      recipient_id = selectedUserRecipient.id;
    } else if (transferType === 'bank_account') {
      recipient_name = bankAccountHolder.trim();
      account_identifier = bankAccountNumber.trim();
      provider = bankName;
    } else if (transferType === 'ewallet') {
      recipient_name = ewalletAccountHolder.trim();
      account_identifier = ewalletPhone.trim();
      provider = ewalletProvider;
    }

    setIsSubmittingTransfer(true);
    setPinError('');

    try {
      const idempotency_key = 'tx_idemp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const res = await api.executeTransfer({
        recipient_type: transferType,
        recipient_id,
        recipient_name,
        account_identifier,
        provider,
        amount: numAmount,
        notes: transferNotes.trim() || undefined,
        idempotency_key,
        pin: enteredPin
      });

      // Optionally save to saved recipients
      if (saveToRecipients && (transferType === 'bank_account' || transferType === 'ewallet')) {
        api.addWalletRecipient({
          recipient_name,
          recipient_type: transferType,
          account_identifier,
          provider
        }).catch(() => {});
      }

      setCompletedTransferTx(res.transaction);
      setTransferStep('success');
      onToast(res.message || 'Transfer berhasil terkirim!', 'success');
      loadWalletData();
    } catch (err: any) {
      setPinError(err.message || 'Gagal memproses transfer. Pastikan PIN benar.');
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  const handleResetTransferForm = () => {
    setTransferStep('form');
    setTransferAmount('');
    setTransferNotes('');
    setSelectedUserRecipient(null);
    setSearchUserQuery('');
    setBankAccountNumber('');
    setBankAccountHolder('');
    setEwalletPhone('');
    setEwalletAccountHolder('');
    setEnteredPin('');
    setPinError('');
    setCompletedTransferTx(null);
  };

  const handleSelectSavedRecipient = (rec: WalletRecipient) => {
    setTransferType(rec.recipient_type);
    if (rec.recipient_type === 'bank_account') {
      setBankName(rec.provider);
      setBankAccountNumber(rec.account_identifier);
      setBankAccountHolder(rec.recipient_name);
    } else if (rec.recipient_type === 'ewallet') {
      setEwalletProvider(rec.provider);
      setEwalletPhone(rec.account_identifier);
      setEwalletAccountHolder(rec.recipient_name);
    } else if (rec.recipient_type === 'nexa_user') {
      setSelectedUserRecipient({
        id: rec.recipient_id,
        username: rec.account_identifier.replace('@', ''),
        full_name: rec.recipient_name
      });
    }
    setActiveTab('transfer');
    setTransferStep('form');
  };

  const handleDeleteRecipient = async (id: string) => {
    if (!window.confirm('Hapus penerima ini dari daftar tersimpan?')) return;
    try {
      await api.deleteWalletRecipient(id);
      onToast('Penerima berhasil dihapus.', 'info');
      loadWalletData();
    } catch (err: any) {
      onToast(err.message || 'Gagal menghapus penerima.', 'error');
    }
  };

  const handleSaveNewRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipName.trim() || !newRecipAccount.trim()) {
      onToast('Harap lengkapi semua bidang penerima.', 'error');
      return;
    }

    setIsSavingRecipient(true);
    try {
      await api.addWalletRecipient({
        recipient_name: newRecipName.trim(),
        recipient_type: newRecipType,
        account_identifier: newRecipAccount.trim(),
        provider: newRecipProvider
      });
      onToast('Penerima berhasil disimpan.', 'success');
      setIsAddRecipientOpen(false);
      setNewRecipName('');
      setNewRecipAccount('');
      loadWalletData();
    } catch (err: any) {
      onToast(err.message || 'Gagal menyimpan penerima.', 'error');
    } finally {
      setIsSavingRecipient(false);
    }
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinModalError('');

    if (newPinInput.length !== 6 || !/^\d{6}$/.test(newPinInput)) {
      setPinModalError('PIN baru harus tepat 6 digit angka.');
      return;
    }

    if (newPinInput !== confirmPinInput) {
      setPinModalError('Konfirmasi PIN tidak cocok dengan PIN baru.');
      return;
    }

    if (walletInfo?.pin_set && !oldPinInput) {
      setPinModalError('PIN lama wajib dimasukkan untuk verifikasi.');
      return;
    }

    setIsSavingPin(true);
    try {
      const res = await api.setupOrChangePin({
        new_pin: newPinInput,
        old_pin: oldPinInput || undefined
      });
      onToast(res.message || 'PIN transaksi berhasil diperbarui.', 'success');
      setIsPinModalOpen(false);
      setOldPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
      loadWalletData();
    } catch (err: any) {
      setPinModalError(err.message || 'Gagal menyimpan PIN.');
    } finally {
      setIsSavingPin(false);
    }
  };

  const handleTogglePrivacyNotifs = async () => {
    if (!walletInfo) return;
    try {
      const nextVal = !walletInfo.mask_financial_notifs;
      await api.updateWalletSettings({ mask_financial_notifs: nextVal });
      setWalletInfo(prev => prev ? { ...prev, mask_financial_notifs: nextVal } : null);
      onToast(
        nextVal 
          ? 'Detail nominal pada notifikasi kini disamarkan demi privasi.' 
          : 'Nominal pada notifikasi kini ditampilkan lengkap.',
        'info'
      );
    } catch (err: any) {
      onToast(err.message || 'Gagal mengubah pengaturan.', 'error');
    }
  };

  // Filtered transactions for Ledger tab
  const filteredHistory = transactions.filter(tx => {
    if (historyFilterType === 'income' && tx.direction !== 'credit') return false;
    if (historyFilterType === 'expense' && tx.direction !== 'debit') return false;
    if (historyFilterType === 'topup' && tx.type !== 'topup') return false;
    if (historyFilterType === 'transfer' && tx.type !== 'transfer') return false;

    if (historyFilterStatus !== 'all' && tx.status !== historyFilterStatus) return false;

    if (historySearchQuery.trim()) {
      const q = historySearchQuery.toLowerCase();
      const matchRef = tx.reference_id.toLowerCase().includes(q);
      const matchDesc = tx.description.toLowerCase().includes(q);
      const matchRecipient = tx.recipient_name?.toLowerCase().includes(q);
      if (!matchRef && !matchDesc && !matchRecipient) return false;
    }

    return true;
  });

  return (
    <div className={`w-full max-w-lg mx-auto bg-[#F4F4F7] ${onClose || isModal ? 'h-full max-h-full flex flex-col overflow-hidden' : 'min-h-full flex flex-col pb-16'} animate-in fade-in duration-150`}>
      {/* Top Header Card - Fixed/Sticky */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 sm:py-3.5 shrink-0 sticky top-0 z-30 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black shadow-xs">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">Dompet NEXA</h2>
              <span className="px-2 py-0.2 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">
                Resmi
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Saldo, Pembayaran & Transfer Instan</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {user?.role === 'admin' && (
            <button
              onClick={() => setIsAdminFinancialOpen(true)}
              title="Panel Keuangan Admin"
              className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline text-[11px]">Admin Keuangan</span>
            </button>
          )}

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            title="Segarkan Saldo"
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Sub Navigation Tabs - Fixed */}
      <div className="bg-white px-3 py-2 border-b border-slate-100 shrink-0 flex items-center gap-1 overflow-x-auto no-scrollbar shadow-2xs text-xs font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Ringkasan Saldo
        </button>
        <button
          onClick={() => {
            setActiveTab('topup');
            if (activeTopUpTx) setPaymentProofInput('');
          }}
          className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1 ${
            activeTab === 'topup'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Isi Saldo</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('transfer');
            handleResetTransferForm();
          }}
          className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1 ${
            activeTab === 'transfer'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>Kirim Uang</span>
        </button>
        <button
          onClick={() => setActiveTab('recipients')}
          className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'recipients'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Daftar Penerima
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Riwayat
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Keamanan & PIN
        </button>
      </div>

      {/* Main Container Body - Smoothly Scrollable with Safe-Area Insets */}
      <div className={`p-3.5 sm:p-4 space-y-4 ${onClose || isModal ? 'flex-1 min-h-0 overflow-y-auto overscroll-contain pb-[max(2.5rem,env(safe-area-inset-bottom))]' : 'pb-16'}`}>
        
        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW & SALDO CARD */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Primary Clean White Saldo Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-100 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Saldo Aktif NEXA
                  </span>
                  <button
                    onClick={() => setIsBalanceHidden(!isBalanceHidden)}
                    className="text-slate-400 hover:text-slate-700 transition-colors p-1"
                    title={isBalanceHidden ? 'Tampilkan Saldo' : 'Sembunyikan Saldo'}
                  >
                    {isBalanceHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Aktif & Terlindungi</span>
                </div>
              </div>

              {/* Big Clean IDR Balance */}
              <div>
                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {isBalanceHidden ? '••••••••' : formatCurrency(walletInfo?.balance || 0)}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                  <span>Sisa Limit Harian:</span>
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(walletInfo?.daily_limit_remaining || WALLET_CONFIG.DAILY_TRANSFER_LIMIT)} / Hari
                  </span>
                </div>
                {/* Daily limit progress bar */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100, 
                        (((WALLET_CONFIG.DAILY_TRANSFER_LIMIT - (walletInfo?.daily_limit_remaining || WALLET_CONFIG.DAILY_TRANSFER_LIMIT)) / WALLET_CONFIG.DAILY_TRANSFER_LIMIT) * 100) || 0
                      )}%`
                    }}
                  ></div>
                </div>
              </div>

              {/* Primary Quick Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('topup')}
                  className="py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98"
                >
                  <Plus className="w-4 h-4" />
                  <span>Isi Saldo (Top Up)</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('transfer');
                    handleResetTransferForm();
                  }}
                  className="py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Kirim Uang (Transfer)</span>
                </button>
              </div>
            </div>

            {/* Active Pending Top Up Banner (If Any) */}
            {activeTopUpTx && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                    <span>Permintaan Isi Saldo Sedang Menunggu</span>
                  </div>
                  <span className="font-extrabold text-xs">{formatCurrency(activeTopUpTx.amount)}</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Metode: <span className="font-bold">{activeTopUpTx.payment_method}</span> • No. Ref: <span className="font-mono font-bold">{activeTopUpTx.reference_id}</span>
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setActiveTab('topup')}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs"
                  >
                    Buka Panduan & Bukti Bayar
                  </button>
                  <button
                    onClick={() => setSelectedTxForReceipt(activeTopUpTx)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-amber-200 text-amber-900 font-semibold text-xs hover:bg-amber-100"
                  >
                    Detail Struk
                  </button>
                </div>
              </div>
            )}

            {/* Quick Summary Cards (Penerima & Keamanan) */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveTab('recipients')}
                className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs text-left hover:border-slate-300 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <Users className="w-4 h-4" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <span className="text-xs font-bold text-slate-900 block">Daftar Penerima</span>
                <span className="text-[11px] text-slate-500">{recipients.length} Kontak Tersimpan</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs text-left hover:border-slate-300 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <span className="text-xs font-bold text-slate-900 block">PIN & Keamanan</span>
                <span className="text-[11px] text-slate-500">
                  {walletInfo?.pin_set ? 'PIN 6-Digit Aktif' : 'Belum Diatur'}
                </span>
              </button>
            </div>

            {/* Recent Transactions List */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900">Aktivitas Terkini</h3>
                <button
                  onClick={() => setActiveTab('history')}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  Lihat Semua
                </button>
              </div>

              {transactions.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Belum ada aktivitas transaksi pada akun dompet Anda.
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.slice(0, 4).map(tx => {
                    const isCredit = tx.direction === 'credit' || (tx.type === 'transfer' && tx.recipient_id === user?.id);
                    return (
                      <div
                        key={tx.id}
                        onClick={() => setSelectedTxForReceipt(tx)}
                        className="p-3 rounded-2xl bg-slate-50/70 hover:bg-slate-100/70 border border-slate-100 cursor-pointer flex items-center justify-between transition-all text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            tx.status === 'failed' ? 'bg-rose-50 text-rose-600' :
                            isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {tx.status === 'failed' ? <X className="w-4 h-4" /> :
                             isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {tx.description}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {formatDate(tx.completed_at || tx.created_at)} • {tx.recipient_provider || tx.payment_method || 'NEXA'}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`font-extrabold text-xs sm:text-sm block ${
                            tx.status === 'failed' ? 'text-slate-400 line-through' :
                            isCredit ? 'text-emerald-600' : 'text-slate-900'
                          }`}>
                            {isCredit && '+'}{tx.direction === 'debit' && '-'}{formatCurrency(tx.amount)}
                          </span>
                          <span className={`text-[10px] font-bold ${
                            tx.status === 'completed' ? 'text-emerald-600' :
                            tx.status === 'pending' ? 'text-amber-600' :
                            tx.status === 'processing' ? 'text-blue-600' : 'text-rose-600'
                          }`}>
                            {tx.status === 'completed' ? 'Berhasil' :
                             tx.status === 'pending' ? 'Menunggu' :
                             tx.status === 'processing' ? 'Diproses' : 'Gagal'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ISI SALDO (TOP UP) */}
        {/* ========================================================================= */}
        {activeTab === 'topup' && (
          <div className="space-y-4">
            {/* Active Pending Instructions if any */}
            {activeTopUpTx ? (
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Clock className="w-4 h-4 animate-spin" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">Selesaikan Pembayaran Top Up</h3>
                      <p className="text-[11px] text-slate-500">No. Ref: {activeTopUpTx.reference_id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTopUpTx(null)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                  >
                    Buat Baru
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1">
                  <span className="text-xs text-slate-500 font-medium">Nominal yang Harus Dibayar:</span>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900">
                    {formatCurrency(activeTopUpTx.amount)}
                  </div>
                  <span className="text-[10px] text-slate-500">Metode: {activeTopUpTx.payment_method}</span>
                </div>

                {/* Virtual Account / Payment Code Display */}
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-950">Nomor Virtual Account / Kode Bayar:</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('88019' + (user?.id.replace(/\D/g, '').slice(0, 7) || '1234567'));
                        onToast('Nomor VA disalin!', 'success');
                      }}
                      className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin</span>
                    </button>
                  </div>
                  <div className="text-lg font-mono font-black text-indigo-900 tracking-wider">
                    88019{user?.id.replace(/\D/g, '').slice(0, 7) || '1234567'}
                  </div>
                  <p className="text-[11px] text-indigo-800/80">
                    Nama Akun: <span className="font-bold">NEXA - {user?.full_name || user?.username}</span>
                  </p>
                </div>

                {/* Simulated Payment Verification / Proof Upload */}
                <div className="space-y-2 pt-2">
                  <label className="font-bold text-xs text-slate-800 block">
                    Upload Bukti Pembayaran / Simulasi Verifikasi:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={paymentProofInput}
                      onChange={e => setPaymentProofInput(e.target.value)}
                      placeholder="URL bukti transfer (misal: https://example.com/proof.jpg)"
                      className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-600"
                    />
                    <button
                      onClick={() => handleUploadPaymentProof(paymentProofInput || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600')}
                      disabled={isUploadingProof}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                    >
                      {isUploadingProof ? 'Mengunggah...' : 'Kirim Bukti'}
                    </button>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      onClick={() => handleUploadPaymentProof('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600')}
                      className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Simulasi Upload Bukti Instan</span>
                    </button>
                    <button
                      onClick={() => setSelectedTxForReceipt(activeTopUpTx)}
                      className="text-xs text-slate-600 hover:underline font-semibold"
                    >
                      Buka Struk
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Create Top Up Form */
              <form onSubmit={handleCreateTopUp} className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-100 shadow-xs space-y-5">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">Pilih Nominal Top Up</h3>
                  <p className="text-xs text-slate-500">Saldo akan bertambah otomatis setelah verifikasi pembayaran.</p>
                </div>

                {/* Preset Chips */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {TOP_UP_PRESETS.map(amount => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => handleSelectPreset(amount)}
                      className={`p-2.5 rounded-2xl border text-xs font-bold transition-all ${
                        topUpAmount === amount
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {formatCurrency(amount)}
                    </button>
                  ))}
                </div>

                {/* Custom Input */}
                <div>
                  <label className="font-bold text-xs text-slate-700 block mb-1">
                    Atau Masukkan Nominal Sendiri (Rp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-slate-400 text-xs">
                      Rp
                    </span>
                    <input
                      type="text"
                      value={customTopUpInput}
                      onChange={e => handleCustomTopUpChange(e.target.value)}
                      placeholder="50.000"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Min. Rp 10.000 • Maks. Rp 10.000.000
                  </span>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2">
                  <label className="font-bold text-xs text-slate-700 block">Metode Pembayaran</label>
                  <div className="space-y-2">
                    {[
                      { name: 'BCA Virtual Account', icon: Building2, desc: 'Verifikasi instan 24 jam' },
                      { name: 'Mandiri Virtual Account', icon: Building2, desc: 'Verifikasi otomatis' },
                      { name: 'BRI Virtual Account (BRIVA)', icon: Building2, desc: 'Bebas biaya admin' },
                      { name: 'QRIS Instan (Semua E-Wallet/Bank)', icon: QrCode, desc: 'Scan langsung dari aplikasi' },
                      { name: 'GoPay / OVO / Dana', icon: Smartphone, desc: 'E-wallet populer' }
                    ].map(method => (
                      <label
                        key={method.name}
                        onClick={() => setTopUpMethod(method.name)}
                        className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                          topUpMethod === method.name
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-2xs'
                            : 'border-slate-100 hover:border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            topUpMethod === method.name ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <method.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-900 block">{method.name}</span>
                            <span className="text-[10px] text-slate-500">{method.desc}</span>
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="topup_method"
                          checked={topUpMethod === method.name}
                          onChange={() => setTopUpMethod(method.name)}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isSubmittingTopUp}
                  className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs transition-all"
                >
                  {isSubmittingTopUp ? 'Memproses Permintaan...' : `Lanjut Isi Saldo ${formatCurrency(topUpAmount)}`}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: KIRIM UANG (TRANSFER) */}
        {/* ========================================================================= */}
        {activeTab === 'transfer' && (
          <div className="space-y-4">
            {/* STEP 1: FORM */}
            {transferStep === 'form' && (
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-100 shadow-xs space-y-5">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">Tujuan Pengiriman Uang</h3>
                  <p className="text-xs text-slate-500">Pilih jenis tujuan transfer saldo Anda.</p>
                </div>

                {/* Recipient Type Segmented Control */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setTransferType('nexa_user')}
                    className={`py-2 rounded-xl transition-all ${
                      transferType === 'nexa_user' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Sesama NEXA
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferType('bank_account')}
                    className={`py-2 rounded-xl transition-all ${
                      transferType === 'bank_account' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Rekening Bank
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferType('ewallet')}
                    className={`py-2 rounded-xl transition-all ${
                      transferType === 'ewallet' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    E-Wallet
                  </button>
                </div>

                {/* DESTINATION: SESAMA NEXA USER */}
                {transferType === 'nexa_user' && (
                  <div className="space-y-3">
                    <label className="font-bold text-xs text-slate-700 block">Cari Username NEXA</label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchUserQuery}
                        onChange={e => setSearchUserQuery(e.target.value)}
                        placeholder="Ketik nama atau @username..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>

                    {isSearchingUsers && (
                      <div className="text-center py-2 text-xs text-slate-400">Mencari pengguna...</div>
                    )}

                    {foundUsers.length > 0 && (
                      <div className="border border-slate-100 rounded-2xl p-1 bg-slate-50 max-h-40 overflow-y-auto space-y-1">
                        {foundUsers.map(u => (
                          <div
                            key={u.id}
                            onClick={() => {
                              setSelectedUserRecipient(u);
                              setSearchUserQuery(u.username || '');
                              setFoundUsers([]);
                            }}
                            className="p-2 rounded-xl hover:bg-white flex items-center justify-between cursor-pointer text-xs"
                          >
                            <div className="flex items-center gap-2">
                              {u.avatar_url ? (
                                <img src={u.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                                  {u.username?.[0]?.toUpperCase()}
                                </div>
                              )}
                              <div>
                                <span className="font-bold text-slate-900 block">{u.full_name || u.username}</span>
                                <span className="text-[10px] text-slate-500">@{u.username}</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-indigo-600">Pilih</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedUserRecipient && (
                      <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                            {selectedUserRecipient.username?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <span className="font-extrabold text-indigo-950 block">
                              {selectedUserRecipient.full_name || selectedUserRecipient.username}
                            </span>
                            <span className="text-[10px] text-indigo-700">@{selectedUserRecipient.username}</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                          Terpilih
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* DESTINATION: REKENING BANK */}
                {transferType === 'bank_account' && (
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Bank Tujuan</label>
                      <select
                        value={bankName}
                        onChange={e => setBankName(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-xs"
                      >
                        <option value="BCA">Bank Central Asia (BCA)</option>
                        <option value="Mandiri">Bank Mandiri</option>
                        <option value="BRI">Bank Rakyat Indonesia (BRI)</option>
                        <option value="BNI">Bank Negara Indonesia (BNI)</option>
                        <option value="CIMB Niaga">CIMB Niaga</option>
                        <option value="Permata">Bank Permata</option>
                        <option value="BSI">Bank Syariah Indonesia (BSI)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Nomor Rekening</label>
                      <input
                        type="text"
                        value={bankAccountNumber}
                        onChange={e => setBankAccountNumber(e.target.value)}
                        placeholder="Contoh: 1234567890"
                        className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Nama Pemilik Rekening</label>
                      <input
                        type="text"
                        value={bankAccountHolder}
                        onChange={e => setBankAccountHolder(e.target.value)}
                        placeholder="Sesuai nama di buku tabungan"
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* DESTINATION: E-WALLET */}
                {transferType === 'ewallet' && (
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Penyedia E-Wallet</label>
                      <select
                        value={ewalletProvider}
                        onChange={e => setEwalletProvider(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-xs"
                      >
                        <option value="GoPay">GoPay</option>
                        <option value="OVO">OVO</option>
                        <option value="Dana">Dana</option>
                        <option value="ShopeePay">ShopeePay</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Nomor HP Terdaftar</label>
                      <input
                        type="text"
                        value={ewalletPhone}
                        onChange={e => setEwalletPhone(e.target.value)}
                        placeholder="Contoh: 081234567890"
                        className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Nama Akun E-Wallet</label>
                      <input
                        type="text"
                        value={ewalletAccountHolder}
                        onChange={e => setEwalletAccountHolder(e.target.value)}
                        placeholder="Nama pemilik e-wallet"
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* NOMINAL & NOTES */}
                <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nominal Transfer (Rp)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-slate-400">
                        Rp
                      </span>
                      <input
                        type="text"
                        value={transferAmount}
                        onChange={e => {
                          const num = Number(e.target.value.replace(/\D/g, ''));
                          setTransferAmount(num ? new Intl.NumberFormat('id-ID').format(num) : '');
                        }}
                        placeholder="Contoh: 50.000"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                      <span>Saldo Tersedia: <span className="font-bold text-slate-800">{formatCurrency(walletInfo?.balance || 0)}</span></span>
                      <span>Bebas Biaya Transfer</span>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Catatan (Opsional)</label>
                    <input
                      type="text"
                      value={transferNotes}
                      onChange={e => setTransferNotes(e.target.value)}
                      placeholder="Bayar makan siang / Uang jajan / dsb"
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>

                  {(transferType === 'bank_account' || transferType === 'ewallet') && (
                    <label className="flex items-center gap-2 pt-1 text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveToRecipients}
                        onChange={e => setSaveToRecipients(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Simpan penerima ini ke Daftar Penerima Saya</span>
                    </label>
                  )}
                </div>

                {/* Continue to Confirmation */}
                <button
                  type="button"
                  onClick={handleProceedToConfirmTransfer}
                  className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs transition-all"
                >
                  Lanjut ke Konfirmasi
                </button>
              </div>
            )}

            {/* STEP 2: CONFIRMATION SUMMARY */}
            {transferStep === 'confirm' && (
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-100 shadow-xs space-y-5">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">Konfirmasi Rincian Transfer</h3>
                  <p className="text-xs text-slate-500">Periksa kembali informasi tujuan dan nominal sebelum memasukkan PIN.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-slate-500">Tujuan:</span>
                    <div className="text-right font-bold text-slate-900">
                      {transferType === 'nexa_user' && `${selectedUserRecipient?.full_name || selectedUserRecipient?.username} (@${selectedUserRecipient?.username})`}
                      {transferType === 'bank_account' && `${bankAccountHolder} (${bankName} - ${bankAccountNumber})`}
                      {transferType === 'ewallet' && `${ewalletAccountHolder} (${ewalletProvider} - ${ewalletPhone})`}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Nominal:</span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {formatCurrency(Number(transferAmount.replace(/\D/g, '')))}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Biaya Admin:</span>
                    <span className="font-bold text-emerald-600">Gratis (Rp 0 Promo)</span>
                  </div>

                  {transferNotes && (
                    <div className="flex items-center justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">Catatan:</span>
                      <span className="text-slate-700 italic">"{transferNotes}"</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 font-extrabold text-slate-900 text-sm">
                    <span>Total Ditagih:</span>
                    <span>{formatCurrency(Number(transferAmount.replace(/\D/g, '')))}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTransferStep('form')}
                    className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
                  >
                    Ubah
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToPin}
                    className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs"
                  >
                    Konfirmasi & Masukkan PIN
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PIN VERIFICATION */}
            {transferStep === 'pin' && (
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-100 shadow-xs space-y-5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center mx-auto shadow-2xs">
                  <Lock className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Masukkan PIN Transaksi 6 Digit</h3>
                  <p className="text-xs text-slate-500 mt-1">Otorisasi transaksi transfer saldo NEXA secara aman.</p>
                </div>

                {/* 6 Digit Box Inputs */}
                <div className="flex justify-center gap-2 py-2">
                  {[0, 1, 2, 3, 4, 5].map(idx => (
                    <div
                      key={idx}
                      className={`w-10 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-bold transition-all ${
                        enteredPin.length > idx
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      {enteredPin.length > idx ? '•' : ''}
                    </div>
                  ))}
                </div>

                {pinError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold">
                    {pinError}
                  </div>
                )}

                {/* Sleek Numeric Keypad */}
                <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto pt-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        if (enteredPin.length < 6) {
                          setEnteredPin(prev => prev + num);
                        }
                      }}
                      className="py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-900 font-extrabold text-base transition-all"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setEnteredPin('')}
                    className="py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-500 font-bold text-xs transition-all"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (enteredPin.length < 6) {
                        setEnteredPin(prev => prev + '0');
                      }
                    }}
                    className="py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-900 font-extrabold text-base transition-all"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnteredPin(prev => prev.slice(0, -1))}
                    className="py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-500 font-bold text-xs transition-all"
                  >
                    ⌫
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setTransferStep('confirm')}
                    className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteTransfer}
                    disabled={isSubmittingTransfer || enteredPin.length !== 6}
                    className="flex-1 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-extrabold text-xs shadow-xs"
                  >
                    {isSubmittingTransfer ? 'Memproses...' : 'Kirim Sekarang'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: SUCCESS SCREEN */}
            {transferStep === 'success' && completedTransferTx && (
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-xs text-center space-y-5">
                <div className="w-14 h-14 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="font-black text-lg text-slate-900">Transfer Berhasil Terkirim!</h3>
                  <p className="text-xs text-slate-500 mt-1">Saldo telah berhasil dipindahkan.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-xs text-slate-500 font-medium">Total Terkirim:</span>
                  <div className="text-2xl font-black text-slate-900">
                    {formatCurrency(completedTransferTx.amount)}
                  </div>
                  <span className="text-[11px] text-slate-600 block">
                    Penerima: <span className="font-bold">{completedTransferTx.recipient_name}</span> ({completedTransferTx.recipient_provider || 'NEXA'})
                  </span>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTxForReceipt(completedTransferTx)}
                    className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs"
                  >
                    Lihat Bukti Transaksi Resmi (Struk)
                  </button>
                  <button
                    type="button"
                    onClick={handleResetTransferForm}
                    className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
                  >
                    Kirim Uang Lagi
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: DAFTAR PENERIMA (SAVED RECIPIENTS) */}
        {/* ========================================================================= */}
        {activeTab === 'recipients' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Daftar Penerima Tersimpan</h3>
                <p className="text-xs text-slate-500">Kirim uang lebih cepat ke kontak favorit Anda.</p>
              </div>
              <button
                onClick={() => setIsAddRecipientOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Penerima</span>
              </button>
            </div>

            {recipients.length === 0 ? (
              <div className="p-8 rounded-3xl bg-white border border-slate-100 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Belum Ada Penerima Tersimpan</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                    Simpan nomor rekening atau akun e-wallet agar Anda tidak perlu mengetik ulang setiap kali transfer.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddRecipientOpen(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-xs"
                >
                  + Tambah Penerima Sekarang
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {recipients.map(rec => (
                  <div
                    key={rec.id}
                    className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-2xs flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                        {rec.recipient_type === 'bank_account' ? <Building2 className="w-4 h-4" /> :
                         rec.recipient_type === 'ewallet' ? <Smartphone className="w-4 h-4" /> :
                         <Users className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{rec.recipient_name}</span>
                        <span className="text-[11px] text-slate-500">
                          {rec.provider} • <span className="font-mono">{rec.account_identifier}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleSelectSavedRecipient(rec)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                      >
                        Kirim
                      </button>
                      <button
                        onClick={() => handleDeleteRecipient(rec.id)}
                        title="Hapus"
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: RIWAYAT TRANSAKSI LENGKAP (LEDGER) */}
        {/* ========================================================================= */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">Buku Besar & Riwayat Transaksi</h3>
              <p className="text-xs text-slate-500">Semua riwayat mutasi saldo masuk dan keluar secara rinci.</p>
            </div>

            {/* Filter Controls */}
            <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-2xs space-y-2.5 text-xs">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={e => setHistorySearchQuery(e.target.value)}
                  placeholder="Cari No. Referensi atau nama penerima..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 font-semibold text-[11px]">
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'income', label: 'Uang Masuk (+)' },
                  { id: 'expense', label: 'Uang Keluar (-)' },
                  { id: 'topup', label: 'Isi Saldo' },
                  { id: 'transfer', label: 'Transfer' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setHistoryFilterType(f.id)}
                    className={`px-3 py-1 rounded-lg whitespace-nowrap transition-all ${
                      historyFilterType === f.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Transaction Item Feed */}
            {filteredHistory.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-100 text-xs">
                Tidak ada transaksi yang cocok dengan filter.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredHistory.map(tx => {
                  const isCredit = tx.direction === 'credit' || (tx.type === 'transfer' && tx.recipient_id === user?.id);
                  return (
                    <div
                      key={tx.id}
                      onClick={() => setSelectedTxForReceipt(tx)}
                      className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-100 shadow-2xs cursor-pointer flex items-center justify-between transition-all text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          tx.status === 'failed' ? 'bg-rose-50 text-rose-600' :
                          isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {tx.status === 'failed' ? <X className="w-4 h-4" /> :
                           isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block leading-tight">{tx.description}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {tx.reference_id} • {formatDate(tx.completed_at || tx.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`font-black text-xs sm:text-sm block ${
                          tx.status === 'failed' ? 'text-slate-400 line-through' :
                          isCredit ? 'text-emerald-600' : 'text-slate-900'
                        }`}>
                          {isCredit && '+'}{tx.direction === 'debit' && '-'}{formatCurrency(tx.amount)}
                        </span>
                        <span className={`text-[10px] font-bold ${
                          tx.status === 'completed' ? 'text-emerald-600' :
                          tx.status === 'pending' ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {tx.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: KEAMANAN & PENGATURAN PIN */}
        {/* ========================================================================= */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">Keamanan Transaksi Dompet</h3>
                  <p className="text-xs text-slate-500">Kelola PIN 6-digit dan preferensi privasi.</p>
                </div>
              </div>

              {/* PIN Status Item */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">PIN Transaksi 6-Digit</span>
                  <span className="text-[11px] text-slate-500">
                    {walletInfo?.pin_set ? 'PIN telah diatur & aktif melindungi transaksi' : 'Belum diatur (Wajib untuk transfer)'}
                  </span>
                </div>
                <button
                  onClick={() => setIsPinModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs"
                >
                  {walletInfo?.pin_set ? 'Ubah PIN' : 'Atur PIN Sekarang'}
                </button>
              </div>

              {/* Privacy Masking Toggle */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div className="max-w-[70%]">
                  <span className="font-bold text-slate-900 block">Samarkan Nominal Notifikasi</span>
                  <span className="text-[11px] text-slate-500">
                    Sembunyikan angka saldo dan nominal pada pop-up push notification demi privasi Anda di tempat umum.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(walletInfo?.mask_financial_notifs)}
                    onChange={handleTogglePrivacyNotifs}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Security info bullet list */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 space-y-1.5">
                <span className="font-bold block">Prinsip Keamanan Finansial NEXA:</span>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-indigo-900/80">
                  <li>Otentikasi ganda dengan PIN transaksi 6-digit enkripsi server-side.</li>
                  <li>Proteksi brute-force dengan penguncian otomatis jika gagal 5 kali berturut-turut.</li>
                  <li>Limit transfer harian terproteksi: Rp 10.000.000 / Hari.</li>
                  <li>Buku besar transaksi (ledger) terenkripsi dan tidak dapat diubah secara ilegal.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* PIN SETUP / CHANGE MODAL */}
      {/* ========================================================================= */}
      {isPinModalOpen && (
        <div 
          className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150"
          onClick={() => setIsPinModalOpen(false)}
        >
          <form 
            onSubmit={handleSavePin} 
            className="bg-white w-full max-w-sm rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[calc(100dvh-24px)] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between shrink-0 pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-extrabold text-base text-slate-900">
                {walletInfo?.pin_set ? 'Ubah PIN Transaksi' : 'Atur PIN Transaksi Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {pinModalError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold mb-3 shrink-0">
                {pinModalError}
              </div>
            )}

            <div className="space-y-3 text-xs flex-1 min-h-0 overflow-y-auto overscroll-contain pr-0.5">
              {walletInfo?.pin_set && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">PIN Lama (6 Digit)</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={oldPinInput}
                    onChange={e => setOldPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-center font-mono text-base tracking-widest"
                    required
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">PIN Baru (6 Digit Angka)</label>
                <input
                  type="password"
                  maxLength={6}
                  value={newPinInput}
                  onChange={e => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-center font-mono text-base tracking-widest"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Konfirmasi PIN Baru</label>
                <input
                  type="password"
                  maxLength={6}
                  value={confirmPinInput}
                  onChange={e => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-center font-mono text-base tracking-widest"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-slate-100 shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSavingPin}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs"
              >
                {isSavingPin ? 'Menyimpan...' : 'Simpan PIN'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD RECIPIENT MODAL */}
      {/* ========================================================================= */}
      {isAddRecipientOpen && (
        <div 
          className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150"
          onClick={() => setIsAddRecipientOpen(false)}
        >
          <form 
            onSubmit={handleSaveNewRecipient} 
            className="bg-white w-full max-w-sm rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[calc(100dvh-24px)] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between shrink-0 pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-extrabold text-base text-slate-900">Tambah Penerima Baru</h3>
              <button
                type="button"
                onClick={() => setIsAddRecipientOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs flex-1 min-h-0 overflow-y-auto overscroll-contain pr-0.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Pemilik / Alias</label>
                <input
                  type="text"
                  value={newRecipName}
                  onChange={e => setNewRecipName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Jenis Tujuan</label>
                <select
                  value={newRecipType}
                  onChange={e => setNewRecipType(e.target.value as RecipientType)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold"
                >
                  <option value="bank_account">Rekening Bank</option>
                  <option value="ewallet">E-Wallet</option>
                  <option value="nexa_user">Pengguna NEXA</option>
                </select>
              </div>

              {newRecipType === 'bank_account' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bank</label>
                  <select
                    value={newRecipProvider}
                    onChange={e => setNewRecipProvider(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="BCA">BCA</option>
                    <option value="Mandiri">Mandiri</option>
                    <option value="BRI">BRI</option>
                    <option value="BNI">BNI</option>
                    <option value="CIMB Niaga">CIMB Niaga</option>
                  </select>
                </div>
              )}

              {newRecipType === 'ewallet' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Provider E-Wallet</label>
                  <select
                    value={newRecipProvider}
                    onChange={e => setNewRecipProvider(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="GoPay">GoPay</option>
                    <option value="OVO">OVO</option>
                    <option value="Dana">Dana</option>
                    <option value="ShopeePay">ShopeePay</option>
                  </select>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {newRecipType === 'bank_account' ? 'Nomor Rekening' :
                   newRecipType === 'ewallet' ? 'Nomor HP' : 'Username (@username)'}
                </label>
                <input
                  type="text"
                  value={newRecipAccount}
                  onChange={e => setNewRecipAccount(e.target.value)}
                  placeholder={newRecipType === 'bank_account' ? '1234567890' : newRecipType === 'ewallet' ? '081234567890' : '@username'}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-slate-100 shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setIsAddRecipientOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSavingRecipient}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs"
              >
                {isSavingRecipient ? 'Menyimpan...' : 'Simpan Penerima'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIGITAL RECEIPT MODAL */}
      {/* ========================================================================= */}
      <DigitalReceiptModal
        transaction={selectedTxForReceipt}
        isOpen={Boolean(selectedTxForReceipt)}
        onClose={() => setSelectedTxForReceipt(null)}
        currentUserId={user?.id}
        onToast={onToast}
      />

      {/* ========================================================================= */}
      {/* ADMIN FINANCIAL MANAGEMENT MODAL */}
      {/* ========================================================================= */}
      {isAdminFinancialOpen && (
        <AdminFinancialModal
          isOpen={isAdminFinancialOpen}
          onClose={() => setIsAdminFinancialOpen(false)}
          onToast={onToast}
          onTransactionUpdated={loadWalletData}
        />
      )}
    </div>
  );
};
