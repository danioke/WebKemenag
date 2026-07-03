import React from 'react';

export default function AplikasiCarousel() {
  const aplikasi = [
    { name: "Pusaka", desc: "Super App Kemenag", color: "bg-blue-600", logo: "P" },
    { name: "SIMPEG 5", desc: "Sistem Kepegawaian", color: "bg-emerald-600", logo: "S" },
    { name: "EMIS", desc: "Data Pendidikan", color: "bg-orange-500", logo: "E" },
    { name: "SIAGA", desc: "Pendis", color: "bg-indigo-600", logo: "S" },
    { name: "Simkah", desc: "Sistem Nikah", color: "bg-teal-600", logo: "S" },
    { name: "Sihalal", desc: "Sistem Halal", color: "bg-green-700", logo: "S" },
    { name: "Simpatika", desc: "PTK Kemenag", color: "bg-rose-600", logo: "S" },
    { name: "Elit", desc: "E-Literasi", color: "bg-purple-600", logo: "E" },
  ];

  return (
    <section className="py-16 bg-white border-t border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 text-center">
        <h2 className="text-green-700 font-semibold tracking-wide uppercase text-sm mb-2">Integrasi Sistem</h2>
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900">Layanan Aplikasi Terintegrasi</h3>
      </div>

      <div className="relative w-full flex overflow-x-hidden group">
        <div className="animate-marquee flex whitespace-nowrap gap-6 px-4">
          {aplikasi.map((app, idx) => (
            <a 
              key={`set1-${idx}`} 
              href="#" 
              className="flex flex-col items-center justify-center w-56 p-6 bg-gray-50 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:bg-white hover:-translate-y-1 transition-all shrink-0"
            >
              <div className={`w-16 h-16 ${app.color} rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-sm group-hover:scale-105 transition-transform`}>
                {app.logo}
              </div>
              <h4 className="font-bold text-gray-900 group-hover:text-green-700 transition-colors">{app.name}</h4>
              <p className="text-sm text-gray-500 mt-1 text-center whitespace-normal">{app.desc}</p>
            </a>
          ))}
          {/* Duplicate set for infinite loop */}
          {aplikasi.map((app, idx) => (
            <a 
              key={`set2-${idx}`} 
              href="#" 
              className="flex flex-col items-center justify-center w-56 p-6 bg-gray-50 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:bg-white hover:-translate-y-1 transition-all shrink-0"
            >
              <div className={`w-16 h-16 ${app.color} rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-sm group-hover:scale-105 transition-transform`}>
                {app.logo}
              </div>
              <h4 className="font-bold text-gray-900 group-hover:text-green-700 transition-colors">{app.name}</h4>
              <p className="text-sm text-gray-500 mt-1 text-center whitespace-normal">{app.desc}</p>
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
