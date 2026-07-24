import React, { useState, useEffect } from 'react';
import { UserX, ShieldAlert, RefreshCw } from 'lucide-react';
import { api, ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const BlockedUsersScreen: React.FC = () => {
  const { currentUser, showToast } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBlocked = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const res = await api.getBlockedUsers(currentUser.id);
      setBlockedUsers(res.blocked_users || []);
    } catch (err: any) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error', err.code);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocked();
  }, [currentUser]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 text-slate-900 flex items-center justify-between shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2 text-slate-900">
            Daftar Pengguna Diblokir
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              S-16
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengguna di bawah disembunyikan secara searah dan permanen dari pencarian, feed, dan DM Anda.
          </p>
        </div>
        <button
          onClick={fetchBlocked}
          className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-rose-600' : ''}`} />
        </button>
      </div>

      {/* Mandatory Notice */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-slate-700 flex items-start gap-3 shadow-xs">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-amber-900 font-semibold">Aturan Keamanan PRD Prinsip #3 (Final by Design):</strong>
          <p className="text-slate-600 text-[11px] mt-1">
            Pemblokiran di FLURE tidak menyediakan tombol "Buka Blokir" di mana pun pada antarmuka pengguna maupun endpoint API resmi. Hal ini dirancang secara sengaja untuk melindungi privasi dan kenyamanan pengguna.
          </p>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-rose-600" />
          <span>Memuat daftar blokir...</span>
        </div>
      ) : blockedUsers.length === 0 ? (
        <div className="py-16 text-center bg-white border border-slate-200 rounded-3xl p-8">
          <UserX className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="font-bold text-slate-900 text-sm">Anda belum memblokir siapa pun</h3>
          <p className="text-xs text-slate-500 mt-1">
            Seluruh interaksi Anda dalam keadaan aman dan lancar.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {blockedUsers.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-xs shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 font-bold flex items-center justify-center text-sm border border-rose-200">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">
                    {item.blocked_user?.email || item.blocked_id}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Diblokir pada: {new Date(item.created_at).toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                BLOKIR PERMANEN
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
