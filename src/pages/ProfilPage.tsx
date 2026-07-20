import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { db, doc, getDoc } from '../lib/db';
import { Award, FileText, CheckCircle2, ChevronLeft, ChevronRight, Building2, ArrowLeft } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';

export default function ProfilPage() {
  const [loading, setLoading] = useState(true);
  const [profil, setProfil] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProfil = async () => {
      try {
        const docRef = doc(db, 'settings', 'profil_kantor');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfil(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching profil:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfil();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      // Find the width of one item + gap
      const firstChild = scrollRef.current.children[0] as HTMLElement;
      const amount = firstChild ? firstChild.offsetWidth + 16 : scrollRef.current.clientWidth;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (!profil?.seksiList || profil.seksiList.length <= 1) return;
    
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scroll('right');
        }
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [profil]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Header />
        <main className="flex-grow pt-32 pb-16 flex items-center justify-center">
          <div className="animate-spin w-12 h-12 border-4 border-green-700 border-t-transparent rounded-full"></div>
        </main>
        <Footer />
      </div>
    );
  }

  const visi = profil?.visi || "Visi belum diatur.";
  const misi = profil?.misi || [];
  const tugas = profil?.tugas || "Tugas belum diatur.";
  const fungsi = profil?.fungsi || [];
  const kepalaNama = profil?.kepalaNama || "Nama Kepala Kantor";
  const kepalaPhoto = profil?.kepalaPhoto || "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=400";
  const seksiList = profil?.seksiList || [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans pt-24 md:pt-28">
      <Helmet>
        <title>Profil Kantor | Kemenag OKI</title>
      </Helmet>
      <Header />
      
      {/* Banner / Hero Section */}
      <div className="bg-gradient-to-r from-green-800 to-green-950 text-white py-12 md:py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link 
            to="/" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-200 hover:text-white transition-colors mb-4 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm"
          >
            <ArrowLeft size={14} />
            Kembali ke Beranda
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 shadow-lg border border-white/20">
                <Building2 size={32} className="text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Profil Kantor</h1>
                <p className="text-xs md:text-sm text-green-200 font-medium tracking-wide mt-1">Kementerian Agama Kabupaten Ogan Komering Ilir</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-grow py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          {/* Visi Misi & Tugas Fungsi */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ScrollReveal direction="up" amount={0.2}>
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 h-full">
                <div className="w-12 h-12 bg-green-100 text-green-700 rounded-2xl flex items-center justify-center mb-6">
                  <Award size={24} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Visi & Misi</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-green-800 mb-2 uppercase tracking-wide text-sm">Visi</h3>
                    <p className="text-gray-700 leading-relaxed italic text-lg font-serif">"{visi}"</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-800 mb-3 uppercase tracking-wide text-sm">Misi</h3>
                    <ul className="space-y-4">
                      {misi.map((m: string, idx: number) => (
                        <li key={idx} className="flex gap-3 text-gray-700 leading-relaxed">
                          <CheckCircle2 className="text-green-600 shrink-0 mt-1" size={18} />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" amount={0.2} delay={0.1}>
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 h-full">
                <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mb-6">
                  <FileText size={24} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Tugas & Fungsi</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-amber-800 mb-2 uppercase tracking-wide text-sm">Tugas Pokok</h3>
                    <p className="text-gray-700 leading-relaxed bg-amber-50 p-4 rounded-xl border border-amber-100">{tugas}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-800 mb-3 uppercase tracking-wide text-sm">Fungsi</h3>
                    <ul className="space-y-3">
                      {fungsi.map((f: string, idx: number) => (
                        <li key={idx} className="flex gap-3 text-gray-700 leading-relaxed items-start">
                          <span className="w-6 h-6 shrink-0 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold text-xs mt-0.5">{idx + 1}</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Kepala Kantor */}
          <ScrollReveal direction="up" amount={0.2}>
            <div className="bg-gradient-to-br from-green-900 to-green-950 rounded-3xl overflow-hidden shadow-xl text-white relative">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 p-8 md:p-12">
                <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-green-700/50 shadow-2xl shrink-0 bg-white">
                  <img src={kepalaPhoto} alt={kepalaNama} className="w-full h-full object-cover object-top" />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-sm font-bold tracking-widest text-green-300 uppercase mb-2">Kepala Kantor Kemenag OKI</h3>
                  <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-4">{kepalaNama}</h2>
                  <p className="text-green-100 max-w-2xl text-lg leading-relaxed">
                    Memimpin dan mengoordinasikan seluruh pelaksanaan tugas Kementerian Agama di wilayah Kabupaten Ogan Komering Ilir demi terwujudnya masyarakat yang taat beragama, rukun, cerdas, dan sejahtera.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Personil (Carousel-like structure) */}
          {seksiList.length > 0 && (
            <ScrollReveal direction="up" amount={0.2}>
              <div className="space-y-8 relative">
                <div className="text-center">
                  <h2 className="text-3xl font-extrabold text-gray-900">Jajaran Pimpinan</h2>
                  <p className="text-gray-600 mt-2">Kepala Sub Bagian, Kepala Seksi & Penyelenggara</p>
                </div>
                
                {seksiList.length > 2 && (
                  <>
                    <button onClick={() => scroll('left')} className="flex absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-md border border-gray-100 text-gray-800 hover:text-green-700 -ml-2 md:-ml-4 items-center justify-center transition-all hover:scale-105">
                      <ChevronLeft size={24} />
                    </button>
                    <button onClick={() => scroll('right')} className="flex absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-md border border-gray-100 text-gray-800 hover:text-green-700 -mr-2 md:-mr-4 items-center justify-center transition-all hover:scale-105">
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}

                {/* Horizontal scroll container */}
                <div 
                  ref={scrollRef}
                  className="flex overflow-x-auto gap-4 md:gap-6 snap-x snap-mandatory scrollbar-hide pb-8 px-4 md:px-0"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {seksiList.map((personil: any, idx: number) => (
                    <div key={idx} className="w-full sm:w-[280px] shrink-0 snap-start bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all">
                      <div className="aspect-[3/4] overflow-hidden bg-gray-100">
                        <img 
                          src={personil.photoUrl || "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=400"} 
                          alt={personil.name} 
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-4 sm:p-5 text-center">
                        <h4 className="font-bold text-gray-900 line-clamp-2 leading-tight">{personil.name}</h4>
                        <p className="text-sm text-green-700 font-medium mt-1">{personil.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}
