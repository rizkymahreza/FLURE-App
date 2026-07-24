import React, { useState } from 'react';
import { Shield, Bell, User as UserIcon, LogOut, ChevronDown, Sparkles, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { currentUser, allDemoUsers, switchUser, logout, activeScreen, setActiveScreen, unreadNotifsCount } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 text-slate-900 px-4 lg:px-8 py-3 flex items-center justify-between shadow-xs">
      {/* Brand Logo & Tagline */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveScreen('feed')}
          className="flex items-center gap-2.5 group focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="font-black text-xl tracking-tight text-slate-900">
              FLURE
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
              Progressive Trust
            </span>
          </div>
        </button>
      </div>

      {/* Center QA Quick Switcher Notice */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700">
        <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
        <span className="font-medium">QA Switch:</span>
        <div className="flex items-center gap-1 ml-1">
          {allDemoUsers.map((user) => {
            const isSelected = currentUser?.id === user.id;
            const shortName = user.email.split('@')[0];
            return (
              <button
                key={user.id}
                onClick={() => switchUser(user.id)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                  isSelected
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
                title={`${user.email} (${user.role})`}
              >
                {shortName} {user.role === 'admin' ? '🛡️' : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {currentUser ? (
          <>
            {/* Notifications Button */}
            <button
              onClick={() => setActiveScreen('notifications')}
              className={`relative p-2.5 rounded-xl border transition ${
                activeScreen === 'notifications'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700 hover:text-slate-900'
              }`}
              title="Notifikasi"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
              >
                {currentUser.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.email}
                    className="w-8 h-8 rounded-lg object-cover ring-2 ring-slate-300"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                    {currentUser.email[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:block text-left pr-1">
                  <div className="text-xs font-semibold text-slate-900 flex items-center gap-1">
                    {currentUser.email.split('@')[0]}
                    {currentUser.role === 'admin' && (
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1 rounded font-mono font-bold">ADMIN</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 capitalize">
                    {currentUser.account_status === 'active' ? '● Aktif' : currentUser.account_status}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>

              {/* User Menu Dropdown */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 text-xs">
                  <div className="p-2 border-b border-slate-100 mb-1">
                    <div className="font-semibold text-slate-900">{currentUser.email}</div>
                    <div className="text-slate-500 mt-0.5 text-[11px]">
                      Role: <span className="text-indigo-600 capitalize font-medium">{currentUser.role}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveScreen('profile_me');
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-800 transition"
                  >
                    <UserIcon className="w-4 h-4 text-indigo-600" />
                    Profil Saya
                  </button>

                  <div className="my-1 border-t border-slate-100"></div>

                  <div className="px-3 py-1.5 text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold">
                    Ganti Akun Demo (QA)
                  </div>

                  {allDemoUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchUser(u.id);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-xl text-xs transition ${
                        u.id === currentUser.id
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>{u.email}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">{u.role}</span>
                    </button>
                  ))}

                  <div className="my-1 border-t border-slate-100"></div>

                  <button
                    onClick={() => {
                      logout();
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Keluar Sesi
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveScreen('login')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition"
            >
              Masuk
            </button>
            <button
              onClick={() => setActiveScreen('register')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition"
            >
              Daftar FLURE
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
