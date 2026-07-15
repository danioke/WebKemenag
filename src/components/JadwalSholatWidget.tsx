import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Moon, Sunrise, Sun, CloudSun, Sunset, MoonStar, X, Calendar, Clock, Printer } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';

interface Jadwal {
  tanggal: string;
  imsak: string;
  subuh: string;
  terbit: string;
  dhuha: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
  date: string;
}

interface Kota {
  id: string;
  lokasi: string;
}

export default function JadwalSholatWidget() {
  const { sholatTtdNama, sholatTtdNip, sholatTtdJabatan, logoUrl, fetchSettings } = useSettingsStore();
  const [jadwal, setJadwal] = useState<Jadwal | null>(null);
  const [kotaList, setKotaList] = useState<Kota[]>([]);
  const [selectedKota, setSelectedKota] = useState<string>("0809"); // OKI default
  const [loading, setLoading] = useState(false);
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Monthly Schedule Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [monthlyJadwal, setMonthlyJadwal] = useState<Jadwal[]>([]);
  const [loadingMonthly, setLoadingMonthly] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetch('https://api.myquran.com/v2/sholat/kota/semua')
      .then(res => res.json())
      .then(data => {
        if (data.status) {
          setKotaList(data.data);
        }
      })
      .catch(err => console.error("Error fetching kota:", err));
  }, []);

  useEffect(() => {
    if (!selectedKota) return;
    
    setLoading(true);
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    fetch(`https://api.myquran.com/v2/sholat/jadwal/${selectedKota}/${year}/${month}/${day}`)
      .then(res => res.json())
      .then(data => {
        if (data.status) {
          setJadwal(data.data.jadwal);
        }
      })
      .catch(err => console.error("Error fetching jadwal:", err))
      .finally(() => setLoading(false));
  }, [selectedKota]);

  // Fetch monthly schedule when modal opens
  useEffect(() => {
    if (isModalOpen && selectedKota) {
      setLoadingMonthly(true);
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      
      fetch(`https://api.myquran.com/v2/sholat/jadwal/${selectedKota}/${year}/${month}`)
        .then(res => res.json())
        .then(data => {
          if (data.status && data.data && data.data.jadwal) {
            setMonthlyJadwal(data.data.jadwal);
          }
        })
        .catch(err => console.error("Error fetching monthly schedule:", err))
        .finally(() => setLoadingMonthly(false));
    }
  }, [isModalOpen, selectedKota]);

  const times = jadwal ? [
    { name: 'Imsak', time: jadwal.imsak },
    { name: 'Subuh', time: jadwal.subuh },
    { name: 'Terbit', time: jadwal.terbit },
    { name: 'Dhuha', time: jadwal.dhuha },
    { name: 'Dzuhur', time: jadwal.dzuhur },
    { name: 'Ashar', time: jadwal.ashar },
    { name: 'Maghrib', time: jadwal.maghrib },
    { name: 'Isya', time: jadwal.isya }
  ] : [];

  const filteredKota = kotaList.filter(k => k.lokasi.toLowerCase().includes(searchQuery.toLowerCase()));
  const selectedKotaObj = kotaList.find(k => k.id === selectedKota);

  const formatHeaderDate = () => {
    const today = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayName = days[today.getDay()];
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${dayName}, ${day}/${month}/${year}`;
  };

  const isToday = (tanggalStr: string) => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const todayFormatted = `${day}/${month}/${year}`;
    return tanggalStr.includes(todayFormatted);
  };

  return (
    <div className="w-full bg-gradient-to-b from-[#f2f7f1] to-[#e6f0e4] border border-[#d9e8d6] rounded-3xl p-5 sm:p-8 shadow-sm font-sans">
      
      {/* Title */}
      <div className="text-center mb-2">
        <h2 className="text-emerald-950 font-extrabold text-2xl sm:text-3xl tracking-tight uppercase">Jadwal Sholat</h2>
        <p className="text-emerald-800/80 text-sm sm:text-base font-semibold mt-1">
          {formatHeaderDate()}
        </p>
      </div>

      {/* Search Bar / Input Trigger */}
      <div className="relative max-w-xs sm:max-w-md mx-auto mb-6 z-30" ref={dropdownRef}>
        <button 
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full bg-white border border-[#d2e4cf] focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-2xl px-5 py-3 text-left text-sm sm:text-base text-emerald-800 font-semibold shadow-sm flex justify-between items-center transition-all cursor-pointer hover:border-emerald-400"
        >
          <span className="truncate">Pilih/Cari Kota: {selectedKotaObj ? selectedKotaObj.lokasi : 'Jakarta'}</span>
          <Search size={18} className="text-emerald-600 shrink-0" />
        </button>
        
        {dropdownOpen && (
          <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-40">
            <div className="p-3 border-b border-gray-100 flex items-center bg-gray-50">
              <Search size={16} className="text-gray-400 mr-2 shrink-0" />
              <input
                type="text"
                className="w-full bg-transparent focus:outline-none text-sm text-gray-700"
                placeholder="Cari kota..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div className="max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {filteredKota.length > 0 ? (
                filteredKota.map((kota) => (
                  <div
                    key={kota.id}
                    className={`px-4 py-3 text-sm cursor-pointer hover:bg-emerald-50 transition-colors ${selectedKota === kota.id ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-gray-700'}`}
                    onClick={() => {
                      setSelectedKota(kota.id);
                      setDropdownOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    {kota.lokasi}
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  Kota tidak ditemukan
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Grid of times */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-800"></div>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-4xl mx-auto mb-5">
            {times.map((t, i) => (
              <div 
                key={i} 
                className="bg-white/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-4 flex flex-col items-center justify-center border border-[#d2e4cf]/40 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] hover:bg-white/80 transition-all text-center"
              >
                <span className="text-emerald-800 text-[10px] sm:text-xs md:text-sm font-semibold mb-1 truncate w-full">{t.name}</span>
                <span className="text-emerald-950 font-black text-sm sm:text-lg md:text-2xl tracking-tight">{t.time}</span>
              </div>
            ))}
          </div>

          {/* Footer Link */}
          <div className="text-center mt-4">
            <span className="text-emerald-850 text-xs sm:text-sm font-medium">
              Untuk jadwal sholat selengkapnya,{' '}
              <button 
                onClick={() => setIsModalOpen(true)}
                className="text-emerald-800 font-bold underline hover:text-emerald-900 focus:outline-none cursor-pointer"
              >
                Klik Disini
              </button>
            </span>
          </div>
        </div>
      )}

      {/* Monthly Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-800 to-emerald-900 text-white p-5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <Calendar className="text-emerald-400" size={24} />
                <div>
                  <h3 className="font-extrabold text-lg sm:text-xl">Jadwal Sholat Bulanan</h3>
                  <p className="text-emerald-200 text-xs sm:text-sm font-medium mt-0.5">
                    {selectedKotaObj ? selectedKotaObj.lokasi : 'Kab. Ogan Komering Ilir'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-4 sm:p-6">
              {loadingMonthly ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-800"></div>
                  <p className="text-gray-500 font-medium text-sm">Memuat jadwal bulanan...</p>
                </div>
              ) : (
                <div className="min-w-full inline-block align-middle">
                  <div className="overflow-x-auto border border-gray-100 rounded-2xl shadow-inner max-h-[55vh]" style={{ scrollbarWidth: 'thin' }}>
                    <table className="min-w-full divide-y divide-gray-100 text-center">
                      <thead className="bg-gray-50 sticky top-0 z-10 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                        <tr>
                          <th className="px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">Tanggal</th>
                          <th className="px-2 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">Imsak</th>
                          <th className="px-2 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">Subuh</th>
                          <th className="px-2 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">Terbit</th>
                          <th className="px-2 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">Dhuha</th>
                          <th className="px-2 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">Dzuhur</th>
                          <th className="px-2 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">Ashar</th>
                          <th className="px-2 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">Maghrib</th>
                          <th className="px-2 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">Isya</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {monthlyJadwal.map((row, idx) => {
                          const todayActive = isToday(row.tanggal);
                          return (
                            <tr 
                              key={idx} 
                              className={`transition-colors ${todayActive ? 'bg-emerald-50 text-emerald-950 font-extrabold border-y-2 border-emerald-200' : 'hover:bg-gray-50 text-gray-700'}`}
                            >
                              <td className="px-3 py-3 whitespace-nowrap text-xs font-semibold">
                                {row.tanggal}
                                {todayActive && (
                                  <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-bold uppercase tracking-wide">
                                    Hari Ini
                                  </span>
                                )}
                              </td>
                              <td className="px-2 py-3 whitespace-nowrap text-xs font-medium">{row.imsak}</td>
                              <td className="px-2 py-3 whitespace-nowrap text-xs font-medium">{row.subuh}</td>
                              <td className="px-2 py-3 whitespace-nowrap text-xs font-medium">{row.terbit}</td>
                              <td className="px-2 py-3 whitespace-nowrap text-xs font-medium">{row.dhuha}</td>
                              <td className="px-2 py-3 whitespace-nowrap text-xs font-medium">{row.dzuhur}</td>
                              <td className="px-2 py-3 whitespace-nowrap text-xs font-medium">{row.ashar}</td>
                              <td className="px-2 py-3 whitespace-nowrap text-xs font-medium">{row.maghrib}</td>
                              <td className="px-2 py-3 whitespace-nowrap text-xs font-medium">{row.isya}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500 shrink-0">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                Seluruh waktu dalam WIB / Zona Waktu Setempat
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm text-xs"
                >
                  <Printer size={14} />
                  Cetak PDF
                </button>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors text-xs cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* HIDDEN PRINT VIEW: Formatted exactly like official Kemenag schedule document */}
      {isModalOpen && createPortal(
        <div id="printable-schedule" className="hidden print:block bg-white text-black p-4 font-serif text-[10px] leading-tight">
          {/* Kop Surat Header */}
          <div className="print-kop flex items-center justify-between border-b-4 border-double border-black pb-2 mb-4">
            <img src={logoUrl || 'https://kuatelukgelam.kemenagoki.id/assets/img/logo.png'} alt="Logo Kemenag" className="w-16 h-16 object-contain shrink-0" referrerPolicy="no-referrer" />
            <div className="text-center flex-1 mx-4">
              <h3 className="font-bold text-sm uppercase leading-tight">KEMENTERIAN AGAMA REPUBLIK INDONESIA</h3>
              <h2 className="font-extrabold text-base uppercase leading-tight">KANTOR KEMENTERIAN AGAMA KABUPATEN OGAN KOMERING ILIR</h2>
              <p className="text-[10px] font-medium italic leading-snug">Jalan Letnan Mukhtar Saleh No. 087 Kayuagung 30611</p>
              <p className="text-[8px] font-medium leading-snug">Telepon (0712) 321004; Faksimili (0712) 321014; e-mail: kabogankomeringilir@kemenag.go.id</p>
              <p className="text-[8px] font-semibold leading-snug">Website: www.sumsel.kemenag.go.id</p>
            </div>
            <img src="https://upload.wikimedia.org/wikipedia/commons/e/ea/Logo_Dewan_Masjid_Indonesia_%28DMI%29.png" alt="Logo DMI" className="w-16 h-16 object-contain shrink-0" referrerPolicy="no-referrer" />
          </div>

          {/* Document Title */}
          <div className="print-title text-center mb-4">
            <h1 className="font-extrabold text-sm tracking-wide uppercase leading-tight">JADWAL WAKTU SHOLAT</h1>
            <h2 className="font-bold text-xs uppercase leading-tight">UNTUK KABUPATEN OGAN KOMERING ILIR & SEKITARNYA</h2>
            <h3 className="font-semibold text-[10px] uppercase leading-tight mt-1">
              {(() => {
                const date = new Date();
                const months = [
                  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
                  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
                ];
                const indonesianMonth = months[date.getMonth()];
                const year = date.getFullYear();
                const hijriYear = year - 579;
                return `${indonesianMonth} ${year} M / RAJAB - SYA'BAN ${hijriYear} H`;
              })()}
            </h3>
          </div>

          {/* Hadits */}
          <div className="print-hadits text-center border border-black p-2 rounded-lg bg-gray-50/50 mb-3 mx-auto max-w-xl">
            <p className="font-serif text-sm leading-normal text-right mb-1" dir="rtl">
              عَنْ أُمِّ فَرْوَةَ قَالَتْ سُئِلَ رَسُولُ اللَّهِ -صلى الله عليه وسلم- أَىُّ الأَعْمَالِ أَفْضَلُ قَالَ « الصَّلاَةُ فِى أَوَّلِ وَقْتِهَا »
            </p>
            <p className="text-[9px] leading-relaxed text-gray-700 italic">
              Dari Ummu Farwah, ia berkata, "Rasulullah Shallallahu 'Alaihi Wasallam pernah ditanya, Amalan apakah yang paling Afdhal? Beliau menjawab, "Shalat Diawal Waktunya." (HR. Abu Daud Nomor: 426. Syaikh Al Albani mengatakan bahwa Hadits ini Shahih)
            </p>
          </div>

          {/* Coordinates */}
          <div className="print-coordinates flex justify-between items-center text-[8px] font-bold border-b border-black pb-1 mb-2">
            <span>Arah Kiblat : 294°43' Jarak Ka'bah : 7610.561 KM</span>
            <span>Lintang : 3°22' LS  Bujur : 104°49' BT</span>
          </div>

          {/* Table */}
          <table className="print-table w-full text-center border-collapse border border-black text-[9px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black px-1.5 py-1 font-bold uppercase">Hari</th>
                <th className="border border-black px-1.5 py-1 font-bold uppercase">Tanggal</th>
                <th className="border border-black px-1.5 py-1 font-bold uppercase">Subuh</th>
                <th className="border border-black px-1.5 py-1 font-bold uppercase">Terbit</th>
                <th className="border border-black px-1.5 py-1 font-bold uppercase">Dhuha</th>
                <th className="border border-black px-1.5 py-1 font-bold uppercase">Zuhur</th>
                <th className="border border-black px-1.5 py-1 font-bold uppercase">Ashar</th>
                <th className="border border-black px-1.5 py-1 font-bold uppercase">Maghrib</th>
                <th className="border border-black px-1.5 py-1 font-bold uppercase">Isya'</th>
              </tr>
            </thead>
            <tbody>
              {monthlyJadwal.map((row, idx) => {
                const parts = row.tanggal.split(', ');
                const hari = parts[0] || '';
                const tgl = parts[1] || row.tanggal;
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="border border-black px-1.5 py-0.5 font-semibold">{hari}</td>
                    <td className="border border-black px-1.5 py-0.5 whitespace-nowrap">{tgl}</td>
                    <td className="border border-black px-1.5 py-0.5 font-medium">{row.subuh}</td>
                    <td className="border border-black px-1.5 py-0.5 font-medium">{row.terbit}</td>
                    <td className="border border-black px-1.5 py-0.5 font-medium">{row.dhuha}</td>
                    <td className="border border-black px-1.5 py-0.5 font-medium">{row.dzuhur}</td>
                    <td className="border border-black px-1.5 py-0.5 font-medium">{row.ashar}</td>
                    <td className="border border-black px-1.5 py-0.5 font-medium">{row.maghrib}</td>
                    <td className="border border-black px-1.5 py-0.5 font-medium">{row.isya}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Notes and Signature Footer */}
          <div className="print-footer mt-4 flex justify-between items-start text-[8px]">
            {/* Left Column (Notes) */}
            <div className="print-notes w-1/2 space-y-1 pr-4">
              <p className="font-semibold">1. Sumber: http://simbi.kemenag.go.id/sihat/waktu-sholat</p>
              <p className="font-semibold text-justify">
                2. SUDAH BENARKAH ARAH KIBLAT ANDA?? Anda Ragu!! Silahkan Hubungi TIM Hisab Rukyat Kantor Kementerian Agama Kabupaten Ogan Komering Ilir.
              </p>
            </div>

            {/* Right Column (Signature) */}
            <div className="print-sig w-1/3 text-center flex flex-col items-center">
              <p className="font-semibold">
                {(() => {
                  const date = new Date();
                  const months = [
                    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                  ];
                  const indonesianMonth = months[date.getMonth()];
                  const day = String(date.getDate()).padStart(2, '0');
                  const year = date.getFullYear();
                  return `Kayuagung, ${day} ${indonesianMonth} ${year} M`;
                })()}
              </p>
              <p className="font-semibold">{sholatTtdJabatan || 'Kepala'}</p>
              
              {/* Spacer for signature */}
              <div className="print-spacer h-16"></div>
              
              {/* Name with underline */}
              <p className="font-bold underline uppercase">{sholatTtdNama || '......................................................'}</p>
              <p className="font-semibold mt-0.5">
                {sholatTtdNip ? `NIP. ${sholatTtdNip}` : 'NIP. ......................................................'}
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
