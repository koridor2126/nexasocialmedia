import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Post, User } from '../types.js';
import { api } from '../services/api.js';
import { useAuth } from './AuthContext.js';

export type TabType = 'home' | 'feed' | 'explore' | 'create' | 'notifications' | 'profile' | 'chat' | 'wallet' | 'match' | 'admin';

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

interface AppContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  // Navigation stack & target views
  viewingProfileId: string | null;
  setViewingProfileId: (userId: string | null) => void;
  openUserProfile: (userId: string) => void;
  
  viewingPost: Post | null;
  setViewingPost: (post: Post | null) => void;
  openPostDetail: (post: Post) => void;

  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  openChatWithUser: (targetUserId: string) => Promise<void>;

  // Modals
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  
  shareModalPost: Post | null;
  openShareModal: (post: Post) => void;
  closeShareModal: () => void;

  reportModalData: { targetType: 'post' | 'user'; targetId: string } | null;
  openReportModal: (targetType: 'post' | 'user', targetId: string) => void;
  closeReportModal: () => void;

  // Unread badge indicators
  unreadNotifsCount: number;
  setUnreadNotifsCount: (count: number) => void;
  setUnreadCount: (count: number) => void;
  unreadMessagesCount: number;
  setUnreadMessagesCount: (count: number) => void;
  refreshCounters: () => Promise<void>;

  // Notification Settings Modal
  isNotificationSettingsOpen: boolean;
  openNotificationSettings: () => void;
  closeNotificationSettings: () => void;

  // Creator Monetization Dashboard Modal
  isCreatorDashboardOpen: boolean;
  openCreatorDashboard: () => void;
  closeCreatorDashboard: () => void;

  // Wallet Modal & View
  isWalletModalOpen: boolean;
  walletInitialTab: 'overview' | 'topup' | 'transfer' | 'recipients' | 'history' | 'security';
  openWallet: (initialTab?: 'overview' | 'topup' | 'transfer' | 'recipients' | 'history' | 'security') => void;
  closeWallet: () => void;

  // Tahap 5: NEXA Match (Cari Jodoh)
  matchInitialTab: 'discover' | 'matches' | 'likes' | 'profile';
  openMatch: (tab?: 'discover' | 'matches' | 'likes' | 'profile') => void;

  // Toasts
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTabState] = useState<TabType>('home');
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [viewingPost, setViewingPost] = useState<Post | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [shareModalPost, setShareModalPost] = useState<Post | null>(null);
  const [reportModalData, setReportModalData] = useState<{ targetType: 'post' | 'user'; targetId: string } | null>(null);
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState<boolean>(false);
  const [isCreatorDashboardOpen, setIsCreatorDashboardOpen] = useState<boolean>(false);

  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);
  const [walletInitialTab, setWalletInitialTab] = useState<'overview' | 'topup' | 'transfer' | 'recipients' | 'history' | 'security'>('overview');

  const [matchInitialTab, setMatchInitialTab] = useState<'discover' | 'matches' | 'likes' | 'profile'>('discover');

  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const openNotificationSettings = useCallback(() => setIsNotificationSettingsOpen(true), []);
  const closeNotificationSettings = useCallback(() => setIsNotificationSettingsOpen(false), []);

  const openCreatorDashboard = useCallback(() => setIsCreatorDashboardOpen(true), []);
  const closeCreatorDashboard = useCallback(() => setIsCreatorDashboardOpen(false), []);

  const openWallet = useCallback((tab: 'overview' | 'topup' | 'transfer' | 'recipients' | 'history' | 'security' = 'overview') => {
    setWalletInitialTab(tab);
    setIsWalletModalOpen(true);
  }, []);
  const closeWallet = useCallback(() => setIsWalletModalOpen(false), []);

  const openMatch = useCallback((tab: 'discover' | 'matches' | 'likes' | 'profile' = 'discover') => {
    setMatchInitialTab(tab);
    setActiveTabState('match');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const refreshCounters = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadNotifsCount(0);
      setUnreadMessagesCount(0);
      return;
    }
    try {
      const notifRes = await api.getNotifications();
      setUnreadNotifsCount(notifRes.unread_count || 0);

      const convRes = await api.getConversations();
      const totalUnreadMsg = convRes.conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
      setUnreadMessagesCount(totalUnreadMsg);
    } catch (err) {
      // quiet catch
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshCounters();
      const interval = setInterval(refreshCounters, 15000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, refreshCounters]);

  // Listen for service worker notification click deep links
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NEXA_NOTIFICATION_CLICK') {
        const payload = event.data.data;
        if (payload?.postId) {
          api.getPost(payload.postId).then(res => {
            if (res.post) setViewingPost(res.post);
          }).catch(() => {});
        } else if (payload?.type === 'message' || payload?.conversationId) {
          if (payload.conversationId) setActiveConversationId(payload.conversationId);
          setActiveTabState('chat');
        } else if (payload?.type === 'follow' && payload?.actorId) {
          setViewingProfileId(payload.actorId);
          setActiveTabState('profile');
        } else if (payload?.type === 'match' || payload?.matchId) {
          setActiveTabState('match');
        } else {
          setActiveTabState('notifications');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const setActiveTab = (tab: TabType) => {
    // If switching to main tab, reset nested views
    if (tab === 'profile' && user) {
      setViewingProfileId(user.id);
    } else if (tab !== 'chat') {
      setActiveConversationId(null);
    }
    if (tab !== 'profile') {
      setViewingProfileId(null);
    }
    setViewingPost(null);
    setActiveTabState(tab);
  };

  const openUserProfile = (userId: string) => {
    setViewingProfileId(userId);
    setActiveTabState('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openPostDetail = (post: Post) => {
    setViewingPost(post);
  };

  const openChatWithUser = async (targetUserId: string) => {
    try {
      const res = await api.startConversation(targetUserId);
      setActiveConversationId(res.conversation.id);
      setActiveTabState('chat');
    } catch (err: any) {
      showToast(err.message || 'Gagal memulai percakapan', 'error');
    }
  };

  const openShareModal = (post: Post) => setShareModalPost(post);
  const closeShareModal = () => setShareModalPost(null);

  const openReportModal = (targetType: 'post' | 'user', targetId: string) =>
    setReportModalData({ targetType, targetId });
  const closeReportModal = () => setReportModalData(null);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        viewingProfileId,
        setViewingProfileId,
        openUserProfile,
        viewingPost,
        setViewingPost,
        openPostDetail,
        activeConversationId,
        setActiveConversationId,
        openChatWithUser,
        isCreateModalOpen,
        setIsCreateModalOpen,
        shareModalPost,
        openShareModal,
        closeShareModal,
        reportModalData,
        openReportModal,
        closeReportModal,
        unreadNotifsCount,
        setUnreadNotifsCount,
        setUnreadCount: setUnreadNotifsCount,
        unreadMessagesCount,
        setUnreadMessagesCount,
        refreshCounters,
        isNotificationSettingsOpen,
        openNotificationSettings,
        closeNotificationSettings,
        isCreatorDashboardOpen,
        openCreatorDashboard,
        closeCreatorDashboard,
        isWalletModalOpen,
        walletInitialTab,
        openWallet,
        closeWallet,
        matchInitialTab,
        openMatch,
        toasts,
        showToast,
        removeToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
