import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithGoogle, loginWithEmail, registerWithEmail, auth, logout, isEmailAllowed } from '../lib/firebase';
import { toast } from 'sonner';
import { FirebaseError } from 'firebase/app';

export default function Login() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    try {
      if (isRegistering) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (error: any) {
      console.error(error);
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
           toast.error('Email atau password salah.');
        } else if (error.code === 'auth/email-already-in-use') {
           toast.error('Email sudah terdaftar. Silakan login.');
        } else if (error.code === 'auth/weak-password') {
           toast.error('Password terlalu lemah (minimal 6 karakter).');
        } else {
           toast.error(error.message || 'Gagal login. Silakan coba lagi.');
        }
      } else {
        toast.error('Gagal login. Silakan coba lagi.');
      }
      setChecking(false);
    }
  };

  const handleGoogleLogin = async () => {
    setChecking(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error(error);
      toast.error('Gagal login dengan Google. Silakan coba lagi.');
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
          Login Admin Kemenag OKI
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <p className="text-sm text-gray-600 mb-6 text-center">
            {isRegistering ? 'Daftar akun baru menggunakan email dan password.' : 'Silakan login menggunakan email dan password Anda.'}
          </p>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isRegistering ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={checking}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checking ? 'Memproses...' : (isRegistering ? 'Daftar' : 'Login')}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Atau lanjutkan dengan</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleGoogleLogin}
                disabled={checking}
                type="button"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <img
                  className="h-5 w-5 mr-2"
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google logo"
                />
                Google
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm font-medium text-green-600 hover:text-green-500"
            >
              {isRegistering ? 'Sudah punya akun? Login di sini' : 'Belum punya akun? Daftar di sini'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
