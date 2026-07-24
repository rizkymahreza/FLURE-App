import React, { useState } from 'react';
import { Play, Lock, Volume2, Flame, RefreshCw } from 'lucide-react';
import { VoiceNote } from '../types';
import { api, ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface VoiceNotePlayerProps {
  voiceNote: VoiceNote;
  onUpdate?: () => void;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({ voiceNote, onUpdate }) => {
  const { currentUser, showToast } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVn, setCurrentVn] = useState<VoiceNote>(voiceNote);
  const [isLoading, setIsLoading] = useState(false);

  const playsRemaining = Math.max(0, currentVn.max_plays - currentVn.play_count);

  const handlePlay = async () => {
    if (!currentUser || currentVn.is_expired || currentVn.play_count >= currentVn.max_plays) {
      showToast('Pesan suara ini sudah tidak tersedia (telah hangus).', 'error', 'FLR-CONN-003');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.playVoiceNote(currentUser.id, currentVn.id);
      setCurrentVn((prev) => ({
        ...prev,
        play_count: res.play_count,
        max_plays: res.max_plays,
        is_expired: res.is_expired,
        audio_url: res.audio_url,
      }));

      setIsPlaying(true);

      // Play synthesized audio tone using Web Audio API
      if (typeof window !== 'undefined' && window.AudioContext) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 1.2);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.2);
      }

      setTimeout(() => {
        setIsPlaying(false);
        if (onUpdate) onUpdate();
      }, (currentVn.duration_seconds || 3) * 1000);
    } catch (err: any) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error', err.code);
      } else {
        showToast('Pesan suara ini telah hangus.', 'error', 'FLR-CONN-003');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (currentVn.is_expired || currentVn.play_count >= currentVn.max_plays) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs my-1">
        <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
          <Lock className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="font-semibold flex items-center gap-1.5 text-rose-900">
            <Flame className="w-3.5 h-3.5 text-rose-600" /> Pesan Suara Telah Hangus
          </div>
          <p className="text-[10px] text-rose-700">
            Telah diputar {currentVn.max_plays}/{currentVn.max_plays} kali (Batas Maksimum) • FLR-CONN-003
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-xs my-1 max-w-xs shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={handlePlay}
          disabled={isLoading || isPlaying}
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-white transition shadow-xs ${
            isPlaying
              ? 'bg-amber-500 animate-pulse'
              : 'bg-slate-900 hover:bg-slate-800'
          }`}
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : isPlaying ? (
            <Volume2 className="w-5 h-5 animate-bounce" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </button>

        <div className="flex-1">
          <div className="flex items-center justify-between font-medium text-slate-900 mb-1">
            <span className="flex items-center gap-1 text-[11px] font-semibold">
              <Volume2 className="w-3.5 h-3.5 text-indigo-600" /> Pesan Suara
            </span>
            <span className="text-[10px] font-mono text-slate-500 font-medium">
              {currentVn.duration_seconds || 10}s
            </span>
          </div>

          {/* Audio Waveform visualization */}
          <div className="flex items-center gap-1 h-3 my-1">
            {[40, 70, 30, 90, 60, 100, 50, 80, 40, 60, 90, 30].map((h, idx) => (
              <div
                key={idx}
                className={`flex-1 rounded-full transition-all duration-300 ${
                  isPlaying ? 'bg-indigo-600 animate-pulse' : 'bg-slate-200'
                }`}
                style={{ height: `${isPlaying ? Math.max(20, (h * Math.random()) % 100) : h}%` }}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>
              Sisa Pemutaran: <strong className="text-amber-700 font-bold">{playsRemaining}x lagi</strong>
            </span>
            <span>[{currentVn.play_count}/3]</span>
          </div>
        </div>
      </div>
    </div>
  );
};
