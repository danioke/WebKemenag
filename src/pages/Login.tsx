import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithGoogle, auth, logout, isEmailAllowed } from '../lib/firebase';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clear any previous mock bypass sessions to strictly enforce Google Auth & reCAPTCHA
    localStorage.removeItem('mock_admin_session');

    const renderRecaptcha = () => {
      const container = recaptchaRef.current;
      if (!container) return;

      const grecaptcha = (window as any).grecaptcha;
      if (grecaptcha && grecaptcha.render) {
        try {
          container.innerHTML = ''; // clear any loading placeholder
          const siteKey = (import.meta as any).env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
          
          grecaptcha.render(container, {
            sitekey: siteKey,
            callback: (token: string) => {
              setRecaptchaToken(token);
              toast.success('Keamanan terverifikasi. Anda bukan robot!');
            },
            'expired-callback': () => {
              setRecaptchaToken(null);
              toast.warning('reCAPTCHA kedaluwarsa. Harap centang kembali.');
            },
            'error-callback': () => {
              setRecaptchaToken(null);
              toast.error('Gagal memuat reCAPTCHA. Hubungi Admin.');
            }
          });
        } catch (err) {
          console.error("grecaptcha rendering failed:", err);
        }
      }
    };

    // Set the global callback
    (window as any).onRecaptchaLoad = () => {
      renderRecaptcha();
    };

    // Only load reCAPTCHA when component mounts
    const scriptId = 'recaptcha-script-tag';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    } else {
      // If script is already in the document, wait for grecaptcha to be available and render
      const grecaptcha = (window as any).grecaptcha;
      if (grecaptcha && grecaptcha.render) {
        setTimeout(renderRecaptcha, 100);
      } else {
        // Poll for grecaptcha to be available
        const interval = setInterval(() => {
          const gc = (window as any).grecaptcha;
          if (gc && gc.render) {
            renderRecaptcha();
            clearInterval(interval);
          }
        }, 100);
        return () => clearInterval(interval);
      }
    }

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
            <div 
              ref={recaptchaRef} 
              className="bg-gray-50 p-2 rounded-lg border border-gray-100 shadow-inner flex items-center justify-center min-h-[78px] min-w-[304px]"
            >
              <span className="text-xs text-gray-400">Memuat Google reCAPTCHA...</span>
            </div>
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
