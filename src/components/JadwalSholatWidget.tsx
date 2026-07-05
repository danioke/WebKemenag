import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Moon, Sunrise, Sun, CloudSun, Sunset, MoonStar, Search, ChevronDown } from 'lucide-react';

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

  const times = jadwal ? [
    { name: 'Subuh', time: jadwal.subuh, icon: <Moon size={20} className="text-gray-600" /> },
    { name: 'Terbit', time: jadwal.terbit, icon: <Sunrise size={20} className="text-gray-600" /> },
    { name: 'Dzuhur', time: jadwal.dzuhur, icon: <Sun size={20} className="text-gray-600" /> },
    { name: 'Ashar', time: jadwal.ashar, icon: <CloudSun size={20} className="text-gray-600" /> },
    { name: 'Maghrib', time: jadwal.maghrib, icon: <Sunset size={20} className="text-gray-600" /> },
    { name: 'Isya', time: jadwal.isya, icon: <MoonStar size={20} className="text-gray-600" /> },
  ] : [];

  const filteredKota = kotaList.filter(k => k.lokasi.toLowerCase().includes(searchQuery.toLowerCase()));
  const selectedKotaObj = kotaList.find(k => k.id === selectedKota);

  return (
    <div className="w-full font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 text-gray-600">
        <div>{jadwal?.tanggal || 'Memuat jadwal...'}</div>
        
        <div className="relative mt-2 sm:mt-0 min-w-[250px] z-30" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-between w-full sm:justify-end gap-2 py-1 focus:outline-none hover:text-green-800 transition-colors bg-transparent cursor-pointer"
          >
            <span className="truncate">{selectedKotaObj ? selectedKotaObj.lokasi : 'Pilih Kota'}</span>
            <ChevronDown size={16} className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-full sm:w-64 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
              <div className="p-2 border-b border-gray-100 flex items-center bg-gray-50">
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
                      className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-green-50 transition-colors ${selectedKota === kota.id ? 'bg-green-50 text-green-800 font-medium' : 'text-gray-700'}`}
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
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-800"></div>
        </div>
      ) : (
        <div className="relative w-full overflow-hidden">
          {/* Mobile view: continuous marquee */}
          <div className="flex md:hidden relative w-full overflow-hidden">
            <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
              <div className="flex gap-4 pr-4">
                {times.map((t, i) => (
                  <div key={`a-${i}`} className="w-36 bg-gray-50 rounded-xl p-4 flex flex-col justify-center border border-gray-100 shadow-sm shrink-0 cursor-default">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 text-sm font-medium">{t.name}</span>
                      {t.icon}
                    </div>
                    <div className="text-green-800 font-bold text-2xl">{t.time}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 pr-4">
                {times.map((t, i) => (
                  <div key={`b-${i}`} className="w-36 bg-gray-50 rounded-xl p-4 flex flex-col justify-center border border-gray-100 shadow-sm shrink-0 cursor-default">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 text-sm font-medium">{t.name}</span>
                      {t.icon}
                    </div>
                    <div className="text-green-800 font-bold text-2xl">{t.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop view: normal grid */}
          <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            {times.map((t, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 flex flex-col justify-center border border-gray-100 hover:border-green-200 transition-colors shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600 text-sm font-medium">{t.name}</span>
                  {t.icon}
                </div>
                <div className="text-green-800 font-bold text-2xl">{t.time}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
