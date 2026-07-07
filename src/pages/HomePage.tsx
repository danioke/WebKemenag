import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Services from '../components/Services';
import Pengumuman from '../components/Pengumuman';
import NewsSection from '../components/NewsSection';
import Agenda from '../components/Agenda';
import MediaGallery from '../components/MediaGallery';
import AplikasiCarousel from '../components/AplikasiCarousel';
import BannerCarousel from '../components/BannerCarousel';
import InfografisMarquee from '../components/InfografisMarquee';
import Footer from '../components/Footer';
import JadwalSholatWidget from '../components/JadwalSholatWidget';
import { ShieldCheck } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />
      <main className="flex-grow">
        <Hero />
        
        {/* Daily Widgets Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-8 relative z-20 mb-2 sm:mb-6">
          <div className="w-full">
            <JadwalSholatWidget />
          </div>
        </section>

        <BannerCarousel />

        <Services />
        
        {/* Zona Integritas Wilayah Bebas Korupsi (WBK) - Modern Design Banner */}
        <section className="bg-gradient-to-r from-green-800 via-green-900 to-green-950 text-white py-16 relative overflow-hidden shadow-inner">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-green-700/10 rounded-full blur-3xl"></div>
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
          
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shadow-lg border border-white/20 mb-6 backdrop-blur-sm">
              <ShieldCheck size={36} className="text-amber-400" />
            </div>
            
            <span className="inline-block px-3 py-1 bg-amber-400/20 text-amber-300 text-xs font-bold tracking-widest uppercase rounded-full border border-amber-400/30 mb-4">
              Pembangunan Zona Integritas
            </span>
            
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-4">
              Wilayah Bebas Korupsi (WBK)
            </h2>
            
            <p className="text-green-100 max-w-2xl mx-auto mb-8 text-sm md:text-base leading-relaxed font-medium">
              Kementerian Agama Kabupaten OKI berkomitmen memberikan pelayanan yang bersih, transparan, akuntabel, dan bebas dari segala bentuk korupsi, kolusi, serta nepotisme.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a 
                href="https://dumas.kemenagoki.id/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-green-900 font-bold rounded-xl shadow-md hover:bg-green-50 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
              >
                Lapor Pelanggaran (Whistleblower)
              </a>
              <span className="text-xs text-green-200 font-medium">Atau hubungi layanan pengaduan terpadu kami</span>
            </div>
          </div>
        </section>

        <NewsSection />
        <Pengumuman />
        <InfografisMarquee />
        <Agenda />
        <MediaGallery />
        <AplikasiCarousel />
      </main>
      <Footer />
    </div>
  );
}
