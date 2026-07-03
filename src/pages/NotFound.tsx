import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, ArrowLeft, Search, ShieldAlert } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <Helmet>
        <title>Halaman Tidak Ditemukan (404) | Kemenag OKI</title>
        <meta name="description" content="Halaman yang Anda cari tidak dapat ditemukan." />
      </Helmet>

      {/* Decorative ambient blobs */}
      <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-green-700/5 rounded-full blur-3xl"></div>
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl"></div>

      <div className="max-w-md w-full text-center relative z-10">
        {/* Animated icon container */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-auto w-24 h-24 rounded-3xl bg-green-50 border border-green-100 flex items-center justify-center shadow-inner mb-8"
        >
          <ShieldAlert size={48} className="text-green-700 animate-pulse" />
        </motion.div>

        {/* 404 Number Badge */}
        <motion.span 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="inline-block px-4 py-1.5 bg-amber-100 text-amber-800 text-xs font-bold tracking-widest uppercase rounded-full border border-amber-200 mb-4"
        >
          Kesalahan 404
        </motion.span>

        {/* Title */}
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-3"
        >
          Halaman Tidak Ditemukan
        </motion.h1>

        {/* Description */}
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          className="text-gray-600 text-sm sm:text-base leading-relaxed mb-8"
        >
          Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan. Periksa kembali URL Anda atau gunakan pencarian di halaman utama.
        </motion.p>

        {/* Action Buttons */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-3 justify-center items-center"
        >
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 hover:scale-[1.01] active:scale-[0.99] transition-all text-sm cursor-pointer"
          >
            <ArrowLeft size={16} />
            Kembali
          </button>
          
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-700 text-white font-bold rounded-xl shadow-md hover:bg-green-800 hover:scale-[1.01] active:scale-[0.99] transition-all text-sm"
          >
            <Home size={16} />
            Ke Halaman Utama
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
