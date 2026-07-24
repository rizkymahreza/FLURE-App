import React, { useState } from 'react';
import { Shield, Sparkles, AlertCircle, ArrowRight, CheckCircle, Lock, Camera, Mic, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../services/api';

// S-01 Landing Screen
export const LandingScreen: React.FC = () => {
  const { setActiveScreen } = useAuth();

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-12 text-slate-900">
      {/* Hero */}
      <div className="text-center space-y-6 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" /> Platform Sosial Progressive Trust V1.0
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight text-slate-900">
          Membangun Hubungan Sosial Lewat{' '}
          <span className="text-indigo-600">
            Kepercayaan Bertahap
          </span>
        </h1>

        <p className="text-slate-600 text-sm leading-relaxed">
          FLURE adalah jejaring sosial privasi-utama di mana pengguna mulai sebagai orang asing dan secara alami membuka fitur Foto Kamera & Voice Note setelah bertukar 800+ karakter percakapan.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            onClick={() => setActiveScreen('register')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2"
          >
            Mulai Registrasi FLURE <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveScreen('login')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-sm border border-slate-200 transition"
          >
            Masuk Akun Sesi
          </button>
        </div>
      </div>

      {/* Feature Pillars */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900">Ambang 800 Karakter</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Identitas jenis kelamin dan berbagi media terlindungi hingga percakapan mendalam tercapai.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100">
            <Camera className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900">Kamera Langsung & Watermark</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Foto wajib dipotret dari kamera real-time dengan stempel watermark resmi FLURE.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
            <Mic className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900">Voice Note Ephemeral</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Pesan suara otomatis hangus setelah diputar 3 kali total oleh pendengar.
          </p>
        </div>
      </div>
    </div>
  );
};

// S-03 Age Verification Gate (Full-screen Block State for age < 18)
export const AgeVerificationGate: React.FC<{ onBackToHome: () => void }> = ({ onBackToHome }) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="bg-white border border-rose-200 rounded-3xl max-w-md w-full p-8 text-center space-y-6 shadow-xl">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">Verifikasi Usia Gagal (S-03)</h2>
          <p className="text-xs text-rose-600 font-mono font-semibold">KODE ERROR: FLR-AUTH-002</p>
          <p className="text-xs text-slate-600 leading-relaxed pt-2">
            Maaf, FLURE adalah platform khusus untuk pengguna yang berusia <strong>18 tahun ke atas</strong>.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left">
          • Tanggal lahir server menghitung usia di bawah 18 tahun.<br />
          • Pendaftaran akun baru diblokir demi kepatuhan keselamatan komunitas.
        </div>

        <button
          onClick={onBackToHome}
          className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
        >
          Kembali ke Beranda
        </button>
      </div>
    </div>
  );
};

// S-02 Register Screen
export const RegisterScreen: React.FC = () => {
  const { register, setActiveScreen, showToast } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [isAgeBlocked, setIsAgeBlocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !birthDate) return;

    setIsSubmitting(true);
    try {
      await register(email, password, birthDate);
      setActiveScreen('onboarding');
    } catch (err: any) {
      if (err instanceof ApiError && err.code === 'FLR-AUTH-002') {
        setIsAgeBlocked(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAgeBlocked) {
    return <AgeVerificationGate onBackToHome={() => setActiveScreen('landing')} />;
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-6 shadow-xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center mx-auto border border-indigo-100">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Daftar Akun FLURE (S-02)</h2>
          <p className="text-xs text-slate-500">Verifikasi Usia Wajib 18+ Tahun</p>
        </div>

        <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Alamat Email (Unik)
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@domain.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Kata Sandi (Min 8 Karakter)
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Tanggal Lahir (Gerbang Verifikasi Usia 18+)
            </label>
            <input
              type="date"
              required
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
          >
            {isSubmitting ? 'Memproses Verifikasi...' : 'Lanjutkan Registrasi'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Sudah punya akun?{' '}
          <button
            onClick={() => setActiveScreen('login')}
            className="text-indigo-600 font-bold hover:underline"
          >
            Masuk Sekarang
          </button>
        </div>
      </div>
    </div>
  );
};

// S-04 Login Screen
export const LoginScreen: React.FC = () => {
  const { login, setActiveScreen, showToast } = useAuth();

  const [email, setEmail] = useState('rizky@flure.app');
  const [password, setPassword] = useState('password123');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      // toast shown by auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-6 shadow-xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center mx-auto border border-indigo-100">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Masuk Sesi FLURE (S-04)</h2>
          <p className="text-xs text-slate-500">Masukkan Kredensial Terdaftar</p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Alamat Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rizky@flure.app"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Kata Sandi
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password123"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
          >
            {isSubmitting ? 'Verifikasi...' : 'Masuk Sesi'}
          </button>
        </form>

        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
          💡 Demo Kredensial: Use <code className="text-indigo-600 font-semibold">rizky@flure.app</code>, <code className="text-indigo-600 font-semibold">nadia@flure.app</code>, or <code className="text-indigo-600 font-semibold">admin@flure.app</code> with password <code className="text-indigo-600 font-semibold">password123</code>.
        </div>

        <div className="text-center text-xs text-slate-500">
          Belum punya akun?{' '}
          <button
            onClick={() => setActiveScreen('register')}
            className="text-indigo-600 font-bold hover:underline"
          >
            Daftar Baru
          </button>
        </div>
      </div>
    </div>
  );
};

// S-05 Onboarding Profile Screen
export const OnboardingProfileScreen: React.FC = () => {
  const { currentUser, setActiveScreen, showToast, refreshProfile } = useAuth();

  const [gender, setGender] = useState<'male' | 'female' | 'non_binary' | 'prefer_not_to_say'>('female');
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      await api.updateProfile(currentUser.id, { gender, bio });
      await refreshProfile();
      showToast('Profil berhasil dilengkapkan!', 'success');
      setActiveScreen('feed');
    } catch (err: any) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error', err.code);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-6 shadow-xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center mx-auto border border-indigo-100">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Lengkapi Profil (S-05)</h2>
          <p className="text-xs text-slate-500">Pengaturan Awal Privasi Progressive Trust</p>
        </div>

        <form onSubmit={handleOnboardingSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Jenis Kelamin (Tersembunyi hingga status Berteman &gt;800 Chars)
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="female">Perempuan (Female)</option>
              <option value="male">Laki-Laki (Male)</option>
              <option value="non_binary">Non-Binary</option>
              <option value="prefer_not_to_say">Prefer Not To Say</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Bio Singkat
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Ceritakan tentang hobi atau hal yang Anda sukai..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
          >
            {isSubmitting ? 'Menyimpan...' : 'Selesaikan Onboarding'}
          </button>
        </form>
      </div>
    </div>
  );
};
