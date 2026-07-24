import React, { useState, useEffect } from 'react';
import { Bell, Sparkles, MessageSquare, AlertTriangle, Heart, Shield, RefreshCw } from 'lucide-react';
import { NotificationItem } from '../types';
import { api, ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const NotificationsScreen: React.FC = () => {
  const { currentUser, showToast, fetchNotificationsCount } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const res = await api.getNotifications(currentUser.id);
      setNotifications(res.notifications || []);
      await fetchNotificationsCount();
    } catch (err: any) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error', err.code);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [currentUser]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'friendship':
        return <Sparkles className="w-5 h-5 text-emerald-600" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-indigo-600" />;
      case 'restriction':
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      case 'like':
        return <Heart className="w-5 h-5 text-rose-600" />;
      default:
        return <Bell className="w-5 h-5 text-sky-600" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 text-slate-900 flex items-center justify-between shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2 text-slate-900">
            Pusat Notifikasi System
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              S-17
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pemberitahuan pencapaian Progressive Trust, pesan baru, dan status akun.
          </p>
        </div>
        <button
          onClick={loadNotifications}
          className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
          <span>Memuat notifikasi...</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-16 text-center bg-white border border-slate-200 rounded-3xl p-8">
          <Bell className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="font-bold text-slate-900 text-sm">Tidak ada notifikasi baru</h3>
          <p className="text-xs text-slate-500 mt-1">
            Anda akan diberi tahu jika ambang pertemanan 800 karakter tercapai.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-3xl border transition flex items-start gap-4 ${
                notif.is_read
                  ? 'bg-slate-50 border-slate-200 text-slate-700'
                  : 'bg-indigo-50/50 border-indigo-200 text-slate-900 shadow-xs'
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shrink-0 border border-slate-200 shadow-xs">
                {getIcon(notif.type)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                  <span>{notif.title}</span>
                  <span className="text-[10px] font-mono text-slate-400 font-normal">
                    {new Date(notif.created_at).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{notif.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
