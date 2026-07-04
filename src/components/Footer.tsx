import React from 'react';
import { MapPin, Phone, Mail, Facebook, Instagram, Youtube, ExternalLink, Clock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8 border-t-4 border-green-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
          
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <svg className="w-11 h-11 shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="46" fill="#15803d" stroke="#f59e0b" strokeWidth="3" />
                <circle cx="50" cy="50" r="38" fill="#166534" />
                <path d="M50 18L53.5 26.5H62.5L55.5 31.5L58 40L50 35L42 40L44.5 31.5L37.5 26.5H46.5L50 18Z" fill="#fbbf24" />
                <path d="M50 52C45 47 37 47 32 49V64C37 62 45 62 50 67C55 62 63 62 68 64V49C63 47 55 47 50 52Z" fill="#ffffff" stroke="#fbbf24" strokeWidth="2" strokeLinejoin="round" />
                <path d="M35 53H45M35 57H45M35 60H45M65 53H55M65 57H55M65 60H55" stroke="#166534" strokeWidth="1" />
                <path d="M44 68H56V74H44V68Z" fill="#fbbf24" />
                <path d="M22 50C22 35 34 26 44 26" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
                <path d="M78 50C78 35 66 26 56 26" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
                <path d="M50 33L70 43V60C70 72 50 82 50 82C50 82 30 72 30 60V43L50 33Z" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
              </svg>
              <div className="flex flex-col">
                <span className="font-extrabold text-white leading-none text-base tracking-tight uppercase">Kementerian Agama</span>
                <span className="text-[10px] text-green-500 font-bold tracking-widest uppercase">Kabupaten Ogan Komering Ilir</span>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-sm">
              Kementerian Agama Kabupaten Ogan Komering Ilir senantiasa berkomitmen untuk memberikan pelayanan publik yang profesional, transparan, dan akuntabel.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-green-700 hover:text-white transition-colors">
                <Facebook size={16} />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-green-700 hover:text-white transition-colors">
                <Instagram size={16} />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-green-700 hover:text-white transition-colors">
                <Youtube size={16} />
              </a>
            </div>
          </div>

          {/* Kontak */}
          <div className="lg:col-span-1">
            <h4 className="text-white font-bold mb-6 tracking-wide">Hubungi Kami</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-green-500 shrink-0 mt-0.5" />
                <span>Jl. Letnan Muchtar Saleh No. 1, Kayuagung, OKI 30611</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-green-500 shrink-0" />
                <span>(0711) 322123</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-green-500 shrink-0" />
                <span>kaboki@kemenag.go.id</span>
              </li>
            </ul>
          </div>

          {/* Jam Pelayanan */}
          <div className="lg:col-span-1">
            <h4 className="text-white font-bold mb-6 tracking-wide">Jam Pelayanan</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-green-400">
                  <Clock size={16} />
                  <span className="font-semibold">Senin - Kamis</span>
                </div>
                <span className="text-gray-400 pl-6">07.30 - 16.00 WIB</span>
              </li>
              <li className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-green-400">
                  <Clock size={16} />
                  <span className="font-semibold">Jumat</span>
                </div>
                <span className="text-gray-400 pl-6">07.30 - 16.30 WIB</span>
              </li>
              <li className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-red-400">
                  <Clock size={16} />
                  <span className="font-semibold">Sabtu - Minggu</span>
                </div>
                <span className="text-gray-400 pl-6">Libur</span>
              </li>
            </ul>
          </div>

          {/* Layanan */}
          <div className="lg:col-span-1">
            <h4 className="text-white font-bold mb-6 tracking-wide">Layanan Publik</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-green-400 transition-colors inline-flex items-center gap-2"><ExternalLink size={14} /> Pendaftaran Sertifikasi Halal</a></li>
              <li><a href="#" className="hover:text-green-400 transition-colors inline-flex items-center gap-2"><ExternalLink size={14} /> SIMKAH</a></li>
              <li><a href="#" className="hover:text-green-400 transition-colors inline-flex items-center gap-2"><ExternalLink size={14} /> EMIS Madrasah</a></li>
              <li><a href="#" className="hover:text-green-400 transition-colors inline-flex items-center gap-2"><ExternalLink size={14} /> PTSP Online</a></li>
              <li><a href="#" className="hover:text-green-400 transition-colors inline-flex items-center gap-2"><ExternalLink size={14} /> PPID Kemenag</a></li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-gray-800 text-center text-sm text-gray-500 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>&copy; {new Date().getFullYear()} Kementerian Agama Kabupaten Ogan Komering Ilir. Hak Cipta Dilindungi.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Kebijakan Privasi</a>
            <a href="#" className="hover:text-white transition-colors">Syarat & Ketentuan</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
