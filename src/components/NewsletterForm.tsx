import React, { useState } from 'react';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { db, collection, addDoc, serverTimestamp } from '../lib/db';
import { toast } from 'sonner';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setStatus('loading');
      await addDoc(collection(db, 'newsletter_subscribers'), {
        email,
        createdAt: serverTimestamp(),
      });
      setStatus('success');
      toast.success('Berhasil berlangganan buletin kami!');
      setEmail('');
      
      // Reset success state after a few seconds
      setTimeout(() => {
        setStatus('idle');
      }, 5000);
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      setStatus('idle');
      toast.error('Gagal berlangganan. Silakan coba lagi nanti.');
    }
  };

  return (
    <div className="bg-gray-800 rounded-2xl p-6 md:p-8 mb-12 flex flex-col md:flex-row items-center justify-between gap-6 border border-gray-700 shadow-lg relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-green-600/10 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute -right-16 -top-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="relative z-10 w-full md:w-1/2">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-green-900/50 flex items-center justify-center text-green-400">
            <Mail size={20} />
          </div>
          <h3 className="text-xl font-bold text-white">Berlangganan Buletin</h3>
        </div>
        <p className="text-gray-400 text-sm">
          Dapatkan informasi, berita, dan pengumuman terbaru dari Kementerian Agama Kabupaten Ogan Komering Ilir langsung ke kotak masuk Anda.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="relative z-10 w-full md:w-auto md:flex-1 max-w-md flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Alamat email Anda..."
            className="w-full bg-gray-900/50 border border-gray-700 text-white rounded-xl pl-4 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder:text-gray-500"
            required
            disabled={status === 'loading' || status === 'success'}
          />
        </div>
        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            status === 'success' 
              ? 'bg-green-600 text-white cursor-default' 
              : 'bg-green-500 hover:bg-green-600 text-white active:scale-[0.98]'
          } disabled:opacity-70`}
        >
          {status === 'loading' ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : status === 'success' ? (
            <>
              <CheckCircle2 size={18} />
              <span>Berhasil</span>
            </>
          ) : (
            <>
              <span>Langganan</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
