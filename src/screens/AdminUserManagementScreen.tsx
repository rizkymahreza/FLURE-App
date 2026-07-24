import React, { useState, useEffect } from 'react';
import { Users, Shield, AlertTriangle, CheckCircle, RefreshCw, Send, X } from 'lucide-react';
import { User, AccountStatus } from '../types';
import { api, ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const AdminUserManagementScreen: React.FC = () => {
  const { currentUser, showToast, allDemoUsers } = useAuth();
  const [usersList, setUsersList] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newStatus, setNewStatus] = useState<AccountStatus>('active');
  const [statusReason, setStatusReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const res = await api.searchUsers(currentUser.id, '');
      setUsersList(res.users || allDemoUsers);
    } catch (err: any) {
      setUsersList(allDemoUsers);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentUser]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedUser || !statusReason.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.updateAdminUserStatus(
        currentUser.id,
        selectedUser.id,
        newStatus,
        statusReason.trim(),
      );

      showToast(`Status pengguna ${res.user.email} berhasil diubah ke ${newStatus}.`, 'success');
      setUsersList(usersList.map((u) => (u.id === res.user.id ? res.user : u)));
      setSelectedUser(null);
      setStatusReason('');
    } catch (err: any) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error', err.code);
      } else {
        showToast('Gagal mengubah status pengguna.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 text-slate-900 flex items-center justify-between shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2 text-slate-900">
            Manajemen Pengguna & Hak Akses
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              S-22
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola status akun (Active, Restricted 24h, Banned). Perubahan 'Banned' memicu logout paksa seluruh sesi aktif.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
          <span>Memuat daftar pengguna...</span>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {usersList.map((user) => (
            <div
              key={user.id}
              className="p-4 rounded-3xl bg-white border border-slate-200 hover:border-slate-300 transition flex items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-center gap-3">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-2xl object-cover ring-2 ring-slate-200" />
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white font-bold flex items-center justify-center text-sm">
                    {user.email[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1">
                    {user.email}
                    {user.role === 'admin' && (
                      <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1 rounded font-mono font-bold">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 capitalize">
                    Status: <strong className={user.account_status === 'active' ? 'text-emerald-600' : 'text-rose-600'}>{user.account_status}</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedUser(user);
                  setNewStatus(user.account_status);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                Ubah Status
              </button>
            </div>
          ))}
        </div>
      )}

      {/* User Status Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-slate-900 shadow-xl relative space-y-4">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Kelola Status Akun Pengguna
            </h3>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div>Email: <strong className="text-slate-900">{selectedUser.email}</strong></div>
              <div>Role: <span className="text-indigo-700 font-semibold capitalize">{selectedUser.role}</span></div>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Status Baru
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as AccountStatus)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="active">Active (Aktif Normal)</option>
                  <option value="restricted_24h">Restricted 24h (Dibatasi 24 Jam - Spam)</option>
                  <option value="suspended">Suspended (Ditangguhkan Sementara)</option>
                  <option value="banned">Banned Permanen (Forced Logout & Permanen)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Alasan Perubahan Status (Wajib untuk Audit Log)
                </label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  rows={3}
                  required
                  placeholder="Tulis alasan resmi perubahan status akun pengguna..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !statusReason.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-xs transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Memproses...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
