import React, { useState, useEffect } from 'react';
import { MessageSquare, Lock, Sparkles, UserPlus, Search, RefreshCw, Zap } from 'lucide-react';
import { Conversation, User } from '../types';
import { api, ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ChatListScreenProps {
  onSelectConversation: (convId: string) => void;
}

export const ChatListScreen: React.FC<ChatListScreenProps> = ({ onSelectConversation }) => {
  const { currentUser, showToast } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(User & { is_friended: boolean; conversation_id?: string })[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConversations = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const res = await api.getConversations(currentUser.id);
      setConversations(res.conversations || []);
    } catch (err: any) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error', err.code);
      }
    } fontally: {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [currentUser]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await api.searchUsers(currentUser.id, searchQuery.trim());
      setSearchResults(res.users || []);
    } catch (err: any) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error', err.code);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartChatWithUser = async (targetUserId: string) => {
    if (!currentUser) return;
    try {
      const res = await api.startConversation(currentUser.id, targetUserId);
      onSelectConversation(res.conversation.id);
    } catch (err: any) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error', err.code);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 text-slate-900 flex items-center justify-between shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2 text-slate-900">
            Percakapan DM & Progressive Trust
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              S-08
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Akumulasi 800 karakter percakapan membuka status Berteman, Kamera Foto Langsung & Voice Note.
          </p>
        </div>
        <button
          onClick={fetchConversations}
          className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
          title="Muat ulang daftar percakapan"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
        </button>
      </div>

      {/* Search / Discover User Form */}
      <form onSubmit={handleSearch} className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pengguna berdasarkan email..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching || !searchQuery.trim()}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition disabled:opacity-50 shadow-xs"
        >
          {isSearching ? 'Mencari...' : 'Cari'}
        </button>
      </form>

      {/* Search Results if any */}
      {searchResults.length > 0 && (
        <div className="bg-white border border-indigo-200 rounded-3xl p-4 space-y-2 shadow-xs">
          <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider px-2">
            Hasil Pencarian Pengguna ({searchResults.length})
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-200" />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                      {user.email[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-slate-900">{user.email}</div>
                    <div className="text-[10px] text-slate-500">
                      Jenis Kelamin: <span className="text-indigo-700 font-semibold capitalize">{user.gender}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleStartChatWithUser(user.id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition shadow-xs"
                >
                  Mulai DM
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conversations List */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
          <span>Memuat percakapan...</span>
        </div>
      ) : conversations.length === 0 ? (
        <div className="py-16 text-center bg-white border border-slate-200 rounded-3xl p-8">
          <MessageSquare className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
          <h3 className="font-bold text-slate-900 text-sm">Belum ada percakapan</h3>
          <p className="text-xs text-slate-500 mt-1">
            Gunakan pencarian di atas untuk memulai DM dengan pengguna FLURE.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => {
            const partner = conv.partner;
            const isFriended = conv.status === 'friended';
            const progressPct = Math.min(100, Math.round((conv.cumulative_char_count / 800) * 100));

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className="bg-white border border-slate-200 hover:border-indigo-300 rounded-3xl p-4 shadow-xs cursor-pointer transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Left Partner Info */}
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  {partner?.avatar_url ? (
                    <img src={partner.avatar_url} alt="" className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-200" />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-bold flex items-center justify-center text-base">
                      {partner?.email ? partner.email[0].toUpperCase() : 'U'}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 truncate">
                        {partner?.email.split('@')[0]}
                      </span>
                      <span className="text-xs text-slate-400">({partner?.email})</span>
                      {isFriended && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> FRIENDED
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {conv.last_message ? (
                        conv.last_message.content_type === 'text' ? (
                          conv.last_message.content_ref
                        ) : conv.last_message.content_type === 'photo' ? (
                          '📷 [Foto Kamera Langsung]'
                        ) : (
                          '🎙️ [Pesan Suara]'
                        )
                      ) : (
                        'Mulai percakapan bertahap...'
                      )}
                    </p>
                  </div>
                </div>

                {/* Right Progressive Trust Status Widget */}
                <div className="w-full sm:w-56 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex flex-col gap-1.5 shrink-0">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-[11px] text-slate-700 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> Progres Trust
                    </span>
                    <span className="text-[10px] font-mono text-indigo-700 font-bold">
                      {conv.cumulative_char_count} / 800 Chars
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isFriended
                          ? 'bg-emerald-500'
                          : 'bg-indigo-600'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  <div className="text-[10px] text-slate-500 flex items-center justify-between">
                    <span>{isFriended ? 'Kamera & Voice Terbuka' : 'Status: Terkunci'}</span>
                    <span className="font-mono font-bold text-slate-700">{progressPct}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
