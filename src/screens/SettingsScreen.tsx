import React from 'react';
import { Lock, Shield, Eye, Bell, Smartphone, UserX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SettingsScreen: React.FC = () => {
  const { currentUser, setActiveScreen } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 text-slate-900 shadow-xs">
        <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2 text-slate-900">
          Pengaturan Umum & Privasi
          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            S-14 & S-15
          </span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Kelola privasi akun, verifikasi umur, dan keamanan Progressive Trust.
        </p>
      </div>

      <div className="space-y-4">
        {/* Privacy Section (S-15) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-3 text-slate-900 font-bold text-sm border-b border-slate-200 pb-3">
            <Lock className="w-4 h-4 text-indigo-600" /> Pengaturan Privasi (S-15)
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <div className="font-semibold text-slate-900">Sembunyikan Jenis Kelamin dari Publik</div>
                <div className="text-[11px] text-slate-500">
                  Jenis kelamin hanya terbuka setelah status berteman (&gt;800 karakter).
                </div>
              </div>
              <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                AKTIF (WAJIB)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <div className="font-semibold text-slate-900">Kamera Langsung & Watermarking</div>
                <div className="text-[11px] text-slate-500">
                  Foto hanya dapat dipotret langsung dari kamera dengan stempel watermark permanen.
                </div>
              </div>
              <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                AKTIF (WAJIB)
              </span>
            </div>

            <button
              onClick={() => setActiveScreen('blocked_users')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 font-medium transition"
            >
              <div className="flex items-center gap-2">
                <UserX className="w-4 h-4 text-rose-600" />
                <span>Kelola Daftar Pengguna Diblokir (S-16)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Buka →</span>
            </button>
          </div>
        </div>

        {/* General Settings Section (S-14) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-3 text-slate-900 font-bold text-sm border-b border-slate-200 pb-3">
            <Shield className="w-4 h-4 text-indigo-600" /> Informasi Akun & Keamanan (S-14)
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-slate-500">Email Sesi Aktif</div>
                <div className="font-bold text-slate-900">{currentUser?.email}</div>
              </div>
              <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded uppercase">
                {currentUser?.role}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-slate-500">Verifikasi Usia (18+)</div>
                <div className="font-bold text-slate-900">
                  Tanggal Lahir: {currentUser?.birth_date} (Terverifikasi &gt;= 18 Tahun)
                </div>
              </div>
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                LOLIS AGE GATE
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
