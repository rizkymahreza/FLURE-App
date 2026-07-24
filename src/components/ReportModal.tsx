import React, { useState } from 'react';
import { ShieldAlert, X, Send } from 'lucide-react';
import { ReportReason, ReportTargetType } from '../types';
import { api, ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ReportModalProps {
  targetType: ReportTargetType;
  targetId: string;
  targetPreview?: string;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ targetType, targetId, targetPreview, onClose }) => {
  const { currentUser, showToast } = useAuth();
  const [reason, setReason] = useState<ReportReason>('spam');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      const res = await api.createReport(currentUser.id, {
        target_type: targetType,
        target_id: targetId,
        reason,
        description,
        target_preview: targetPreview,
      });

      showToast(res.message || 'Laporan berhasil dikirim ke tim moderasi FLURE.', 'success');
      onClose();
    } catch (err: any) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error', err.code);
      } else {
        showToast('Gagal mengirim laporan. Silakan coba lagi.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 text-slate-900 shadow-xl relative animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900">Form Pelaporan Content / User</h3>
            <p className="text-xs text-slate-500">
              Target: <span className="text-indigo-600 uppercase font-mono font-medium">{targetType}</span>
            </p>
          </div>
        </div>

        {targetPreview && (
          <div className="mb-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 italic">
            "{targetPreview.length > 120 ? targetPreview.substring(0, 120) + '...' : targetPreview}"
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Alasan Pelaporan (Daftar Tertutup)
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="spam">Spam / Iklan Mengganggu</option>
              <option value="harassment">Pelecehan / Perundungan (Harassment)</option>
              <option value="inappropriate_content">Konten Tidak Pantas / Seksual / Kekerasan</option>
              <option value="other">Lainnya (Perlu Peninjauan Khusus)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Deskripsi Detail Tambahan (Maks 500 Karakter)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Jelaskan secara rinci konteks pelanggaran..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
            />
            <div className="text-[10px] text-right text-slate-400 mt-1">{description.length} / 500</div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-sm transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
