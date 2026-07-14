import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/db';
import { doc, getDoc } from '../lib/db';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, GraduationCap, BookOpen, Building2, Book, Heart, 
  MapPin, ChevronLeft, ChevronRight, Search, Globe, Phone, Mail, Clock, Award
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Icon Map
const iconMap: Record<string, any> = {
  'pendidikan-madrasah': GraduationCap,
  'bimas-islam': BookOpen,
  'pondok-pesantren': Building2,
  'sertifikasi-halal': Book,
  'urusan-agama-islam': Heart,
  'pendidikan-agama-islam': Award
};

// Default static and fallbacks for service data
const defaultLayananData: Record<string, any> = {
  "pendidikan-madrasah": { title: "Pendidikan Madrasah", tugasFungsi: "Data belum tersedia", kasiName: "", kasiPhoto: "", staf: [], syarat: "" },
  "bimas-islam": { title: "Bimbingan Masyarakat Islam", tugasFungsi: "Data belum tersedia", kasiName: "", kasiPhoto: "", staf: [], syarat: "" },
  "pondok-pesantren": { title: "Pendidikan Diniyah & Pondok Pesantren", tugasFungsi: "Data belum tersedia", kasiName: "", kasiPhoto: "", staf: [], syarat: "" },
  "sertifikasi-halal": { title: "Layanan Sertifikasi Halal", tugasFungsi: "Data belum tersedia", kasiName: "", kasiPhoto: "", staf: [], syarat: "" },
  "urusan-agama-islam": { title: "Urusan Agama Islam", tugasFungsi: "Data belum tersedia", kasiName: "", kasiPhoto: "", staf: [], syarat: "" },
  "pendidikan-agama-islam": { title: "Pendidikan Agama Islam", tugasFungsi: "Data belum tersedia", kasiName: "", kasiPhoto: "", staf: [], syarat: "" }
};

const KUA_LIST = [
  { nama: 'KUA Kecamatan Kayuagung', alamat: 'Jl. Letnan Muchtar Saleh, Kayuagung, OKI' },
  { nama: 'KUA Kecamatan Pedamaran', alamat: 'Jl. Raya Pedamaran, Kec. Pedamaran, OKI' },
  { nama: 'KUA Kecamatan Tanjung Lubuk', alamat: 'Jl. Lintas Timur, Kec. Tanjung Lubuk, OKI' },
  { nama: 'KUA Kecamatan SP Padang', alamat: 'Jl. Raya Sirah Pulau Padang, Kec. SP Padang, OKI' },
  { nama: 'KUA Kecamatan Jejawi', alamat: 'Jl. Raya Jejawi, Kec. Jejawi, OKI' },
  { nama: 'KUA Kecamatan Pampangan', alamat: 'Jl. Raya Pampangan, Kec. Pampangan, OKI' },
  { nama: 'KUA Kecamatan Lempuing', alamat: 'Jl. Lintas Timur, Tugumulyo, Kec. Lempuing, OKI' },
  { nama: 'KUA Kecamatan Lempuing Jaya', alamat: 'Jl. Lintas Timur, Lubuk Seberuk, Kec. Lempuing Jaya, OKI' },
  { nama: 'KUA Kecamatan Mesuji', alamat: 'Jl. Lintas Timur, Kec. Mesuji, OKI' },
  { nama: 'KUA Kecamatan Mesuji Makmur', alamat: 'Jl. Poros Mesuji Makmur, Kec. Mesuji Makmur, OKI' },
  { nama: 'KUA Kecamatan Mesuji Raya', alamat: 'Jl. Poros Mesuji Raya, Kec. Mesuji Raya, OKI' },
  { nama: 'KUA Kecamatan Tulung Selapan', alamat: 'Jl. Raya Tulung Selapan, Kec. Tulung Selapan, OKI' },
  { nama: 'KUA Kecamatan Cengal', alamat: 'Jl. Raya Cengal, Kec. Cengal, OKI' },
  { nama: 'KUA Kecamatan Sungai Menang', alamat: 'Jl. Raya Sungai Menang, Kec. Sungai Menang, OKI' },
  { nama: 'KUA Kecamatan Air Sugihan', alamat: 'Jl. Poros Air Sugihan, Kec. Air Sugihan, OKI' },
  { nama: 'KUA Kecamatan Pangkalan Lampam', alamat: 'Jl. Raya Pangkalan Lampam, Kec. Pangkalan Lampam, OKI' },
  { nama: 'KUA Kecamatan Teluk Gelam', alamat: 'Jl. Lintas Timur, Kec. Teluk Gelam, OKI' },
  { nama: 'KUA Kecamatan Pedamaran Timur', alamat: 'Jl. Poros Pedamaran Timur, Kec. Pedamaran Timur, OKI' }
];

export default function LayananDetail() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // KUA search state
  const [kuaSearch, setKuaSearch] = useState('');
  
  // Carousel states for staff
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const fetchServiceData = async () => {
      if (!id) return;
      
      setLoading(true);
      // Urusan Agama Islam doesn't need Firestore data, it is a directory
      if (id === 'urusan-agama-islam') {
        setData({ title: 'Direktori KUA Kecamatan' });
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'layanan_data', id);
        const docSnap = await getDoc(docRef);
        
        const fallback = defaultLayananData[id] || { title: 'Layanan Utama', tugasFungsi: 'Deskripsi sedang diperbarui.' };
        if (docSnap.exists()) {
          const fetched = docSnap.data();
          setData({
            ...fallback,
            ...fetched,
            // Ensure staf array is valid, fallback to default if missing or empty
            staf: fetched.staf && fetched.staf.length > 0 ? fetched.staf : fallback.staf
          });
        } else {
          setData(fallback);
        }
      } catch (error) {
        console.error("Gagal memuat data layanan:", error);
        setData(defaultLayananData[id] || { title: 'Layanan Utama' });
      } finally {
        setLoading(false);
      }
    };

    fetchServiceData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-green-700 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium text-sm">Memuat halaman layanan...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Halaman Tidak Ditemukan</h2>
        <p className="text-gray-600 mb-6 text-center max-w-md">Layanan yang Anda cari tidak tersedia atau sedang dalam proses pemeliharaan.</p>
        <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-semibold transition-all">
          <ArrowLeft size={16} /> Kembali ke Beranda
        </Link>
      </div>
    );
  }

  // Filter KUA list based on search query
  const filteredKua = KUA_LIST.filter(kua => 
    kua.nama.toLowerCase().includes(kuaSearch.toLowerCase()) ||
    kua.alamat.toLowerCase().includes(kuaSearch.toLowerCase())
  );

  // Carousel helpers for staff
  const staffList = data.staf || [];
  const handleNextStaff = () => {
    setCarouselIndex((prev) => (prev + 1) % staffList.length);
  };
  const handlePrevStaff = () => {
    setCarouselIndex((prev) => (prev - 1 + staffList.length) % staffList.length);
  };

  const ServiceIcon = iconMap[id || ''] || BookOpen;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-24 md:pt-28">
      <Header />
      
      {/* Banner / Hero Section */}
      <div className="bg-gradient-to-r from-green-800 to-green-950 text-white py-12 md:py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-200 hover:text-white transition-colors mb-4 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
            <ArrowLeft size={14} /> Kembali ke Beranda
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 shadow-lg border border-white/20">
                <ServiceIcon size={32} className="text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{data.title}</h1>
                <p className="text-xs md:text-sm text-green-200 font-medium tracking-wide mt-1">Layanan Utama Kantor Kementerian Agama Kabupaten OKI</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content body */}
      <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {id === 'sertifikasi-halal' ? (
          /* Render Sertifikasi Halal Page */
          <div className="max-w-4xl mx-auto">
            {data.syarat ? (
              <div 
                className="prose max-w-none text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: data.syarat }}
              />
            ) : (
              <div className="text-center py-10 text-gray-500">
                Syarat dan ketentuan sedang diperbarui.
              </div>
            )}
          </div>
        ) : (
          /* Render Pendidikan Madrasah, Bimas Islam, Pondok Pesantren, Urusan Agama Islam, PAIS */
          <div className="space-y-12">
            {/* Grid: Tugas Fungsi on left, Kasi on right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left Column: Tugas & Fungsi */}
              <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4 mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-green-700 rounded-full"></span>
                  Tugas Pokok & Fungsi
                </h3>
                <div 
                  className="prose max-w-none text-gray-700 leading-relaxed text-sm md:text-base"
                  dangerouslySetInnerHTML={{ __html: data.tugasFungsi }}
                />
              </div>

              {/* Right Column: Kepala Seksi (Kasi) */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-center p-6 flex flex-col items-center">
                <span className="inline-block px-3 py-1 bg-amber-50 text-amber-800 text-[10px] font-bold tracking-wider uppercase rounded-full border border-amber-200/50 mb-4">
                  Kepala Seksi / Penanggung Jawab
                </span>
                
                <div className="w-40 h-40 rounded-2xl overflow-hidden relative border-4 border-gray-50 shadow-md group mb-4">
                  <img 
                    src={data.kasiPhoto} 
                    alt={data.kasiName} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      // Fallback image
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585036156171-384164a8c675?auto=format&fit=crop&q=80&w=300';
                    }}
                  />
                </div>
                
                <h4 className="font-extrabold text-gray-900 text-lg leading-tight mb-1">{data.kasiName}</h4>
                <p className="text-xs text-green-700 font-bold tracking-wide uppercase">Kepala Seksi {data.title}</p>
                <p className="text-[10px] text-gray-400 mt-2">Kementerian Agama Kabupaten Ogan Komering Ilir</p>
              </div>
            </div>

            {/* Staff Section: Carousel of staff */}
            {staffList.length > 0 && (
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4 mb-8 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-green-700 rounded-full"></span>
                    Staf Pelaksana & Organisasi
                  </span>
                  
                  {/* Carousel Controls */}
                  {staffList.length > 1 && (
                    <div className="flex gap-2">
                      <button 
                        onClick={handlePrevStaff}
                        className="w-8 h-8 rounded-full border border-gray-200 hover:border-green-600 hover:text-green-700 bg-white flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button 
                        onClick={handleNextStaff}
                        className="w-8 h-8 rounded-full border border-gray-200 hover:border-green-600 hover:text-green-700 bg-white flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </h3>

                {/* Staff display: Responsive layout */}
                {/* On desktop, show a grid. But on smaller screens or specifically, we have the carousel selector. Let's make a beautiful carousel that centers the staff beautifully with sliding transitions */}
                <div className="relative overflow-hidden py-4 px-2">
                  <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {staffList.map((staf: any, sidx: number) => (
                      <div key={staf.id || sidx} className="bg-gray-50/50 hover:bg-white p-5 rounded-2xl border border-gray-100 hover:border-green-100 hover:shadow-md transition-all text-center flex flex-col items-center">
                        <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-gray-200 bg-gray-100">
                          <img 
                            src={staf.photo} 
                            alt={staf.name} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&q=80&w=250';
                            }}
                          />
                        </div>
                        <h5 className="font-bold text-gray-900 text-sm leading-snug">{staf.name}</h5>
                        <p className="text-xs text-gray-500 mt-1">{staf.role}</p>
                      </div>
                    ))}
                  </div>

                  {/* Mobile Single Card Carousel with animation */}
                  <div className="md:hidden flex justify-center">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={carouselIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="w-full max-w-sm bg-gray-50/75 p-6 rounded-2xl border border-gray-100 text-center flex flex-col items-center"
                      >
                        <div className="w-28 h-28 rounded-full overflow-hidden mb-4 border-2 border-gray-200">
                          <img 
                            src={staffList[carouselIndex]?.photo} 
                            alt={staffList[carouselIndex]?.name} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1564683214965-3619addd900d?auto=format&fit=crop&q=80&w=250';
                            }}
                          />
                        </div>
                        <h5 className="font-bold text-gray-900 text-base leading-snug">{staffList[carouselIndex]?.name}</h5>
                        <p className="text-xs text-green-700 font-semibold mt-1.5">{staffList[carouselIndex]?.role}</p>
                        
                        <div className="flex gap-1.5 justify-center mt-6">
                          {staffList.map((_: any, sidx: number) => (
                            <button
                              key={sidx}
                              onClick={() => setCarouselIndex(sidx)}
                              className={`w-2 h-2 rounded-full transition-all ${carouselIndex === sidx ? 'bg-green-700 w-4' : 'bg-gray-300'}`}
                            />
                          ))}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}

            {/* Append 18 KUA Directory for Urusan Agama Islam */}
            {id === 'urusan-agama-islam' && (
              <div className="space-y-8 mt-12 border-t border-gray-100 pt-12">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">18 Kantor Urusan Agama (KUA) Kecamatan</h3>
                    <p className="text-sm text-gray-500 mt-1">Gunakan kotak pencarian di bawah untuk mencari detail kantor KUA di Kabupaten Ogan Komering Ilir.</p>
                  </div>
                  <div className="relative w-full md:max-w-xs shrink-0">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari kecamatan / alamat..."
                      value={kuaSearch}
                      onChange={(e) => setKuaSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredKua.length === 0 ? (
                    <div className="col-span-full bg-white p-12 text-center text-gray-500 rounded-2xl border border-gray-100">
                      Tidak ditemukan KUA yang cocok dengan kata pencarian "{kuaSearch}".
                    </div>
                  ) : (
                    filteredKua.map((kua, idx) => {
                      const slug = kua.nama.toLowerCase().replace('kua kecamatan ', '').replace(/\s+/g, '');
                      const url = `http://kua${slug}.kemenagoki.id/`;
                      
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                          className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-green-500/30 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center font-bold mb-4 group-hover:bg-green-700 group-hover:text-white transition-colors">
                              {idx + 1}
                            </div>
                            <h4 className="text-base font-bold text-gray-900 group-hover:text-green-700 transition-colors mb-2">{kua.nama}</h4>
                            
                            <div className="space-y-2 text-xs text-gray-600 mt-4 border-t border-gray-50 pt-3">
                              <div className="flex items-start gap-2">
                                <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                                <span>{kua.alamat}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock size={14} className="text-gray-400 shrink-0" />
                                <span>Senin - Jumat: 07:30 - 16:00 WIB</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-6 pt-4 border-t border-gray-50">
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-700 text-green-700 hover:text-white rounded-xl text-xs font-semibold transition-all group-hover:scale-[1.01] active:scale-[0.99] border border-green-100/50"
                            >
                              <Globe size={14} />
                              Kunjungi Website KUA
                            </a>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
