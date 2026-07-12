import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, loginWithPassword, logout } from '../lib/firebase';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('anisreza498@gmail.com');
  const [password, setPassword] = useState('');
  const [checking, setChecking] = useState(false);

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
      await loginWithPassword(email.trim(), password.trim());
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Gagal login. Silakan coba lagi.');
    } finally {
      setChecking(false);
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
        <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          Log In
        </h2>
        <p className="mt-1 text-sm text-gray-500">Panel Autentikasi Mandiri Pengelola Portal</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-2xl sm:px-10 border border-gray-100">
          <div className="mb-6 text-center border-b border-gray-100 pb-4">
            <p className="text-sm text-gray-600 leading-relaxed font-medium">
              Silakan login untuk masuk ke dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Alamat Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@email.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
        </div>
      </div>
    </div>
  );
}
