import React, { useState, useEffect } from 'react';
import { User } from '../../types.js';
import { api } from '../../services/api.js';
import { useApp } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { X, Users, Search } from 'lucide-react';
import { motion } from 'motion/react';

interface FollowListModalProps {
  userId: string;
  type: 'followers' | 'following';
  isOpen: boolean;
  onClose: () => void;
}

export const FollowListModal: React.FC<FollowListModalProps> = ({
  userId,
  type,
  isOpen,
  onClose
}) => {
  const { openUserProfile, showToast } = useApp();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen && userId) {
      loadList();
    }
  }, [isOpen, userId, type]);

  const loadList = async () => {
    setIsLoading(true);
    try {
      if (type === 'followers') {
        const res = await api.getFollowers(userId);
        setUsers(res.followers || []);
      } else {
        const res = await api.getFollowing(userId);
        setUsers(res.following || []);
      }
    } catch (err) {
      console.error('Failed to load user list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const filtered = users.filter(
    u =>
      u.full_name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div onClick={onClose} className="absolute inset-0" />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative z-10 w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 max-h-[80vh] flex flex-col"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-700" />
            <h3 className="font-bold text-slate-900 text-base">
              {type === 'followers' ? 'Pengikut (Followers)' : 'Mengikuti (Following)'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search filter inside modal */}
        <div className="relative mb-3">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
            placeholder="Cari dalam daftar..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-slate-900"
          />
        </div>

        {/* Users list */}
        <div className="flex-1 overflow-y-auto space-y-2.5 min-h-[200px]">
          {isLoading ? (
            <div className="space-y-2 py-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-1">
                    <div className="w-24 h-3 bg-slate-200 rounded" />
                    <div className="w-16 h-2.5 bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 text-xs">
              <p className="font-medium text-slate-600">
                {type === 'followers' ? 'Belum ada pengikut.' : 'Belum mengikuti siapapun.'}
              </p>
            </div>
          ) : (
            filtered.map(u => (
              <div
                key={u.id}
                onClick={() => {
                  onClose();
                  openUserProfile(u.id);
                }}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={u.avatar_url}
                    alt={u.username}
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-slate-900 block truncate">
                      {u.full_name}
                    </span>
                    <span className="text-[11px] text-slate-400">@{u.username}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};
