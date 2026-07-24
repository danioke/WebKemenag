import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Shield, ShieldCheck, ShieldAlert, Smartphone, QrCode, Key, CheckCircle, RefreshCw, Copy, Check, Lock, ArrowRight } from 'lucide-react';
import { auth } from '../../lib/db';

export default function TwoFactorAdmin() {
  const currentUserEmail = auth.currentUser?.email || localStorage.getItem('admin_profile_email') || 'anisreza498@gmail.com';
  
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Setup flow state
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Disable flow state
  const [disableCode, setDisableCode] = useState('');
  const [isDisabling, setIsDisabling] = useState(false);

  // Check 2FA status
  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/2fa/status?email=${encodeURIComponent(currentUserEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setIsEnabled(!!data.twoFactorEnabled);
      }
    } catch (err) {
      console.error('Failed checking 2FA status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [currentUserEmail]);

  // Start setup process
  const handleStartSetup = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUserEmail }),
      });
      if (res.ok) {
        const data = await res.json();
        setQrCodeUrl(data.qrCodeUrl);
        setSecretKey(data.secret);
        setIsSettingUp(true);
      } else {
        toast.error('Gagal membuat kunci 2FA. Coba lagi.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghubungkan ke server.');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm and enable 2FA
  const handleConfirmEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length < 6) {
      toast.error('Masukkan 6 digit kode dari aplikasi Autentikator.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUserEmail,
          secret: secretKey,
          code: verificationCode.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || '2FA Autentikator berhasil diaktifkan!');
        setIsEnabled(true);
        setIsSettingUp(false);
        setVerificationCode('');
        setSecretKey('');
        setQrCodeUrl('');
      } else {
        toast.error(data.error || 'Kode verifikasi tidak valid.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memverifikasi 2FA.');
    } finally {
      setSubmitting(false);
    }
  };

  // Disable 2FA
  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disableCode || disableCode.length < 6) {
      toast.error('Masukkan 6 digit kode dari aplikasi Autentikator untuk mengonfirmasi.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUserEmail,
          code: disableCode.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('2FA Autentikator berhasil nonaktif.');
        setIsEnabled(false);
        setIsDisabling(false);
        setDisableCode('');
      } else {
        toast.error(data.error || 'Gagal menonaktifkan 2FA. Kode salah.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghubungkan ke server.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secretKey);
    setCopiedKey(true);
    toast.success('Secret key disalin ke clipboard');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${isEnabled ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            {isEnabled ? <ShieldCheck size={36} /> : <ShieldAlert size={36} />}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Autentikasi 2 Langkah (2FA)
            </h1>
            <p className="text-sm text-gray-600 mt-0.5">
              Lindungi akun login administrator <span className="font-semibold text-gray-800">({currentUserEmail})</span> dengan kode sekali pakai dari Google Authenticator / Authy.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className={`px-3 py-1.5 text-xs font-bold rounded-full border ${
            isEnabled 
              ? 'bg-green-50 text-green-700 border-green-200' 
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {isEnabled ? '● 2FA Aktif' : '○ 2FA Nonaktif'}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-sm">
          <RefreshCw className="animate-spin h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 font-medium">Memeriksa status keamanan akun...</p>
        </div>
      ) : isEnabled ? (
        /* Enabled State Box */
        <div className="bg-white p-6 rounded-2xl border border-green-200 shadow-sm space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <CheckCircle size={28} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Akun Anda Dilindungi 2FA</h3>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                Setiap kali login menggunakan password, Anda akan diminta memasukkan 6 digit kode dari aplikasi Autentikator di smartphone Anda.
              </p>
            </div>
          </div>

          {!isDisabling ? (
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Membutuhkan perubahan smartphone atau ingin mematikan 2FA?
              </p>
              <button
                type="button"
                onClick={() => setIsDisabling(true)}
                className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Nonaktifkan 2FA
              </button>
            </div>
          ) : (
            <form onSubmit={handleDisable2FA} className="pt-4 border-t border-red-100 bg-red-50/50 p-4 rounded-xl border border-red-200 space-y-4">
              <h4 className="text-sm font-bold text-red-800">Konfirmasi Penonaktifan 2FA</h4>
              <p className="text-xs text-red-700">
                Masukkan 6 digit kode dari aplikasi Autentikator Anda saat ini untuk mengonfirmasi penonaktifan.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  maxLength={6}
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="000000"
                  className="px-4 py-2 border border-red-300 rounded-xl text-center font-mono tracking-widest text-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
                />
                <button
                  type="submit"
                  disabled={submitting || disableCode.length < 6}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Memproses...' : 'Ya, Nonaktifkan Sekarang'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsDisabling(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        /* Disabled State / Setup Guide Box */
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          {!isSettingUp ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Mengapa Menggunakan 2FA Autentikator?</h3>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  2FA (Two-Factor Authentication) menambahkan lapisan keamanan ekstra. Walaupun kata sandi Anda diketahui orang lain, mereka tidak akan bisa masuk tanpa kode 6-digit dari HP Anda.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">1</div>
                  <h4 className="font-bold text-sm text-gray-800">Unduh Aplikasi</h4>
                  <p className="text-xs text-gray-600">Unduh <strong>Google Authenticator</strong> atau <strong>Authy</strong> dari Google Play Store / App Store.</p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">2</div>
                  <h4 className="font-bold text-sm text-gray-800">Scan QR Code</h4>
                  <p className="text-xs text-gray-600">Pindai kode QR yang dihasilkan menggunakan kamera aplikasi Autentikator Anda.</p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">3</div>
                  <h4 className="font-bold text-sm text-gray-800">Verifikasi Kode</h4>
                  <p className="text-xs text-gray-600">Masukkan 6 digit angka yang muncul di aplikasi untuk mengaktifkan 2FA secara permanen.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleStartSetup}
                  disabled={submitting}
                  className="px-6 py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? 'Menyiapkan 2FA...' : 'Mulai Setup 2FA Autentikator'}
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          ) : (
            /* Setup Step Interactive View */
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <QrCode size={22} className="text-green-600" />
                  Langkah-Langkah Mengaktifkan 2FA
                </h3>
                <p className="text-xs text-gray-500 mt-1">Ikuti 3 langkah berikut untuk menautkan akun Anda ke Google Authenticator / Authy.</p>
              </div>

              {/* Step 1: Scan QR */}
              <div className="flex flex-col md:flex-row gap-6 items-center bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-center">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48 object-contain mx-auto" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-xs text-gray-400">Loading QR...</div>
                  )}
                  <span className="text-[10px] text-gray-500 font-semibold block mt-1">Pindai dengan Kamera Autentikator</span>
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-md uppercase tracking-wider">Langkah 1 & 2</span>
                    <h4 className="text-base font-bold text-gray-900 mt-2">Pindai QR Code atau Masukkan Secret Key</h4>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      Buka aplikasi <strong>Google Authenticator</strong> atau <strong>Authy</strong> di HP Anda, pilih <strong>+ Tambah Akun</strong>, lalu pilih <strong>Pindai kode QR</strong>.
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-1">
                    <span className="text-[11px] text-gray-500 font-medium block">Atau masukkan Kunci Rahasia ini secara manual:</span>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded-lg flex-1 overflow-x-auto select-all">
                        {secretKey}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopySecret}
                        className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors cursor-pointer"
                        title="Salin Kunci Rahasia"
                      >
                        {copiedKey ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Input Verification Code */}
              <form onSubmit={handleConfirmEnable} className="space-y-4 bg-green-50/60 p-6 rounded-2xl border border-green-200">
                <div>
                  <span className="text-xs font-bold text-green-800 bg-green-200 px-2.5 py-1 rounded-md uppercase tracking-wider">Langkah 3</span>
                  <h4 className="text-base font-bold text-gray-900 mt-2">Konfirmasi Kode 6 Digit</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Masukkan 6 digit angka terbaru yang ditampilkan aplikasi Autentikator Anda untuk mengonfirmasi penautan.
                  </p>
                </div>

                <div className="max-w-xs">
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="000000"
                    className="w-full px-4 py-3 border-2 border-green-500 rounded-xl text-center text-2xl font-mono tracking-widest bg-white focus:outline-none focus:ring-4 focus:ring-green-100 shadow-sm font-bold text-gray-900"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting || verificationCode.length < 6}
                    className="px-6 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Memverifikasi...' : 'Verifikasi & Aktifkan 2FA'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingUp(false);
                      setVerificationCode('');
                    }}
                    className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
