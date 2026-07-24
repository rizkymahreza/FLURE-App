import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Check, X, Send, AlertTriangle, RefreshCw } from 'lucide-react';
import { Report } from '../types';
import { api, ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const AdminModerationQueueScreen: React.FC = () => {
  const { currentUser, showToast } = useAuth();

  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [actionType, setActionType] = useState<'dismiss' | 'warn' | 'suspend' | 'ban'>('warn');
  const [actionReason, setActionReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchQueue = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const res = await api.getAdminReports(currentUser.id, 'open');
      setReports(res.reports || []);
    } catch (err: any) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error', err.code);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [currentUser]);

  const handleExecuteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedReport || !actionReason.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.takeAdminReportAction(
        currentUser.id,
        selectedReport.id,
        actionType,
        actionReason.trim(),
      );

      showToast(res.message || 'Tindakan moderasi dieksekusi & dicatat di Audit Log.', 'success');
      setReports(reports.filter((r) => r.id !== selectedReport.id));
      setSelectedReport(null);
      setActionReason('');
    } catch (err: any) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error', err.code);
      } else {
        showToast('Gagal memproses laporan.', 'error');
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
            Antrian Moderasi Laporan Masuk
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              S-20
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Diurutkan berdasarkan tingkat urgensi: Pelecehan &gt; Seksual/Kekerasan &gt; Spam &gt; FIFO.
          </p>
        </div>
        <button
          onClick={fetchQueue}
          className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-rose-600' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-rose-600" />
          <span>Memuat antrian laporan...</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="py-16 text-center bg-white border border-slate-200 rounded-3xl p-8">
          <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
          <h3 className="font-bold text-slate-900 text-sm">Tidak ada laporan open saat ini</h3>
          <p className="text-xs text-slate-500 mt-1">
            Seluruh laporan yang masuk telah ditangani oleh tim moderasi.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white border border-slate-200 hover:border-rose-300 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                    URGENSI: {report.reason}
                  </span>
                  <span className="text-xs font-bold text-slate-900">Target: {report.target_type}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(report.created_at).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="text-xs text-slate-600">
                  Pelapor: <strong className="text-indigo-700">{report.reporter_email}</strong>
                </div>

                {report.target_preview && (
                  <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    "{report.target_preview}"
                  </p>
                )}

                {report.description && (
                  <p className="text-xs text-slate-600">Catatan: {report.description}</p>
                )}
              </div>

              <button
                onClick={() => setSelectedReport(report)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-xs shrink-0"
              >
                Tinjau & Tindak (S-21)
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Detail Action Modal (S-21) */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 text-slate-900 shadow-xl relative space-y-4">
            <button
              onClick={() => setSelectedReport(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Tindakan Laporan Moderasi</h3>
                <p className="text-xs text-slate-500">
                  ID Laporan: <span className="font-mono text-indigo-700 font-semibold">{selectedReport.id}</span>
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div>
                Alasan: <strong className="text-rose-700 uppercase font-mono">{selectedReport.reason}</strong>
              </div>
              <div className="text-slate-700">Target: {selectedReport.target_type} ({selectedReport.target_id})</div>
              {selectedReport.target_preview && (
                <div className="text-slate-500 italic mt-1">"{selectedReport.target_preview}"</div>
              )}
            </div>

            <form onSubmit={handleExecuteAction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Pilih Tindakan Moderasi
                </label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="dismiss">Abaikan / Dismiss (Tidak ada pelanggaran)</option>
                  <option value="warn">Beri Peringatan Resmi ke Pengguna</option>
                  <option value="suspend">Restriksi Akun 24 Jam (Temporary Restriction)</option>
                  <option value="ban">Ban Permanen Akun (Banned Status)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Alasan Penindakan (Wajib Diisi untuk Audit Log)
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  rows={3}
                  required
                  placeholder="Jelaskan alasan penindakan ini yang akan disimpan permanen di audit_logs..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !actionReason.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Memproses...' : 'Eksekusi & Catat Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
