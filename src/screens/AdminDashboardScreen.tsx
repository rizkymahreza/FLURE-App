import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  Users,
  FileSpreadsheet,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  ShieldCheck,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { AdminDashboardSummary, Report, AuditLog, User, AccountStatus } from '../types';
import { api, ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface AdminDashboardScreenProps {
  onNavigateTab: (tab: 'dashboard' | 'reports' | 'users' | 'audit') => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ onNavigateTab }) => {
  const { currentUser, showToast } = useAuth();
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSummary = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const res = await api.getAdminSummary(currentUser.id);
      setSummary(res);
    } catch (err: any) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error', err.code);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [currentUser]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 text-slate-900 flex items-center justify-between shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2 text-slate-900">
            Panel Administrasi & Moderasi FLURE
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
              S-19
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengawasan kesehatan platform, antrian laporan moderasi, dan log audit append-only.
          </p>
        </div>
        <button
          onClick={fetchSummary}
          className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-violet-600' : ''}`} />
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          onClick={() => onNavigateTab('reports')}
          className="p-4 rounded-3xl bg-white border border-rose-200 hover:border-rose-400 shadow-xs cursor-pointer transition space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-semibold text-rose-700">
              Laporan Open
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform border border-rose-200">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{summary?.open_reports ?? 0}</div>
          <p className="text-[10px] text-slate-500 font-medium">Menunggu tinjauan moderator →</p>
        </div>

        <div
          onClick={() => onNavigateTab('users')}
          className="p-4 rounded-3xl bg-white border border-amber-200 hover:border-amber-400 shadow-xs cursor-pointer transition space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-semibold text-amber-700">
              Akun Dibatasi (24h)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform border border-amber-200">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{summary?.restricted_accounts_24h ?? 0}</div>
          <p className="text-[10px] text-slate-500 font-medium">Pelanggaran rate limit spam →</p>
        </div>

        <div
          onClick={() => onNavigateTab('users')}
          className="p-4 rounded-3xl bg-white border border-indigo-200 hover:border-indigo-400 shadow-xs cursor-pointer transition space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-semibold text-indigo-700">
              Pengguna Aktif
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform border border-indigo-200">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{summary?.total_users ?? 0}</div>
          <p className="text-[10px] text-slate-500 font-medium">Total terdaftar & terverifikasi →</p>
        </div>

        <div
          onClick={() => onNavigateTab('audit')}
          className="p-4 rounded-3xl bg-white border border-emerald-200 hover:border-emerald-400 shadow-xs cursor-pointer transition space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-semibold text-emerald-700">
              Jejak Audit Log
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform border border-emerald-200">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">APPEND-ONLY</div>
          <p className="text-[10px] text-slate-500 font-medium">Catatan akuntabilitas admin →</p>
        </div>
      </div>

      {/* Quick Navigation Tabs */}
      <div className="grid gap-3 sm:grid-cols-3">
        <button
          onClick={() => onNavigateTab('reports')}
          className="p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-left space-y-1 transition shadow-xs"
        >
          <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-violet-600" />
            <span>S-20 Antrian Moderasi Laporan</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Tinjau laporan masuk (Urutan: Pelecehan &gt; Spam &gt; FIFO).
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('users')}
          className="p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-left space-y-1 transition shadow-xs"
        >
          <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>S-22 Manajemen Status Pengguna</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Atur status akun (Active, Restricted, Banned).
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('audit')}
          className="p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-left space-y-1 transition shadow-xs"
        >
          <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>S-23 Audit Log Sistem</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Inspeksi jejak audit terenkripsi dan append-only.
          </p>
        </button>
      </div>
    </div>
  );
};
