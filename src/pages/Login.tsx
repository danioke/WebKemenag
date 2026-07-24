import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, loginWithPassword, verify2FACode } from '../lib/db';
import { toast } from 'sonner';
import { ShieldCheck, ArrowLeft, KeyRound, Smartphone } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [checking, setChecking] = useState(false);

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorEmail, setTwoFactorEmail] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [verifying2FA, setVerifying2FA] = useState(false);

  useEffect(() => {
    // Clear any previous mock bypass sessions
    localStorage.removeItem('mock_admin_session');

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        toast.success('Berhasil login sebagai Administrator!');
        navigate('/admin');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Email dan password wajib diisi');
      return;
    }

    setChecking(true);
    try {
      const res = await loginWithPassword(email.trim(), password.trim());
      if (res.twoFactorRequired && res.email) {
        setRequires2FA(true);
        setTwoFactorEmail(res.email);
        toast.info('Verifikasi 2FA diperlukan. Buka aplikasi Autentikator Anda.');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Gagal login. Silakan coba lagi.');
    } finally {
      setChecking(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorCode.trim() || twoFactorCode.trim().length < 6) {
      toast.error('Masukkan 6 digit kode dari aplikasi Autentikator Anda.');
      return;
    }

    setVerifying2FA(true);
    try {
      await verify2FACode(twoFactorEmail, twoFactorCode.trim());
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Kode 2FA salah atau telah kadaluarsa!');
    } finally {
      setVerifying2FA(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-20 h-20 bg-green-700 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-md overflow-hidden p-2">
          <img 
            src="https://kuatelukgelam.kemenagoki.id/assets/img/logo.png" 
            alt="Logo Kemenag" 
            className="w-full h-full object-contain"
            onError={(e) => {
              // Fallback if logo fails
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-2xl sm:px-10 border border-gray-100">
          
          {!requires2FA ? (
            <>
              <div className="mb-6 text-center border-b border-gray-100 pb-4">
                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                  Silakan login untuk masuk ke dashboard
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Username
                  </label>
                  <input
                    type="email"
                    autoComplete="off"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Username"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all shadow-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={checking}
                  className="w-full flex justify-center items-center py-3 px-4 bg-green-700 hover:bg-green-800 text-white rounded-xl shadow-md text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {checking ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Memverifikasi Password...
                    </span>
                  ) : (
                    'Masuk ke Dashboard'
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* 2FA Form */}
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-green-100 text-green-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <ShieldCheck size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Verifikasi Autentikator (2FA)</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Masukkan 6 digit kode dari aplikasi <strong>Google Authenticator</strong> / <strong>Authy</strong> di HP Anda untuk akun <span className="font-semibold text-gray-800">{twoFactorEmail}</span>.
                </p>
              </div>

              <form onSubmit={handleVerify2FA} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 text-center">
                    Kode 6 Digit 2FA
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoFocus
                      required
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="000000"
                      className="w-full px-4 py-3 border-2 border-green-500 rounded-xl text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-4 focus:ring-green-100 bg-white transition-all shadow-sm font-bold text-gray-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={verifying2FA || twoFactorCode.length < 6}
                  className="w-full flex justify-center items-center py-3 px-4 bg-green-700 hover:bg-green-800 text-white rounded-xl shadow-md text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {verifying2FA ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Memverifikasi Kode 2FA...
                    </span>
                  ) : (
                    'Verifikasi & Masuk'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRequires2FA(false);
                    setTwoFactorCode('');
                  }}
                  className="w-full flex justify-center items-center gap-2 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft size={14} />
                  Kembali ke Form Password
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
