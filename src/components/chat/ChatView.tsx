import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, User } from '../../types.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { 
  MessageSquare, 
  Send, 
  ArrowLeft, 
  Search, 
  Sparkles, 
  Check, 
  CheckCheck, 
  Phone, 
  Video as VideoIcon, 
  MoreVertical,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';

interface ChatViewProps {
  initialUserId?: string | null;
}

export const ChatView: React.FC<ChatViewProps> = ({ initialUserId }) => {
  const { user: currentUser } = useAuth();
  const { showToast, openUserProfile } = useApp();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(initialUserId || null);
  const [activePartner, setActivePartner] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (initialUserId) {
      setActivePartnerId(initialUserId);
      loadPartnerInfo(initialUserId);
      loadMessages(initialUserId);
    }
  }, [initialUserId]);

  useEffect(() => {
    if (activePartnerId) {
      loadPartnerInfo(activePartnerId);
      loadMessages(activePartnerId);
      const interval = setInterval(() => {
        loadMessages(activePartnerId, true);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activePartnerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const res = await api.getConversations();
      setConversations(res.conversations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPartnerInfo = async (partnerId: string) => {
    try {
      const res = await api.getUserProfile(partnerId);
      setActivePartner(res.user);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMessages = async (partnerId: string, silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await api.getMessages(partnerId);
      setMessages(res.messages || []);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activePartnerId || isSending) return;

    const content = messageText.trim();
    setMessageText('');
    setIsSending(true);

    // Optimistic message
    const tempMsg: Message = {
      id: 'temp-' + Date.now(),
      conversation_id: 'active',
      sender_id: currentUser!.id,
      content,
      is_read: false,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await api.sendMessage(activePartnerId, content);
      setMessages(prev => prev.map(m => (m.id === tempMsg.id ? res.message : m)));
      loadConversations();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengirim pesan.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenNewChat = async () => {
    try {
      const res = await api.getExplore();
      setAvailableUsers(res.creators || []);
      setIsNewChatModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  // If in active chat thread view
  if (activePartnerId && activePartner) {
    return (
      <div className="flex flex-col h-[calc(100vh-130px)] bg-white rounded-3xl border border-slate-100 shadow-2xs overflow-hidden mt-1 mb-20">
        {/* Chat Thread Header */}
        <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActivePartnerId(null)}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div 
              onClick={() => openUserProfile(activePartner.id)}
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <img
                src={activePartner.avatar_url}
                alt={activePartner.username}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100"
              />
              <div>
                <span className="font-bold text-xs sm:text-sm text-slate-900 block truncate">
                  {activePartner.full_name}
                </span>
                <span className="text-[10px] text-emerald-600 font-medium">● Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc]/50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
              <MessageSquare className="w-10 h-10 stroke-[1.5px] mb-2 text-slate-300" />
              <p className="text-xs font-semibold text-slate-700">Mulai Percakapan</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Kirim salam kepada {activePartner.full_name}</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMine = msg.sender_id === currentUser?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs break-words ${
                      isMine
                        ? 'bg-slate-900 text-white rounded-br-xs'
                        : 'bg-white text-slate-800 border border-slate-100 rounded-bl-xs'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-600 px-1">
                    <span>{formatTime(msg.created_at)}</span>
                    {isMine && (
                      <CheckCheck className="w-3 h-3 text-indigo-500" />
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input message form */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            value={messageText}
            onChange={e => setMessageText(e.target.value)}
            placeholder={`Ketik pesan untuk @${activePartner.username}...`}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
          />
          <button
            type="submit"
            disabled={!messageText.trim() || isSending}
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white disabled:opacity-40 transition-all shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    );
  }

  // Conversation list view
  const filteredConversations = conversations.filter(c =>
    c.partner?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.partner?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pb-24 pt-2">
      {/* Header & New Chat button */}
      <div className="flex items-center justify-between px-2 mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-slate-800" />
          <h2 className="font-extrabold text-base text-slate-900">Pesan Masuk (Chat)</h2>
        </div>
        <button
          onClick={handleOpenNewChat}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1 shadow-xs transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Pesan Baru</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mb-3 px-1">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Cari obrolan..."
          className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 shadow-2xs"
        />
      </div>

      {/* Conversations List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 flex gap-3 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="w-32 h-3.5 bg-slate-200 rounded" />
                <div className="w-48 h-3 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center shadow-xs flex flex-col items-center my-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mb-3">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">Belum Ada Percakapan</h3>
          <p className="text-xs text-slate-500 max-w-xs mb-4">
            Terhubung langsung dengan kreator atau brand untuk berkolaborasi dan bertukar cerita.
          </p>
          <button
            onClick={handleOpenNewChat}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
          >
            Mulai Kirim Pesan
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredConversations.map(conv => (
            <div
              key={conv.partner.id}
              onClick={() => setActivePartnerId(conv.partner.id)}
              className="p-3.5 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <img
                  src={conv.partner.avatar_url}
                  alt={conv.partner.username}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-50 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {conv.partner.full_name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatTime(conv.last_message.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {conv.last_message.sender_id === currentUser?.id ? 'Anda: ' : ''}
                    {conv.last_message.content}
                  </p>
                </div>
              </div>

              {conv.unread_count > 0 && (
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-xs">
                  {conv.unread_count}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Chat Modal */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div onClick={() => setIsNewChatModalOpen(false)} className="absolute inset-0" />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-10 w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 max-h-[80vh] flex flex-col"
          >
            <h3 className="font-bold text-slate-900 text-base mb-3">Pilih Pengguna untuk Chat</h3>
            <div className="flex-1 overflow-y-auto space-y-2 max-h-60">
              {availableUsers.map(u => (
                <div
                  key={u.id}
                  onClick={() => {
                    setIsNewChatModalOpen(false);
                    setActivePartnerId(u.id);
                  }}
                  className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <img src={u.avatar_url} alt={u.username} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">{u.full_name}</span>
                    <span className="text-[11px] text-slate-400">@{u.username}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
