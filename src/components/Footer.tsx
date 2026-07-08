import React from 'react';
import { useSettingsStore } from "../store/useSettingsStore";
import { MapPin, Phone, Mail, Facebook, Instagram, Youtube, ExternalLink, Clock } from 'lucide-react';
import NewsletterForm from './NewsletterForm';

export default function Footer() {
  const { logoUrl, contactInfo, socialMedia } = useSettingsStore();
  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8 border-t-4 border-green-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <NewsletterForm />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
          
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img 
                src={logoUrl} 
                alt="Logo Kementerian Agama" 
                className="w-11 h-11 object-contain shrink-0 filter drop-shadow-sm hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />
              <div className="flex flex-col">
                <span className="font-extrabold text-white leading-none text-base tracking-tight uppercase">Kementerian Agama</span>
                <span className="text-[10px] text-green-500 font-bold tracking-widest uppercase">Kabupaten Ogan Komering Ilir</span>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-sm">
              Kementerian Agama Kabupaten Ogan Komering Ilir senantiasa berkomitmen untuk memberikan pelayanan publik yang profesional, transparan, dan akuntabel.
            </p>
            <div className="flex space-x-4">
              {socialMedia.facebook && (
                <a href={socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-green-700 hover:text-white transition-colors">
                  <Facebook size={16} />
                </a>
              )}
              {socialMedia.instagram && (
                <a href={socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-green-700 hover:text-white transition-colors">
                  <Instagram size={16} />
                </a>
              )}
              {socialMedia.youtube && (
                <a href={socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-green-700 hover:text-white transition-colors">
                  <Youtube size={16} />
                </a>
              )}
            </div>
          </div>

          {/* Kontak */}
          <div className="lg:col-span-1">
            <h4 className="text-white font-bold mb-6 tracking-wide">Hubungi Kami</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-green-500 shrink-0 mt-0.5" />
                <span>{contactInfo.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-green-500 shrink-0" />
                <span>{contactInfo.phone}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-green-500 shrink-0" />
                <span>{contactInfo.email}</span>
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
