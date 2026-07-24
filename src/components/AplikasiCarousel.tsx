import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from '../lib/db';
import { db } from '../lib/db';

interface IntegrasiItem {
  id?: string;
  name: string;
  desc: string;
  color: string;
  logo: string;
  logoImage?: string;
  url?: string;
  status?: string;
  order?: number;
  openInNewTab?: boolean;
}

const DEFAULT_APLIKASI: IntegrasiItem[] = [
  { name: "Pusaka", desc: "Super App Kemenag", color: "bg-blue-600", logo: "P", url: "https://pusaka.kemenag.go.id" },
  { name: "SIMPEG 5", desc: "Sistem Kepegawaian", color: "bg-emerald-600", logo: "S", url: "https://simpeg.kemenag.go.id" },
  { name: "EMIS 4.0", desc: "Data Pendidikan", color: "bg-orange-500", logo: "E", url: "https://emis.kemenag.go.id" },
  { name: "SIAGA", desc: "Pendis", color: "bg-indigo-600", logo: "S", url: "https://siagagtk.com" },
  { name: "Simkah", desc: "Sistem Nikah", color: "bg-teal-600", logo: "S", url: "https://simkah.kemenag.go.id" },
  { name: "Sihalal", desc: "Sistem Halal", color: "bg-green-700", logo: "S", url: "https://ptts.halal.go.id" },
  { name: "Simpatika", desc: "PTK Kemenag", color: "bg-rose-600", logo: "S", url: "https://simpatika.kemenag.go.id" },
  { name: "Elit", desc: "E-Literasi", color: "bg-purple-600", logo: "E", url: "https://kemenag.go.id" },
];

export default function AplikasiCarousel() {
  const [aplikasiList, setAplikasiList] = useState<IntegrasiItem[]>(DEFAULT_APLIKASI);

  useEffect(() => {
    let isMounted = true;
    const fetchAplikasi = async () => {
      try {
        const q = query(collection(db, 'integrasi_sistem'), orderBy('order', 'asc'));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const fetchedItems = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as IntegrasiItem))
            .filter(item => item.status !== 'inactive');

          if (fetchedItems.length > 0 && isMounted) {
            setAplikasiList(fetchedItems);
          }
        }
      } catch (err) {
        console.error("Gagal memuat integrasi_sistem untuk carousel:", err);
      }
    };

    fetchAplikasi();
    return () => { isMounted = false; };
  }, []);

  return (
    <section className="py-16 bg-white border-t border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 text-center">
        <h2 className="text-green-700 font-semibold tracking-wide uppercase text-sm mb-2">Integrasi Sistem</h2>
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900">Layanan Aplikasi Terintegrasi</h3>
      </div>

      <div className="relative w-full flex overflow-x-hidden group">
        <div className="animate-marquee flex whitespace-nowrap gap-6 px-4">
          {aplikasiList.map((app, idx) => (
            <a 
              key={`set1-${app.id || idx}`} 
              href={app.url || "#"} 
              target={app.openInNewTab !== false ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center w-56 p-6 bg-gray-50 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:bg-white hover:-translate-y-1 transition-all shrink-0"
            >
              {app.logoImage ? (
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-200 shadow-sm mb-4 bg-white p-1 shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <img src={app.logoImage} alt={app.name} className="w-full h-full object-cover rounded-xl" />
                </div>
              ) : (
                <div className={`w-16 h-16 ${app.color || 'bg-blue-600'} rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-sm group-hover:scale-105 transition-transform shrink-0`}>
                  {app.logo || app.name.charAt(0)}
                </div>
              )}
              <h4 className="font-bold text-gray-900 group-hover:text-green-700 transition-colors text-center truncate max-w-full">{app.name}</h4>
              <p className="text-sm text-gray-500 mt-1 text-center whitespace-normal line-clamp-2">{app.desc}</p>
            </a>
          ))}

          {/* Duplicate set for seamless infinite loop */}
          {aplikasiList.map((app, idx) => (
            <a 
              key={`set2-${app.id || idx}`} 
              href={app.url || "#"} 
              target={app.openInNewTab !== false ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center w-56 p-6 bg-gray-50 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:bg-white hover:-translate-y-1 transition-all shrink-0"
            >
              {app.logoImage ? (
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-200 shadow-sm mb-4 bg-white p-1 shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <img src={app.logoImage} alt={app.name} className="w-full h-full object-cover rounded-xl" />
                </div>
              ) : (
                <div className={`w-16 h-16 ${app.color || 'bg-blue-600'} rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-sm group-hover:scale-105 transition-transform shrink-0`}>
                  {app.logo || app.name.charAt(0)}
                </div>
              )}
              <h4 className="font-bold text-gray-900 group-hover:text-green-700 transition-colors text-center truncate max-w-full">{app.name}</h4>
              <p className="text-sm text-gray-500 mt-1 text-center whitespace-normal line-clamp-2">{app.desc}</p>
            </a>
          ))}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-50% - 12px)); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
        .group:hover .animate-marquee {
          animation-play-state: paused;
        }
      `}} />
    </section>
  );
}
