import React from 'react';
import { useApp } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Search, Bell, MessageSquare, ShieldCheck, Sparkles, LogIn, Wallet, Heart } from 'lucide-react';

interface HeaderProps {
  onOpenAuth?: (mode: 'login' | 'register') => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuth }) => {
  const { activeTab, setActiveTab, unreadNotifsCount, unreadMessagesCount, openWallet, openMatch } = useApp();
  const { user, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 transition-all">
      <div className="flex items-center justify-between">
        {/* Brand Logo with Professional Polish typography */}
        <div 
          onClick={() => setActiveTab('feed')}
          className="flex items-center gap-1.5 cursor-pointer select-none group"
        >
          <span className="text-xl font-bold tracking-tighter text-[#1A1A1A] group-hover:opacity-90 transition-opacity font-sans">
            NEXA<span className="text-indigo-600">.</span>
          </span>
          <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold px-1.5 py-0.5 rounded bg-gray-50 border border-gray-100 hidden sm:inline-block">
            Phase 1
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Admin shortcut if role is admin */}
          {user?.role === 'admin' && (
            <button
              id="header-admin-btn"
              onClick={() => setActiveTab('profile')}
              title="Admin Badge"
              className="px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1 transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[11px]">Admin</span>
            </button>
          )}

          {/* Quick NEXA MATCH Button */}
          <button
            id="header-match-btn"
            onClick={() => openMatch('discover')}
            title="NEXA MATCH (Cari Jodoh 18+)"
            className={`p-2 rounded-xl transition-all relative ${
              activeTab === 'match'
                ? 'bg-rose-50 text-rose-600 font-bold ring-1 ring-rose-200 shadow-sm'
                : 'text-gray-600 hover:bg-rose-50/60 hover:text-rose-600'
            }`}
          >
            <Heart className="w-5 h-5 stroke-[2px] fill-rose-500/10" />
            <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded-full bg-rose-500 text-[8px] font-extrabold text-white">
              18+
            </span>
          </button>

          {/* Quick Wallet Button (if authenticated) */}
          {isAuthenticated && (
            <button
              id="header-wallet-btn"
              onClick={() => openWallet('overview')}
              title="Dompet NEXA"
              className={`p-2 rounded-xl transition-colors ${
                activeTab === 'wallet'
                  ? 'bg-indigo-50 text-indigo-600 font-bold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Wallet className="w-5 h-5 stroke-[2px]" />
            </button>
          )}

          {/* Search Button */}
          <button
            id="header-search-btn"
            onClick={() => setActiveTab('explore')}
            title="Cari"
            className={`p-2 rounded-xl transition-colors ${
              activeTab === 'explore'
                ? 'bg-gray-100 text-indigo-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Search className="w-5 h-5 stroke-[2px]" />
          </button>

          {/* Notification Button */}
          <button
            id="header-notif-btn"
            onClick={() => setActiveTab('notifications')}
            title="Notifikasi"
            className={`relative p-2 rounded-xl transition-colors ${
              activeTab === 'notifications'
                ? 'bg-gray-100 text-indigo-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Bell className="w-5 h-5 stroke-[2px]" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                {unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}
              </span>
            )}
          </button>

          {/* Direct Messages Button */}
          <button
            id="header-messages-btn"
            onClick={() => setActiveTab('chat')}
            title="Pesan Langsung"
            className={`relative p-2 rounded-xl transition-colors ${
              activeTab === 'chat'
                ? 'bg-gray-100 text-indigo-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <MessageSquare className="w-5 h-5 stroke-[2px]" />
            {unreadMessagesCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
              </span>
            )}
          </button>

          {/* Login prompt if guest */}
          {!isAuthenticated && onOpenAuth && (
            <button
              onClick={() => onOpenAuth('login')}
              className="ml-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
