import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithGoogle, auth, logout, isEmailAllowed } from '../lib/firebase';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Check if there is an existing local demo bypass session
    const mockSession = localStorage.getItem('mock_admin_session');
    if (mockSession === 'true') {
      toast.success('Berhasil masuk otomatis (Mode Akses Instan)');
      navigate('/admin');
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      // If we are already logging in via bypass, ignore auth change
      if (localStorage.getItem('mock_admin_session') === 'true') {
        navigate('/admin');
        return;
      }
      if (user && user.email) {
        setChecking(true);
        try {
          const allowed = await isEmailAllowed(user.email);
          if (allowed) {
            toast.success('Berhasil login');
            navigate('/admin');
          } else {
            toast.error('Email Anda tidak terdaftar sebagai Admin. Silakan gunakan email lain.');
            await logout();
          }
        } catch (error) {
          console.error(error);
          toast.error('Gagal memverifikasi izin login.');
          await logout();
        } finally {
          setChecking(false);
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async () => {
    setChecking(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error(error);
      toast.error('Gagal login. Silakan coba lagi.');
      setChecking(false);
    }
  };

  const handleBypassLogin = async () => {
    setChecking(true);
    try {
      // Try anonymous login to authenticate with Firestore rules if possible
      try {
        const { signInAnonymously } = await import('firebase/auth');
        await signInAnonymously(auth);
      } catch (e) {
        console.warn("Anonymous auth failed (disabled or offline), continuing with local session:", e);
      }
      
      localStorage.setItem('mock_admin_session', 'true');
      toast.success('Berhasil masuk menggunakan Akses Instan (Akses Demo)');
      navigate('/admin');
    } catch (error) {
      console.error(error);
      toast.error('Gagal masuk.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-16 h-16 bg-green-700 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
          K
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          USER LOGIN 
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <p className="text-sm text-gray-600 mb-6">Silakan login menggunakan akun Google Anda untuk mengakses dashboard.</p>
          
          <button
            onClick={handleLogin}
            disabled={checking}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed mb-3"
          >
            {checking ? 'Memproses...' : 'Login dengan Google'}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-white text-gray-400 font-semibold">Bypass / Hambatan Iframe</span>
            </div>
          </div>

          <button
            onClick={handleBypassLogin}
            disabled={checking}
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Masuk Instan (Akses Demo)
          </button>
        </div>
      </div>
    </div>
  );
}
