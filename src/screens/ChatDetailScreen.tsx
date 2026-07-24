import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Camera,
  Mic,
  Lock,
  ChevronLeft,
  ShieldCheck,
  UserX,
  Flag,
  Sparkles,
  Zap,
  Info,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { Conversation, Message, User } from '../types';
import { api, ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LiveCameraModal } from '../components/LiveCameraModal';
import { VoiceNotePlayer } from '../components/VoiceNotePlayer';
import { ReportModal } from '../components/ReportModal';

interface ChatDetailScreenProps {
  conversationId: string;
  onBack: () => void;
}

export const ChatDetailScreen: React.FC<ChatDetailScreenProps> = ({ conversationId, onBack }) => {
  const { currentUser, showToast } = useAuth();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<User | null>(null);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Modals
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const fetchChatData = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const res = await api.getMessages(currentUser.id, conversationId);
      setConversation(res.conversation);
      setMessages(res.messages || []);

      const partnerId =
        res.conversation.user_a_id === currentUser.id
          ? res.conversation.user_b_id
          : res.conversation.user_a_id;

      const userRes = await api.getUserProfile(currentUser.id, partnerId);
      setPartner(userRes.user);
    } catch (err: any) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error', err.code);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChatData();
  }, [conversationId, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !conversation || !inputText.trim()) return;

    setIsSending(true);
    try {
      const res = await api.sendMessage(currentUser.id, conversation.id, {
        content_type: 'text',
        content: inputText.trim(),
      });

      setMessages((prev) => [...prev, res.message]);
      setConversation(res.conversation);
      setInputText('');

      // Check if progressive trust threshold crossed!
      if (res.conversation.status === 'friended' && conversation.status === 'pending') {
        showToast(
          '🎉 Ambang Pertemanan (800 Karakter) Tercapai! Fitur Foto Kamera & Voice Note kini terbuka.',
          'success',
        );
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error', err.code);
      } else {
        showToast('Gagal mengirim pesan.', 'error');
      }
    } finally {
      setIsSending(false);
    }
  };

  const handlePhotoCaptured = async (imageDataUrl: string) => {
    if (!currentUser || !conversation) return;

    try {
      const res = await api.sendMessage(currentUser.id, conversation.id, {
        content_type: 'photo',
        content: imageDataUrl,
      });

      setMessages((prev) => [...prev, res.message]);
      showToast('Foto kamera langsung dengan watermark berhasil dikirim!', 'success');
    } catch (err: any) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error', err.code);
      }
    }
  };

  const handleSendVoiceNote = async () => {
    if (!currentUser || !conversation) return;

    if (conversation.status !== 'friended') {
      showToast(
        'Ambang karakter belum tercapai (>800 karakter). Fitur Voice Note masih terkunci.',
        'error',
        'FLR-CONN-001',
      );
      return;
    }

    try {
      const res = await api.sendMessage(currentUser.id, conversation.id, {
        content_type: 'voice_note',
        content: 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg',
        duration: 12,
      });

      setMessages((prev) => [...prev, res.message]);
      showToast('Pesan suara berhasil dikirim (Dapat diputar maks 3x sebelum hangus).', 'success');
    } catch (err: any) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error', err.code);
      }
    }
  };

  const handleAttemptCameraClick = () => {
    if (!conversation) return;

    if (conversation.status !== 'friended') {
      showToast(
        'Ambang karakter belum tercapai. Fitur Foto Kamera Langsung terbuka setelah 800+ karakter.',
        'error',
        'FLR-CONN-001',
      );
      return;
    }

    setShowCameraModal(true);
  };

  const handleExecutePermanentBlock = async () => {
    if (!currentUser || !partner) return;

    try {
      await api.blockUser(currentUser.id, partner.id);
      showToast(`Pengguna ${partner.email} telah diblokir secara permanen.`, 'info');
      onBack();
    } catch (err: any) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error', err.code);
      }
    } finally {
      setShowBlockModal(false);
    }
  };

  if (isLoading || !conversation || !partner) {
    return (
      <div className="py-24 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
        <span>Memuat ruang percakapan...</span>
      </div>
    );
  }

  const isFriended = conversation.status === 'friended';
  const progressPct = Math.min(100, Math.round((conversation.cumulative_char_count / 800) * 100));

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden relative">
      {/* Top Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {partner.avatar_url ? (
            <img src={partner.avatar_url} alt="" className="w-10 h-10 rounded-2xl object-cover ring-2 ring-slate-200" />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white font-bold flex items-center justify-center text-sm">
              {partner.email[0].toUpperCase()}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">{partner.email.split('@')[0]}</span>
              <span className="text-xs text-slate-400">({partner.email})</span>
              {isFriended ? (
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                  FRIENDED
                </span>
              ) : (
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono font-semibold">
                  PENDING (STRANGER)
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
              <span>
                Jenis Kelamin:{' '}
                <strong className="text-indigo-700 capitalize font-semibold">
                  {isFriended ? partner.gender : 'Tersembunyi hingga Berteman 🔒'}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReportModal(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition text-xs flex items-center gap-1"
            title="Laporkan Pengguna Ini"
          >
            <Flag className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowBlockModal(true)}
            className="p-2 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition text-xs flex items-center gap-1 font-semibold"
            title="Blokir Pengguna Permanen"
          >
            <UserX className="w-4 h-4" />
            <span className="hidden sm:inline">Blokir Permanen</span>
          </button>
        </div>
      </div>

      {/* Progressive Trust Character Accumulation Banner */}
      <div className="bg-slate-50 px-5 py-2.5 border-b border-slate-200 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
          <span className="text-slate-700 font-medium">
            Progres Trust:{' '}
            <strong className="text-indigo-700 font-mono font-bold">
              {conversation.cumulative_char_count} / 800 Karakter ({progressPct}%)
            </strong>
          </span>
        </div>

        <div className="w-full sm:w-64 flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isFriended ? 'bg-emerald-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-600">{progressPct}%</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Belum ada pesan. Ketik pesan pertama Anda di bawah untuk mengumpulkan karakter Progressive Trust.
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUser?.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] ${
                  isMe ? 'ml-auto' : 'mr-auto'
                }`}
              >
                <div
                  className={`p-3.5 rounded-2xl shadow-xs text-xs leading-relaxed space-y-2 ${
                    isMe
                      ? 'bg-slate-900 text-white rounded-br-none'
                      : 'bg-white text-slate-900 rounded-bl-none border border-slate-200'
                  }`}
                >
                  {/* Message Content render by type */}
                  {msg.content_type === 'text' && <div>{msg.content_ref}</div>}

                  {msg.content_type === 'photo' && (
                    <div className="space-y-2">
                      <img
                        src={msg.content_ref}
                        alt="Kamera Langsung"
                        className="rounded-xl max-h-64 object-cover border border-slate-200"
                      />
                      <div className="text-[10px] font-mono bg-slate-100 px-2 py-1 rounded text-slate-700 flex items-center gap-1 border border-slate-200 font-semibold">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> DIPOTRET DARI KAMERA LANGSUNG
                      </div>
                    </div>
                  )}

                  {msg.content_type === 'voice_note' && msg.voice_note && (
                    <VoiceNotePlayer voiceNote={msg.voice_note} />
                  )}

                  {/* Metadata */}
                  <div
                    className={`flex items-center justify-between text-[10px] gap-2 pt-1 border-t ${
                      isMe ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-400'
                    }`}
                  >
                    {msg.content_type === 'text' && <span>{msg.char_count} Chars</span>}
                    <span className="font-mono">
                      {new Date(msg.created_at).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Message Composer */}
      {currentUser && currentUser.account_status !== 'restricted_24h' && (
        <form onSubmit={handleSendText} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
          {/* Photo Camera Button (Progressive Trust Locked or Unlocked) */}
          <button
            type="button"
            onClick={handleAttemptCameraClick}
            className={`p-2.5 rounded-2xl transition relative group ${
              isFriended
                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
            }`}
            title={
              isFriended
                ? 'Foto Kamera Langsung (Watermark Stamped)'
                : 'Terkunci! Kumpulkan >800 karakter untuk membuka Kamera'
            }
          >
            <Camera className="w-5 h-5" />
            {!isFriended && (
              <Lock className="w-3 h-3 absolute -top-1 -right-1 text-amber-500 bg-white rounded-full p-0.5 border border-slate-200" />
            )}
          </button>

          {/* Voice Note Button (Progressive Trust Locked or Unlocked) */}
          <button
            type="button"
            onClick={handleSendVoiceNote}
            className={`p-2.5 rounded-2xl transition relative group ${
              isFriended
                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
            }`}
            title={
              isFriended
                ? 'Kirim Pesan Suara (Maks 3x Putar)'
                : 'Terkunci! Kumpulkan >800 karakter untuk membuka Voice Note'
            }
          >
            <Mic className="w-5 h-5" />
            {!isFriended && (
              <Lock className="w-3 h-3 absolute -top-1 -right-1 text-amber-500 bg-white rounded-full p-0.5 border border-slate-200" />
            )}
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Tulis pesan teks jujur..."
              maxLength={2000}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-4 pr-16 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <span className="absolute right-3 top-3 text-[10px] font-mono text-slate-400">
              {inputText.length}c
            </span>
          </div>

          <button
            type="submit"
            disabled={isSending || !inputText.trim()}
            className="p-2.5 rounded-2xl text-white bg-slate-900 hover:bg-slate-800 transition disabled:opacity-50 shadow-xs"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      )}

      {/* Camera Modal (S-10) */}
      {showCameraModal && (
        <LiveCameraModal
          onCapture={handlePhotoCaptured}
          onClose={() => setShowCameraModal(false)}
        />
      )}

      {/* Permanent Block Confirmation Modal (PRD Prinsip #3) */}
      {showBlockModal && partner && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-3xl max-w-md w-full p-6 text-slate-900 shadow-xl relative space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900">Konfirmasi Pemblokiran Permanen</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Tindakan ini <strong>permanen dan tidak dapat dibatalkan</strong> melalui antarmuka manapun (Tidak ada tombol 'Buka Blokir' - PRD Prinsip #3).
              </p>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              Pengguna <strong className="text-rose-600">{partner.email}</strong> akan disembunyikan sepenuhnya dari pencarian, feed, dan percakapan Anda.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowBlockModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                Batal
              </button>
              <button
                onClick={handleExecutePermanentBlock}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs transition"
              >
                Eksekusi Pemblokiran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && partner && (
        <ReportModal
          targetType="user"
          targetId={partner.id}
          targetPreview={`Profil Pengguna: ${partner.email}`}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};
