import React from 'react';
import { useApp } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Home, Compass, Plus, Bell, User as UserIcon } from 'lucide-react';

interface BottomNavProps {
  onOpenAuth?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenAuth }) => {
  const { activeTab, setActiveTab, setIsCreateModalOpen, unreadNotifsCount } = useApp();
  const { user, isAuthenticated } = useAuth();

  const handleCreateClick = () => {
    if (!isAuthenticated && onOpenAuth) {
      onOpenAuth();
      return;
    }
    setIsCreateModalOpen(true);
  };

  return (
    <nav className="sticky bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] pb-safe mt-auto">
      <div className="flex items-center justify-around px-3 py-1.5">
        {/* Feed / Home */}
        <button
          id="nav-home-btn"
          onClick={() => setActiveTab('feed')}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 transition-all ${
            activeTab === 'feed' ? 'text-indigo-600 font-semibold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Home className={`w-5 h-5 transition-transform ${activeTab === 'feed' ? 'scale-110 stroke-[2.5px]' : 'stroke-[2px]'}`} />
          <span className="text-[10px] mt-1 tracking-tight">Feed</span>
        </button>

        {/* Explore */}
        <button
          id="nav-explore-btn"
          onClick={() => setActiveTab('explore')}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 transition-all ${
            activeTab === 'explore' ? 'text-indigo-600 font-semibold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Compass className={`w-5 h-5 transition-transform ${activeTab === 'explore' ? 'scale-110 stroke-[2.5px]' : 'stroke-[2px]'}`} />
          <span className="text-[10px] mt-1 tracking-tight">Explore</span>
        </button>

        {/* Create Button (Professional Polish Elevated Indigo Circle) */}
        <div className="flex-1 flex justify-center items-center">
          <button
            id="nav-create-btn"
            onClick={handleCreateClick}
            aria-label="Buat Postingan Baru"
            className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 border-4 border-white -translate-y-3 transition-all group"
          >
            <Plus className="w-6 h-6 stroke-[2.5px] group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>

        {/* Notifications */}
        <button
          id="nav-notifications-btn"
          onClick={() => setActiveTab('notifications')}
          className={`relative flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 transition-all ${
            activeTab === 'notifications' ? 'text-indigo-600 font-semibold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className="relative">
            <Bell className={`w-5 h-5 transition-transform ${activeTab === 'notifications' ? 'scale-110 stroke-[2.5px]' : 'stroke-[2px]'}`} />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 px-0.5 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-bold text-white ring-2 ring-white">
                {unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Notifikasi</span>
        </button>

        {/* Profile */}
        <button
          id="nav-profile-btn"
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 transition-all ${
            activeTab === 'profile' ? 'text-indigo-600 font-semibold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {user?.avatar_url ? (
            <div className={`w-5 h-5 rounded-full overflow-hidden ring-2 transition-all ${
              activeTab === 'profile' ? 'ring-indigo-600 scale-105' : 'ring-transparent opacity-80'
            }`}>
              <img
                src={user.avatar_url}
                alt={user.username}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <UserIcon className={`w-5 h-5 transition-transform ${activeTab === 'profile' ? 'scale-110 stroke-[2.5px]' : 'stroke-[2px]'}`} />
          )}
          <span className="text-[10px] mt-1 tracking-tight">Profil</span>
        </button>
      </div>
    </nav>
  );
};
