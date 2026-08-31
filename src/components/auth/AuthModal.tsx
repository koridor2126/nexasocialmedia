import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { X, Eye, EyeOff, Lock, Mail, User, ShieldCheck, Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  initialMode?: 'login' | 'register' | 'forgot';
  onClose?: () => void;
  isStandalone?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  initialMode = 'login',
  onClose,
  isStandalone = false
}) => {
  const { login, register } = useAuth();
  const { showToast } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [identifier, setIdentifier] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'user' | 'creator' | 'brand'>('user');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setErrorMsg('Harap masukkan username/email dan kata sandi.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await login({ identifier, password });
      showToast('Berhasil masuk ke NEXA!', 'success');
      onClose?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal masuk. Periksa kembali informasi Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !username || !email || !password) {
      setErrorMsg('Harap isi semua kolom wajib.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await register({
        full_name: fullName,
        username,
        email,
        password,
        confirm_password: confirmPassword,
        role: selectedRole
      });
      showToast('Akun NEXA Anda berhasil dibuat!', 'success');
      onClose?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mendaftar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Harap masukkan email Anda.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.forgotPassword(email);
      setSuccessMsg(res.message);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses permintaan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (userEmail: string) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await login({ identifier: userEmail, password: 'password123' });
      showToast('Masuk sebagai demo akun!', 'success');
      onClose?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal masuk demo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col my-auto relative">
      {/* Close button if modal */}
      {onClose && !isStandalone && (
        <button
          id="auth-modal-close-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-extrabold text-xl shadow-md mb-3">
          N
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          {mode === 'login' && 'Masuk ke NEXA'}
          {mode === 'register' && 'Daftar Akun NEXA'}
          {mode === 'forgot' && 'Pemulihan Kata Sandi'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          {mode === 'login' && 'Platform social media modern dan ekosistem digital'}
          {mode === 'register' && 'Mulai terhubung dan berbagi cerita Anda hari ini'}
          {mode === 'forgot' && 'Masukkan email terdaftar Anda untuk pemulihan akun'}
        </p>
      </div>

      {/* Error / Success Feedback */}
      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium leading-relaxed">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* LOGIN FORM */}
      {mode === 'login' && (
        <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Username atau Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-identifier-input"
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="contoh: arvin atau arvin@example.com"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Kata Sandi
              </label>
              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setErrorMsg(null);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Lupa sandi?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-semibold text-sm transition-all shadow-md shadow-slate-900/10 disabled:opacity-50 mt-2"
          >
            {isSubmitting ? 'Memproses...' : 'Masuk'}
          </button>

          {/* Quick Demo Accounts */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <span className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider text-center mb-2.5">
              Akses Cepat Demo (Satu Klik)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('arvin@example.com')}
                className="p-2 rounded-xl border border-slate-200 hover:border-slate-900 hover:bg-slate-50 text-left transition-all text-xs"
              >
                <span className="font-bold text-slate-900 block truncate">Arvin (Creator)</span>
                <span className="text-[10px] text-slate-600">@arvin</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('clara@example.com')}
                className="p-2 rounded-xl border border-slate-200 hover:border-slate-900 hover:bg-slate-50 text-left transition-all text-xs"
              >
                <span className="font-bold text-slate-900 block truncate">Clara (Creator)</span>
                <span className="text-[10px] text-slate-600">@clarasals</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('contact@studiokroma.id')}
                className="p-2 rounded-xl border border-slate-200 hover:border-slate-900 hover:bg-slate-50 text-left transition-all text-xs"
              >
                <span className="font-bold text-slate-900 block truncate">Studio Kroma</span>
                <span className="text-[10px] text-slate-600">Brand</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@nexa.app')}
                className="p-2 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-left transition-all text-xs"
              >
                <span className="font-bold text-indigo-900 block truncate">NEXA Admin</span>
                <span className="text-[10px] text-indigo-600">Admin</span>
              </button>
            </div>
          </div>

          <div className="mt-2 text-center text-xs text-slate-600">
            Belum punya akun?{' '}
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className="font-semibold text-slate-900 hover:underline"
            >
              Daftar Sekarang
            </button>
          </div>
        </form>
      )}

      {/* REGISTER FORM */}
      {mode === 'register' && (
        <form onSubmit={handleRegister} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Lengkap
            </label>
            <input
              id="register-fullname-input"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Contoh: Rian Pratama"
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username
              </label>
              <input
                id="register-username-input"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                placeholder="rianpratama"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Role Akun
              </label>
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value as any)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-xs text-slate-900 bg-white"
              >
                <option value="user">User Umum</option>
                <option value="creator">Creator</option>
                <option value="brand">Brand / Bisnis</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="register-email-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="rian@example.com"
                required
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kata Sandi
              </label>
              <input
                id="register-password-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 6 karakter"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Konfirmasi Sandi
              </label>
              <input
                id="register-confirm-password-input"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Ulangi sandi"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          <button
            id="register-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-semibold text-sm transition-all shadow-md shadow-slate-900/10 disabled:opacity-50 mt-2"
          >
            {isSubmitting ? 'Membuat Akun...' : 'Daftar Sekarang'}
          </button>

          <div className="mt-2 text-center text-xs text-slate-600">
            Sudah memiliki akun?{' '}
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className="font-semibold text-slate-900 hover:underline"
            >
              Masuk
            </button>
          </div>
        </form>
      )}

      {/* FORGOT PASSWORD FORM */}
      {mode === 'forgot' && (
        <form onSubmit={handleForgotPassword} className="flex flex-col gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Alamat Email Akun
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="forgot-email-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email.anda@domain.com"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          <button
            id="forgot-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-semibold text-sm transition-all shadow-md shadow-slate-900/10 disabled:opacity-50 mt-1"
          >
            {isSubmitting ? 'Mengirim...' : 'Kirim Tautan Pemulihan'}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Masuk</span>
          </button>
        </form>
      )}
    </div>
  );

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      {content}
    </div>
  );
};
