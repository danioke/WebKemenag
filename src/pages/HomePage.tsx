import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Services from '../components/Services';
import Pengumuman from '../components/Pengumuman';
import NewsSection from '../components/NewsSection';
import Agenda from '../components/Agenda';
import MediaGallery from '../components/MediaGallery';
import AplikasiCarousel from '../components/AplikasiCarousel';
import Footer from '../components/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />
      <main className="flex-grow">
        <Hero />
        <Services />
        <NewsSection />
        <Pengumuman />
        <Agenda />
        <MediaGallery />
        <AplikasiCarousel />
        
        {/* Banner Pemisah / Call to Action */}
        <section className="bg-green-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Zona Integritas Wilayah Bebas Korupsi (WBK)</h2>
            <p className="text-green-100 max-w-2xl mx-auto mb-8 text-lg">
              Kementerian Agama Kabupaten OKI berkomitmen memberikan pelayanan yang bersih, transparan, dan bebas dari korupsi, kolusi, dan nepotisme.
            </p>
            <a href="#" className="inline-flex items-center px-6 py-3 bg-white text-green-800 font-bold rounded-lg shadow-sm hover:bg-green-50 transition-colors">
              Lapor Pelanggaran (Whistleblower)
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
