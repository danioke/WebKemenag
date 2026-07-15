import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Moon, Sunrise, Sun, CloudSun, Sunset, MoonStar, X, Calendar, Clock } from 'lucide-react';

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
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
