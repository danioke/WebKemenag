import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { db, doc, getDoc } from '../lib/db';
import { Award, FileText, CheckCircle2 } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';

export default function ProfilPage() {
  const [loading, setLoading] = useState(true);
  const [profil, setProfil] = useState<any>(null);

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
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Helmet>
        <title>Profil Kantor | Kemenag OKI</title>
      </Helmet>
      <Header />
      
      <main className="flex-grow pt-24 sm:pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          {/* Header Section */}
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">Profil Kantor</h1>
            <p className="text-gray-600 text-lg">Kementerian Agama Kabupaten Ogan Komering Ilir</p>
            <div className="w-24 h-1 bg-green-700 mx-auto mt-6 rounded-full"></div>
          </div>

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
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-extrabold text-gray-900">Jajaran Pimpinan</h2>
                  <p className="text-gray-600 mt-2">Kepala Sub Bagian, Kepala Seksi & Penyelenggara</p>
                </div>
                
                {/* Horizontal scroll container on mobile, grid on desktop */}
                <div className="flex overflow-x-auto snap-x snap-mandatory pb-8 md:grid md:grid-cols-3 lg:grid-cols-4 gap-6 hide-scrollbar px-4 md:px-0">
                  {seksiList.map((personil: any, idx: number) => (
                    <div key={idx} className="w-[280px] md:w-auto shrink-0 snap-center bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all">
                      <div className="aspect-[3/4] overflow-hidden bg-gray-100">
                        <img 
                          src={personil.photoUrl || "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=400"} 
                          alt={personil.name} 
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-5 text-center">
                        <h4 className="font-bold text-gray-900 line-clamp-1">{personil.name}</h4>
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
