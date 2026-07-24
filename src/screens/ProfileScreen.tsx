import React, { useState, useEffect } from 'react';
import { User as UserIcon, Shield, Lock, Eye, Flag, UserX, MessageSquare, RefreshCw } from 'lucide-react';
import { User } from '../types';
import { api, ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ReportModal } from '../components/ReportModal';

interface ProfileScreenProps {
  targetUserId?: string;
  onStartChat?: (convId: string) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ targetUserId, onStartChat }) => {
  const { currentUser, showToast, refreshProfile } = useAuth();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isFriended, setIsFriended] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Bio state for self profile
  const [bioText, setBioText] = useState('');
  const [isSavingBio, setIsSavingBio] = useState(false);

  // Modal
  const [showReportModal, setShowReportModal] = useState(false);

  const isSelf = !targetUserId || targetUserId === currentUser?.id;
  const activeUserId = isSelf ? currentUser?.id : targetUserId;

  const fetchProfile = async () => {
    if (!currentUser || !activeUserId) return;
    setIsLoading(true);
    try {
      const res = await api.getUserProfile(currentUser.id, activeUserId);
      setProfileUser(res.user);
      setIsFriended(res.user.is_friended || false);
      setBioText(res.user.bio || '');
    } catch (err: any) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error', err.code);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [activeUserId, currentUser]);

  const handleSaveBio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSavingBio(true);
    try {
      const res = await api.updateProfile(currentUser.id, { bio: bioText });
      setProfileUser(res.user);
      await refreshProfile();
      showToast('Bio profil berhasil diperbarui.', 'success');
    } catch (err: any) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error', err.code);
      }
    } finally {
      setIsSavingBio(false);
    }
  };

  const handleStartDM = async () => {
    if (!currentUser || !profileUser) return;
    try {
      const res = await api.startConversation(currentUser.id, profileUser.id);
      if (onStartChat) onStartChat(res.conversation.id);
    } catch (err: any) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error', err.code);
      }
    }
  };

  if (isLoading || !profileUser) {
    return (
      <div className="py-24 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
        <span>Memuat profil pengguna...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Banner Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs relative overflow-hidden space-y-6">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-slate-100 via-indigo-50 to-slate-100"></div>

        <div className="relative pt-8 flex flex-col sm:flex-row items-center sm:items-end gap-5">
          {profileUser.avatar_url ? (
            <img
              src={profileUser.avatar_url}
              alt=""
              className="w-24 h-24 rounded-3xl object-cover ring-4 ring-white shadow-md"
            />
          ) : (
            <div className="w-24 h-24 rounded-3xl bg-slate-900 text-white font-bold flex items-center justify-center text-3xl ring-4 ring-white shadow-md">
              {profileUser.email[0].toUpperCase()}
            </div>
          )}

          <div className="flex-1 text-center sm:text-left space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center justify-center sm:justify-start gap-2">
              {profileUser.email.split('@')[0]}
              {profileUser.role === 'admin' && (
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-mono border border-indigo-200 font-bold">
                  ADMIN
                </span>
              )}
            </h2>
            <div className="text-xs text-slate-500">{profileUser.email}</div>
            <div className="text-[11px] text-slate-400 font-mono">
              Terdaftar sejak: {new Date(profileUser.created_at).toLocaleDateString('id-ID')}
            </div>
          </div>

          {!isSelf && (
            <div className="flex gap-2">
              <button
                onClick={handleStartDM}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition"
              >
                <MessageSquare className="w-4 h-4" /> Kirim DM
              </button>
              <button
                onClick={() => setShowReportModal(true)}
                className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-rose-600 transition"
                title="Laporkan Pengguna"
              >
                <Flag className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t border-slate-200">
          {/* Progressive Trust Gender Field */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold flex items-center justify-between">
              <span>Jenis Kelamin (Identity)</span>
              {isFriended || isSelf ? (
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-amber-500" />
              )}
            </div>
            <div className="text-sm font-bold text-slate-900 capitalize">
              {profileUser.gender === ('tersembunyi' as any) ? (
                <span className="text-amber-600 font-mono text-xs flex items-center gap-1 font-semibold">
                  <Lock className="w-3.5 h-3.5" /> Tersembunyi hingga Berteman (&gt;800 Chars)
                </span>
              ) : (
                profileUser.gender
              )}
            </div>
          </div>

          {/* Account Status Field */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold">
              Status Akun System
            </div>
            <div className="text-sm font-bold text-emerald-600 capitalize flex items-center gap-1.5">
              <Shield className="w-4 h-4" /> {profileUser.account_status}
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Bio & Deskripsi Diri</h3>
          {isSelf ? (
            <form onSubmit={handleSaveBio} className="space-y-3">
              <textarea
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                rows={3}
                maxLength={300}
                placeholder="Tulis bio singkat..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
              />
              <button
                type="submit"
                disabled={isSavingBio}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
              >
                {isSavingBio ? 'Menyimpan...' : 'Simpan Bio'}
              </button>
            </form>
          ) : (
            <p className="text-xs text-slate-700 italic bg-slate-50 p-4 rounded-2xl border border-slate-200">
              "{profileUser.bio || 'Pengguna belum menulis bio.'}"
            </p>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && !isSelf && (
        <ReportModal
          targetType="user"
          targetId={profileUser.id}
          targetPreview={`Profil Pengguna: ${profileUser.email}`}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};
