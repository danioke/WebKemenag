import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithGoogle, auth, logout, isEmailAllowed } from '../lib/firebase';
import { toast } from 'sonner';
import ReCAPTCHA from "react-google-recaptcha";

export default function Login() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  
  const siteKey = (import.meta as any).env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

  useEffect(() => {
    // Clear any previous mock bypass sessions to strictly enforce Google Auth & reCAPTCHA
    localStorage.removeItem('mock_admin_session');

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

    return () => {
      unsubscribe();
    };
  }, [navigate]);

  const handleLogin = async () => {
    if (!recaptchaToken) {
      toast.error('Harap selesaikan verifikasi reCAPTCHA terlebih dahulu untuk membuktikan Anda bukan robot.');
      return;
    }
    setChecking(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error(error);
      toast.error('Gagal login. Silakan coba lagi.');
      setChecking(false);
    }
  };

  const onRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token);
    if (token) {
      toast.success('Keamanan terverifikasi. Anda bukan robot!');
    }
  };

  const onRecaptchaErrored = () => {
    setRecaptchaToken(null);
    toast.error('Gagal memuat reCAPTCHA. Hubungi Admin.');
  };

  const onRecaptchaExpired = () => {
    setRecaptchaToken(null);
    toast.warning('reCAPTCHA kedaluwarsa. Harap centang kembali.');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-16 h-16 bg-green-700 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-sm">
          K
        </div>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          Admin Kantor Kemenag OKI
        </h2>
        <p className="mt-1 text-sm text-gray-500">Panel Autentikasi Pengelola Konten Portal</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-md sm:rounded-2xl sm:px-10">
          <div className="mb-6 text-center">
            <p className="text-sm text-gray-600 leading-relaxed">
              Silakan selesaikan tantangan keamanan reCAPTCHA di bawah ini terlebih dahulu sebelum masuk dengan Akun Google terdaftar Anda.
            </p>
          </div>

          {/* reCAPTCHA v2 Widget Container */}
          <div className="flex justify-center mb-6">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={siteKey}
              onChange={onRecaptchaChange}
              onErrored={onRecaptchaErrored}
              onExpired={onRecaptchaExpired}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={checking}
            className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white transition-all active:scale-95 ${
              !recaptchaToken
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
            } disabled:opacity-50`}
          >
            {checking ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses Autentikasi...
              </span>
            ) : (
              'Login dengan Google'
            )}
          </button>

          <div className="mt-6 border-t border-gray-100 pt-4 text-center">
            <span className="text-[11px] text-gray-400 font-medium">
              Sistem Autentikasi Terproteksi Google reCAPTCHA v2 & Firebase Auth
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
