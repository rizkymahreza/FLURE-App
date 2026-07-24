import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Lock, ShieldCheck, RefreshCw } from 'lucide-react';
import { AuditLog } from '../types';
import { api, ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const AdminAuditLogScreen: React.FC = () => {
  const { currentUser, showToast } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const res = await api.getAdminAuditLogs(currentUser.id);
      setLogs(res.logs || []);
    } catch (err: any) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error', err.code);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentUser]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 text-slate-900 flex items-center justify-between shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2 text-slate-900">
            Jejak Audit Log Sistem (Append-Only)
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              S-23
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Catatan permanen akuntabilitas admin & moderator. Terenkripsi, append-only, tanpa opsi hapus/edit (PRD Bagian 9).
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
          <span>Memuat catatan audit log...</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="py-16 text-center bg-white border border-slate-200 rounded-3xl p-8">
          <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="font-bold text-slate-900 text-sm">Belum ada catatan audit</h3>
          <p className="text-xs text-slate-500 mt-1">
            Setiap tindakan moderasi dan pemblokiran akan otomatis dicatat di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-4 rounded-3xl bg-white border border-slate-200 space-y-2 text-xs shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                    {log.action}
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">ID: {log.id}</span>
                </div>
                <span className="text-slate-400 font-mono text-[10px]">
                  {new Date(log.created_at).toLocaleString('id-ID')}
                </span>
              </div>

              <div className="text-slate-900 font-semibold">
                Pelaku (Actor): <span className="text-indigo-700 font-bold">{log.actor_email || log.actor_id}</span>
              </div>

              {log.target_id && (
                <div className="text-slate-500">Target ID: <span className="font-mono text-slate-700">{log.target_id}</span></div>
              )}

              {log.reason && (
                <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 italic">
                  Alasan: "{log.reason}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
