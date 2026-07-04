import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Search, Play, Pause, ChevronLeft, X } from 'lucide-react';

interface Surah {
  nomor: number;
  nama: string;
  namaLatin: string;
  arti: string;
  jumlahAyat: number;
}

interface SurahDetail extends Surah {
  ayat: Ayat[];
  audioFull: {
    "05": string; // Mishary Rashid
  };
}

interface Ayat {
  nomorAyat: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
  audio: {
    "05": string; // Mishary Rashid
  };
}

export default function QuranWidget() {
  const [surahList, setSurahList] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [surahDetail, setSurahDetail] = useState<SurahDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Audio state
  const [isPlayingSurah, setIsPlayingSurah] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch('https://equran.id/api/v2/surat')
      .then(res => res.json())
      .then(data => {
        if (data.code === 200) {
          setSurahList(data.data);
        }
      })
      .catch(err => console.error("Error fetching surah list:", err));
  }, []);

  useEffect(() => {
    if (!selectedSurah) {
      setSurahDetail(null);
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlayingSurah(false);
      }
      return;
    }
    
    setLoading(true);
    fetch(`https://equran.id/api/v2/surat/${selectedSurah}`)
      .then(res => res.json())
      .then(data => {
        if (data.code === 200) {
          setSurahDetail(data.data);
        }
      })
      .catch(err => console.error("Error fetching surah detail:", err))
      .finally(() => setLoading(false));
  }, [selectedSurah]);

  // Clean up audio when modal closes
  useEffect(() => {
    if (!isModalOpen && audioRef.current) {
      audioRef.current.pause();
      setIsPlayingSurah(false);
    }
  }, [isModalOpen]);

  const filteredSurahs = surahList.filter(s => 
    s.namaLatin.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.arti.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePlaySurah = () => {
    if (isPlayingSurah) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlayingSurah(false);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      if (surahDetail && surahDetail.audioFull && surahDetail.audioFull["05"]) {
        const newAudio = new Audio(surahDetail.audioFull["05"]);
        newAudio.onended = () => {
          setIsPlayingSurah(false);
        };
        
        newAudio.play();
        audioRef.current = newAudio;
        setIsPlayingSurah(true);
      }
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-[0.03] z-0"></div>
        <div className="bg-emerald-600 p-4 text-white flex justify-between items-center shrink-0 relative z-10">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-emerald-100" />
            <h3 className="font-bold">Al-Qur'an Digital</h3>
          </div>
        </div>

        <div className="flex-grow flex flex-col items-center justify-center p-6 text-center relative z-10">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-sm border border-emerald-100 relative group overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10"></div>
             <BookOpen size={28} className="transform group-hover:scale-110 transition-transform relative z-10" />
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg w-fit text-sm flex items-center justify-center gap-2 mx-auto"
          >
            <BookOpen size={18} />
            Buka Al-Qur'an
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative animate-in fade-in zoom-in duration-200">
            <div className="bg-emerald-600 p-4 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen size={20} className="text-emerald-200" />
                <h3 className="font-bold">Al-Qur'an Digital</h3>
              </div>
              <div className="flex items-center gap-2">
                {selectedSurah && (
                  <button 
                    onClick={() => setSelectedSurah(null)}
                    className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft size={14} /> Kembali
                  </button>
                )}
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="text-white hover:bg-white/20 p-1.5 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-grow flex flex-col overflow-hidden relative bg-white">
              {!selectedSurah ? (
                <>
                  <div className="p-4 shrink-0 border-b border-gray-100">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Cari Surah..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="overflow-y-auto flex-grow p-2 custom-scrollbar">
                    {filteredSurahs.map((surah) => (
                      <button
                        key={surah.nomor}
                        onClick={() => setSelectedSurah(surah.nomor)}
                        className="w-full text-left p-4 hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-4 group"
                      >
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0 group-hover:bg-emerald-100 transition-colors">
                          {surah.nomor}
                        </div>
                        <div className="flex-grow">
                          <div className="font-bold text-gray-800">{surah.namaLatin}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{surah.arti} • {surah.jumlahAyat} Ayat</div>
                        </div>
                        <div className="font-arabic text-2xl text-emerald-600">{surah.nama}</div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {loading ? (
                    <div className="flex-grow flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    </div>
                  ) : surahDetail ? (
                    <div className="overflow-y-auto flex-grow p-4 md:p-6 space-y-6 custom-scrollbar bg-gray-50/50">
                      <div className="text-center pb-6 border-b border-gray-100 relative">
                        <h4 className="font-bold text-xl text-gray-800">{surahDetail.namaLatin}</h4>
                        <div className="font-arabic text-4xl text-emerald-600 mt-4 mb-2">{surahDetail.nama}</div>
                        <p className="text-sm text-gray-500 mb-4">{surahDetail.arti}</p>
                        
                        {surahDetail.audioFull && surahDetail.audioFull["05"] && (
                          <div className="flex justify-center mt-2">
                            <button 
                              onClick={togglePlaySurah}
                              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm ${
                                isPlayingSurah 
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                                  : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                              }`}
                            >
                              {isPlayingSurah ? (
                                <>
                                  <Pause size={16} /> Berhenti
                                </>
                              ) : (
                                <>
                                  <Play size={16} /> Putar Surat (Mishary Rashid)
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {surahDetail.ayat.map((ayat) => (
                        <div key={ayat.nomorAyat} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                          <div className="flex justify-between items-start mb-6">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                              {ayat.nomorAyat}
                            </div>
                            <div className="font-arabic text-3xl leading-loose text-right text-gray-800" dir="rtl">
                              {ayat.teksArab}
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-600 leading-relaxed">{ayat.teksIndonesia}</div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Scrollbar styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af; 
        }
      `}} />
    </>
  );
}
