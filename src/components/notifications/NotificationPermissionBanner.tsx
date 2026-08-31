import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { requestAndRegisterPushToken, isPushNotificationSupported, getNotificationPermission } from '../../services/pushNotification';
import { useApp } from '../../context/AppContext';

export const NotificationPermissionBanner: React.FC = () => {
  const { showToast, refreshCounters } = useApp();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Only show if supported and permission is 'default' (not yet prompted or dismissed in this session)
    if (typeof window === 'undefined') return;
    const isDismissed = sessionStorage.getItem('nexa_push_banner_dismissed');
    if (!isDismissed && isPushNotificationSupported() && getNotificationPermission() === 'default') {
      // Delay showing banner slightly for smooth UX
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const result = await requestAndRegisterPushToken();
      if (result.success) {
        showToast('Notifikasi NEXA berhasil diaktifkan!', 'success');
        setIsVisible(false);
        refreshCounters();
      } else if (result.permission === 'denied') {
        showToast('Izin notifikasi ditolak. Anda dapat mengubahnya di pengaturan browser.', 'info');
        setIsVisible(false);
      } else {
        showToast(result.error || 'Gagal mengaktifkan notifikasi.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan saat mengaktifkan notifikasi.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('nexa_push_banner_dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 shadow-md transition-all duration-300 relative z-30">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-white animate-bounce" />
          </div>
          <div className="text-sm">
            <p className="font-semibold text-white">🔔 Aktifkan Notifikasi NEXA</p>
            <p className="text-blue-100 text-xs">
              Terima pemberitahuan like, komentar, followers, pesan baru, dan aktivitas penting lainnya.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            id="btn-enable-push-banner"
            onClick={handleEnableNotifications}
            disabled={isLoading}
            className="px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            Aktifkan Notifikasi
          </button>

          <button
            id="btn-dismiss-push-banner"
            onClick={handleDismiss}
            className="px-3 py-2 text-xs font-medium text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            Nanti
          </button>
        </div>
      </div>
    </div>
  );
};
