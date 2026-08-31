import React, { useState, useEffect } from 'react';
import { Notification, NotificationType } from '../../types.js';
import { api } from '../../services/api.js';
import { useApp } from '../../context/AppContext.js';
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  Sparkles, 
  CheckCheck, 
  Share2,
  Sliders,
  Trash2,
  RefreshCw,
  MessageSquare
} from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const { openUserProfile, openPostDetail, openChatWithUser, setUnreadCount, openNotificationSettings, showToast } = useApp();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async (showLoader: boolean = true) => {
    if (showLoader) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
      if (typeof setUnreadCount === 'function') {
        setUnreadCount(res.unread_count || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.is_read) {
      try {
        await api.markNotificationRead(notif.id);
        setNotifications(prev =>
          prev.map(n => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        if (typeof setUnreadCount === 'function') {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } catch (err) {
        console.error(err);
      }
    }

    // Deep linking routing based on notification type
    if (notif.type === 'message' && (notif.actor_id || notif.related_user_id)) {
      openChatWithUser(notif.actor_id || notif.related_user_id!);
    } else if (notif.type === 'follow' && (notif.actor_id || notif.related_user_id)) {
      openUserProfile(notif.actor_id || notif.related_user_id!);
    } else if ((notif.type === 'like' || notif.type === 'comment' || notif.type === 'share') && (notif.post_id || notif.related_post_id)) {
      const targetPostId = notif.post_id || notif.related_post_id;
      if (targetPostId) {
        try {
          const postRes = await api.getPost(targetPostId);
          if (postRes.post) {
            openPostDetail(postRes.post);
          }
        } catch (e) {
          showToast('Postingan tidak dapat dimuat.', 'info');
        }
      }
    } else if (notif.actor_id) {
      openUserProfile(notif.actor_id);
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation();
    try {
      await api.deleteNotification(notifId);
      setNotifications(prev => prev.filter(n => n.id !== notifId));
      showToast('Notifikasi dihapus.', 'info');
    } catch (err) {
      showToast('Gagal menghapus notifikasi.', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      if (typeof setUnreadCount === 'function') {
        setUnreadCount(0);
      }
      showToast('Semua notifikasi ditandai telah dibaca.', 'success');
    } catch (err) {
      showToast('Gagal menandai notifikasi.', 'error');
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'like':
        return <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />;
      case 'comment':
        return <MessageCircle className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />;
      case 'follow':
        return <UserPlus className="w-3.5 h-3.5 text-emerald-500" />;
      case 'share':
        return <Share2 className="w-3.5 h-3.5 text-blue-500" />;
      case 'message':
        return <MessageSquare className="w-3.5 h-3.5 text-sky-500 fill-sky-500" />;
      case 'system':
      default:
        return <Sparkles className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
    return `${Math.floor(diff / 86400)}h lalu`;
  };

  const filteredNotifs = filterType === 'all'
    ? notifications
    : notifications.filter(n => n.type === filterType);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="pb-24 pt-2 max-w-2xl mx-auto px-2 sm:px-4">
      {/* Top action header */}
      <div className="flex items-center justify-between px-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              Notifikasi
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-blue-600 text-white">
                  {unreadCount} baru
                </span>
              )}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id="btn-refresh-notifications"
            onClick={() => loadNotifications(false)}
            className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Muat ulang"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            id="btn-open-notification-settings"
            onClick={openNotificationSettings}
            className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Pengaturan Notifikasi & Push"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {unreadCount > 0 && (
            <button
              id="btn-mark-all-read"
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Tandai Dibaca</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-3 px-1">
        {[
          { key: 'all', label: 'Semua' },
          { key: 'like', label: '❤️ Suka' },
          { key: 'comment', label: '💬 Komentar' },
          { key: 'follow', label: '👤 Pengikut' },
          { key: 'share', label: '↗️ Share' },
          { key: 'message', label: '💬 Pesan' },
          { key: 'system', label: '🔔 Sistem' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filterType === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 flex gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="w-48 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="w-24 h-2.5 bg-slate-100 dark:bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredNotifs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 text-center shadow-xs flex flex-col items-center my-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 mb-3">
            <Bell className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Belum Ada Notifikasi</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-4">
            Saat orang lain menyukai, mengomentari, atau mengikuti Anda, pemberitahuan akan muncul di sini.
          </p>
          <button
            onClick={openNotificationSettings}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            Pengaturan & Tes Notifikasi
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifs.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                notif.is_read
                  ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700'
                  : 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40 hover:bg-blue-50/70 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Avatar with type badge */}
                <div className="relative shrink-0">
                  <img
                    src={notif.actor?.avatar_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${notif.actor_id || notif.id || 'system'}`}
                    alt={notif.actor?.username || 'Actor'}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-800"
                  />
                  <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white dark:bg-slate-900 shadow-xs border border-slate-100 dark:border-slate-800">
                    {getIcon(notif.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
                    {notif.content || notif.message || 'Pemberitahuan baru'}
                  </p>
                  <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                    {formatTimeAgo(notif.created_at)}
                  </span>
                </div>
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-2 shrink-0">
                {!notif.is_read && (
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                )}
                <button
                  onClick={(e) => handleDeleteNotification(e, notif.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                  title="Hapus notifikasi"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

