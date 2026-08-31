import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  Smartphone,
  Laptop,
  CheckCircle2,
  Trash2,
  ShieldAlert,
  Send,
  Sliders,
  Radio,
  RefreshCw,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu
} from 'lucide-react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import {
  requestAndRegisterPushToken,
  getNotificationPermission,
  isPushNotificationSupported,
  isRunningInIframe,
  triggerSystemNotification,
  getPushDiagnosticInfo,
  PushDiagnosticInfo
} from '../../services/pushNotification';
import { NotificationPreferences, UserDevice } from '../../types';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { showToast, refreshCounters } = useApp();

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    id: '',
    user_id: '',
    new_followers: true,
    likes: true,
    comments: true,
    shares: true,
    messages: true,
    system: true,
    push_enabled: true,
    updated_at: new Date().toISOString()
  });

  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [sendingTest, setSendingTest] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default');
  const [isIframe, setIsIframe] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnostics, setDiagnostics] = useState<PushDiagnosticInfo | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setIsIframe(isRunningInIframe());
      setPermissionStatus(getNotificationPermission());
      refreshDiagnostics();
    }
  }, [isOpen]);

  const refreshDiagnostics = async () => {
    const info = await getPushDiagnosticInfo();
    setDiagnostics(info);
    setPermissionStatus(info.browserPermission);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [prefRes, devRes] = await Promise.all([
        api.getNotificationPreferences(),
        api.getRegisteredDevices()
      ]);
      if (prefRes.preferences) {
        setPreferences(prefRes.preferences);
      }
      if (devRes.devices) {
        setDevices(devRes.devices);
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat preferensi notifikasi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePref = async (key: keyof NotificationPreferences) => {
    const updated = {
      ...preferences,
      [key]: !preferences[key]
    };
    setPreferences(updated);
    setSavingPrefs(true);
    try {
      await api.updateNotificationPreferences({ [key]: updated[key] });
      showToast('Preferensi diperbarui', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan preferensi.', 'error');
      // revert
      setPreferences(preferences);
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleRequestBrowserPermission = async () => {
    try {
      const res = await requestAndRegisterPushToken();
      setPermissionStatus(res.permission);
      await refreshDiagnostics();

      if (res.success) {
        showToast('Push notifikasi browser aktif & perangkat didaftarkan!', 'success');
        loadData();
        refreshCounters();

        // Trigger welcoming test notification directly
        await triggerSystemNotification({
          title: 'NEXA',
          body: '🔔 Notifikasi push berhasil diaktifkan untuk perangkat ini.'
        });
      } else if (res.permission === 'denied') {
        showToast('Izin notifikasi diblokir oleh browser Anda.', 'info');
      } else {
        showToast(res.error || 'Izin notifikasi belum diaktifkan.', 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan.', 'error');
    }
  };

  const handleOpenInNewTab = () => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank');
    }
  };

  const handleRemoveDevice = async (deviceIdOrToken: string) => {
    try {
      await api.removeDeviceToken(deviceIdOrToken);
      setDevices(prev => prev.filter(d => d.id !== deviceIdOrToken && d.fcm_token !== deviceIdOrToken));
      showToast('Perangkat berhasil dihapus dari daftar notifikasi push.', 'success');
      refreshDiagnostics();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus perangkat.', 'error');
    }
  };

  const handleSendTestNotification = async (type: string) => {
    setSendingTest(type);
    try {
      const res = await api.sendTestNotification({
        type,
        custom_message: `Uji coba notifikasi ${type} berhasil dikirim!`
      });

      // Also dispatch real native system notification to test desktop/Android popups
      const notifTitles: Record<string, string> = {
        like: '❤️ Suka Baru - NEXA',
        comment: '💬 Komentar Baru - NEXA',
        follow: '👤 Pengikut Baru - NEXA',
        share: '↗️ Postingan Dibagikan - NEXA',
        message: '💬 Pesan Baru - NEXA',
        system: '🔔 Pengumuman Sistem - NEXA'
      };

      await triggerSystemNotification({
        title: notifTitles[type] || 'NEXA',
        body: res.notification?.message || `Uji coba notifikasi ${type} berhasil!`,
        icon: '/favicon.ico',
        data: {
          type,
          postId: res.notification?.post_id,
          url: '/'
        }
      });

      showToast(res.message || 'Notifikasi uji coba berhasil dikirim!', 'success');
      refreshCounters();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengirim notifikasi uji coba.', 'error');
    } finally {
      setSendingTest(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        id="modal-notification-settings"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Pengaturan Notifikasi</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Kelola izin push dan kategori pemberitahuan NEXA</p>
            </div>
          </div>
          <button
            id="btn-close-notification-settings"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Permission Status Box */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className={`w-4 h-4 ${permissionStatus === 'granted' ? 'text-emerald-500 animate-pulse' : 'text-blue-500'}`} />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Status Push Notifikasi Browser</span>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  permissionStatus === 'granted'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : permissionStatus === 'denied'
                    ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-800'
                    : permissionStatus === 'unsupported'
                    ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                }`}
              >
                {permissionStatus === 'granted'
                  ? '🟢 Push Notification Aktif'
                  : permissionStatus === 'denied'
                  ? '🔴 Push Notification Diblokir'
                  : permissionStatus === 'unsupported'
                  ? '⚪ Tidak Didukung Browser'
                  : '🟡 Menunggu Izin Browser'}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              {permissionStatus === 'granted'
                ? 'Browser & perangkat ini terdaftar untuk menerima push notification instan saat ada like, komentar, follow, chat, atau aktivitas baru.'
                : permissionStatus === 'denied'
                ? 'Notifikasi browser diblokir. Aktifkan izin notifikasi untuk NEXA melalui pengaturan browser (ikon gembok/setelan situs pada bilah alamat).'
                : permissionStatus === 'unsupported'
                ? 'Browser atau lingkungan ini tidak mendukung Web Push / Notification API.'
                : 'Izinkan notifikasi browser untuk menerima pembaruan secara real-time meskipun tab ditutup atau sedang di background.'}
            </p>

            {/* In-iframe notice */}
            {isIframe && permissionStatus !== 'granted' && (
              <div className="p-2.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-start justify-between gap-2">
                <div className="text-[11px] text-blue-800 dark:text-blue-200">
                  <span className="font-semibold block">Catatan Preview Iframe:</span>
                  Beberapa browser membatasi permintaan izin notifikasi di dalam frame iframe. Anda dapat membuka di Tab Baru untuk mengizinkan notifikasi sistem secara langsung.
                </div>
                <button
                  onClick={handleOpenInNewTab}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold shrink-0 flex items-center gap-1 shadow-xs"
                >
                  <ExternalLink className="w-3 h-3" />
                  Tab Baru
                </button>
              </div>
            )}

            {permissionStatus === 'default' && isPushNotificationSupported() && (
              <button
                id="btn-request-push-permission-modal"
                onClick={handleRequestBrowserPermission}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                Minta Izin Notifikasi Browser
              </button>
            )}
          </div>

          {/* Master Push Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Push Notifikasi Keseluruhan</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Aktifkan/nonaktifkan pengiriman push ke perangkat</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.push_enabled}
                onChange={() => handleTogglePref('push_enabled')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Category Preferences */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Kategori Pemberitahuan
            </h4>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
              {/* Followers */}
              <div className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-base">👤</span>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Pengikut Baru</p>
                    <p className="text-xs text-slate-400">Saat ada pengguna lain yang mulai mengikuti Anda</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.new_followers}
                    onChange={() => handleTogglePref('new_followers')}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Likes */}
              <div className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-base">❤️</span>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Suka & Apresiasi</p>
                    <p className="text-xs text-slate-400">Saat seseorang menyukai postingan atau video Anda</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.likes}
                    onChange={() => handleTogglePref('likes')}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Comments */}
              <div className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-base">💬</span>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Komentar Postingan</p>
                    <p className="text-xs text-slate-400">Saat postingan Anda dikomentari atau dibalas</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.comments}
                    onChange={() => handleTogglePref('comments')}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Shares */}
              <div className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-base">↗️</span>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Pembagian Postingan</p>
                    <p className="text-xs text-slate-400">Saat postingan Anda dibagikan oleh pengguna lain</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.shares}
                    onChange={() => handleTogglePref('shares')}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Messages */}
              <div className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-base">💬</span>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Pesan Langsung (Chat)</p>
                    <p className="text-xs text-slate-400">Saat Anda menerima pesan pribadi dari pengguna lain</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.messages}
                    onChange={() => handleTogglePref('messages')}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* System */}
              <div className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-base">🔔</span>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Pengumuman & Sistem NEXA</p>
                    <p className="text-xs text-slate-400">Informasi resmi, update platform, dan pembaruan akun</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.system}
                    onChange={() => handleTogglePref('system')}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Connected Devices (user_devices) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Perangkat Terhubung ({devices.length})
              </h4>
              <button
                onClick={loadData}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {devices.length === 0 ? (
              <div className="p-4 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                Belum ada browser atau perangkat terdaftar untuk akun ini.
              </div>
            ) : (
              <div className="space-y-2">
                {devices.map(dev => (
                  <div
                    key={dev.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                        {dev.device_type === 'mobile' || dev.device_type === 'tablet' ? (
                          <Smartphone className="w-4 h-4" />
                        ) : (
                          <Laptop className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {dev.browser} • {dev.device_type.toUpperCase()}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          Token: {dev.fcm_token.slice(0, 16)}...
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveDevice(dev.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Hapus token perangkat ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Diagnostics Section (Collapsible Debug Panel) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Status Diagnostik & Internal Push Service</span>
              </div>
              {showDiagnostics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDiagnostics && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Browser Permission</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {diagnostics?.browserPermission || 'unknown'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Service Worker</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {diagnostics?.serviceWorkerStatus || 'not_registered'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Firebase Messaging</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {diagnostics?.fcmMessagingSupported ? 'Initialized (Web SDK)' : 'Standard Web Push Engine'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">FCM Device Token</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {diagnostics?.fcmTokenStatus === 'available' ? 'Tersedia & Terdaftar' : 'Belum Terdaftar'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Public VAPID Key</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {diagnostics?.vapidConfigured ? 'Terkonfigurasi' : 'Standar Default'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Konteks Runtime</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {diagnostics?.isIframe ? 'Preview Iframe' : 'Top-level Window'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={refreshDiagnostics}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-[11px]"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh Diagnostik
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Test Mode / Verification Simulator */}
          <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                Mode Uji Coba / Simulator Notifikasi Sistem
              </h4>
            </div>
            <p className="text-xs text-indigo-700 dark:text-indigo-300">
              Kirim notifikasi simulasi instan ke akun ini untuk memverifikasi penerimaan notifikasi sistem Android/Desktop & in-app badge secara langsung:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                disabled={sendingTest !== null}
                onClick={() => handleSendTestNotification('like')}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                ❤️ Tes Suka
              </button>

              <button
                disabled={sendingTest !== null}
                onClick={() => handleSendTestNotification('comment')}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                💬 Tes Komentar
              </button>

              <button
                disabled={sendingTest !== null}
                onClick={() => handleSendTestNotification('follow')}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                👤 Tes Follow
              </button>

              <button
                disabled={sendingTest !== null}
                onClick={() => handleSendTestNotification('share')}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                ↗️ Tes Share
              </button>

              <button
                disabled={sendingTest !== null}
                onClick={() => handleSendTestNotification('message')}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                💬 Tes Pesan
              </button>

              <button
                disabled={sendingTest !== null}
                onClick={() => handleSendTestNotification('system')}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                🔔 Tes Sistem
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end">
          <button
            id="btn-done-notification-settings"
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
