import React from 'react';
import {
  Home,
  MessageSquare,
  Bell,
  User,
  Shield,
  Lock,
  UserX,
  Settings,
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { activeScreen, setActiveScreen, currentUser, unreadNotifsCount } = useAuth();

  const isNavItemActive = (screen: string) => activeScreen === screen;

  const mainNavItems = [
    { id: 'feed', label: 'Timeline / Feed', icon: Home },
    { id: 'chat', label: 'Percakapan DM', icon: MessageSquare },
    { id: 'notifications', label: 'Notifikasi', icon: Bell, badge: unreadNotifsCount },
    { id: 'profile_me', label: 'Profil Saya', icon: User },
    { id: 'blocked_users', label: 'Pengguna Diblokir', icon: UserX },
    { id: 'settings_privacy', label: 'Pengaturan Privasi', icon: Lock },
  ];

  const adminNavItems = [
    { id: 'admin_dashboard', label: 'Dashboard Admin', icon: LayoutDashboard },
    { id: 'admin_reports', label: 'Antrian Moderasi', icon: ShieldCheck },
    { id: 'admin_users', label: 'Manajemen Pengguna', icon: Users },
    { id: 'admin_audit', label: 'Jejak Audit Log', icon: FileSpreadsheet },
  ];

  return (
    <aside className="w-full lg:w-64 bg-white border-r border-slate-200 p-4 flex flex-col gap-6 shrink-0 text-slate-700">
      {/* Primary Navigation */}
      <div>
        <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold px-3 mb-2">
          Utama
        </div>
        <nav className="flex flex-col gap-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isNavItemActive(item.id);
            return (
              <button
                key={item.id}
                onClick={() => setActiveScreen(item.id)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                  active
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'hover:bg-slate-100 hover:text-slate-900 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-600 text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Admin & Moderation Domain */}
      <div>
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-[10px] uppercase font-mono tracking-wider text-indigo-700 font-semibold flex items-center gap-1">
            <Shield className="w-3 h-3" /> Panel Moderasi & Admin
          </span>
          {currentUser?.role === 'admin' ? (
            <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono font-bold">
              ADMIN
            </span>
          ) : (
            <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
              QA Mode
            </span>
          )}
        </div>

        <nav className="flex flex-col gap-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const active = isNavItemActive(item.id);
            return (
              <button
                key={item.id}
                onClick={() => setActiveScreen(item.id)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                  active
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'hover:bg-slate-100 hover:text-slate-900 text-slate-600'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Progressive Trust Info Widget */}
      <div className="mt-auto p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
        <div className="flex items-center gap-2 text-slate-900 font-semibold mb-1">
          <Zap className="w-4 h-4 text-amber-500" />
          <span>Progressive Trust V1.0</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Semua pengguna mulai sebagai orang asing. Fitur Foto Kamera & Voice Note terbuka otomatis setelah bertukar 800+ karakter.
        </p>
      </div>
    </aside>
  );
};
