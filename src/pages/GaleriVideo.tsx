import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ArrowLeft, Play, X, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';

interface VideoData {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  videoUrl?: string;
}

export default function GaleriVideo() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as VideoData[];

        if (data.length > 0) {
          setVideos(data);
        } else {
          setVideos(fallbackVideos);
        }
      } catch (error) {
        console.error("Error fetching videos list:", error);
        setVideos(fallbackVideos);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  // Filter logic
  const filteredVideos = videos.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentVideos = filteredVideos.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openModal = (videoUrlId: string) => {
    const index = filteredVideos.findIndex(v => v.id === videoUrlId);
    if (index !== -1) {
      setCurrentIndex(index);
      setIsModalOpen(true);
      setIsPlaying(false);
      document.body.style.overflow = 'hidden';
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsPlaying(false);
    document.body.style.overflow = '';
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < filteredVideos.length - 1 ? prev + 1 : prev));
    setIsPlaying(false);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
    setIsPlaying(false);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <div className="bg-white px-4 py-4 border-b border-gray-100 flex items-center sticky top-0 z-50 shadow-sm">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors mr-3">
            <ArrowLeft size={24} />
          </button>
          <h2 className="font-semibold text-gray-900">Kembali</h2>
        </div>
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-500 font-medium">Memuat semua video...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Helmet>
        <title>Galeri Video Resmi | Kemenag OKI</title>
        <meta name="description" content="Dokumentasi video kegiatan, profil, and tutorial layanan di Kantor Kementerian Agama Kabupaten Ogan Komering Ilir" />
      </Helmet>

      {/* Top Nav Bar */}
      <div className="bg-white px-4 py-4 border-b border-gray-100 flex items-center sticky top-0 z-50 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors mr-3">
          <ArrowLeft size={24} />
        </button>
        <h2 className="font-bold text-gray-900 truncate flex-1 text-lg">Semua Galeri Video</h2>
      </div>

      <main className="flex-grow py-6 sm:py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Search Box */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm mb-8">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                placeholder="Cari dokumentasi video..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-green-500 focus:border-green-500 block pl-10 p-3.5 outline-none"
              />
            </div>
          </div>

          {/* Video Grid */}
          <AnimatePresence mode="popLayout">
            {currentVideos.length > 0 ? (
              <motion.div 
                layout 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {currentVideos.map((video) => (
                  <motion.div
                    key={video.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => openModal(video.id)}
                    className="group relative rounded-xl overflow-hidden aspect-video shadow-sm cursor-pointer border border-gray-100 bg-black flex flex-col"
                  >
                    <img 
                      src={video.thumbnail} 
                      alt={video.title} 
                      className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" 
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 group-hover:scale-110 transition-transform shadow-lg">
                        <Play size={20} className="ml-1" fill="currentColor" />
                      </div>
                    </div>
                    <div className="absolute bottom-3 right-3 bg-black/75 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm tracking-wider">
                      {video.duration}
                    </div>
                    <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent">
                      <p className="text-white text-sm font-bold line-clamp-2 leading-tight group-hover:text-amber-300 transition-colors">{video.title}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-gray-400 font-medium">Tidak ada video yang cocok dengan pencarian Anda.</p>
              </div>
            )}
          </AnimatePresence>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Sebelumnya
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                      currentPage === page 
                        ? 'bg-green-700 text-white shadow-sm' 
                        : 'border border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Selanjutnya
              </button>
            </div>
          )}

        </div>
      </main>

      {/* Fullscreen Video Player Modal */}
      {isModalOpen && filteredVideos.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-center items-center">
          <button 
            onClick={closeModal}
            className="absolute top-6 left-6 z-50 text-white p-3 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full transition-colors"
          >
            <X size={24} />
          </button>
          
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50">
            <button 
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="text-white p-3 bg-black/40 hover:bg-black/60 disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm rounded-full transition-colors"
            >
              <ChevronUp size={24} />
            </button>
            <button 
              onClick={handleNext}
              disabled={currentIndex === filteredVideos.length - 1}
              className="text-white p-3 bg-black/40 hover:bg-black/60 disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm rounded-full transition-colors"
            >
              <ChevronDown size={24} />
            </button>
          </div>

          <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full flex flex-col items-center justify-center p-4 max-w-4xl mx-auto"
              >
                <div className="relative w-full aspect-video bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center shadow-2xl">
                  {isPlaying && filteredVideos[currentIndex].videoUrl ? (
                    (() => {
                      const url = filteredVideos[currentIndex].videoUrl || '';
                      const match = url.match(/(?:id=|\/d\/)([a-zA-Z0-9_-]{25,})/);
                      const embedUrl = match && match[1]
                        ? `https://drive.google.com/file/d/${match[1]}/preview`
                        : url;
                      return (
                        <iframe
                          src={embedUrl}
                          className="w-full h-full border-0 rounded-xl"
                          allow="autoplay; encrypted-media"
                          allowFullScreen
                        ></iframe>
                      );
                    })()
                  ) : (
                    <>
                      <img 
                        src={filteredVideos[currentIndex].thumbnail} 
                        alt={filteredVideos[currentIndex].title}
                        className="w-full h-full object-contain opacity-50"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button 
                          onClick={() => setIsPlaying(true)}
                          className="w-20 h-20 bg-green-600/90 hover:bg-green-600 cursor-pointer backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-xl transition-transform hover:scale-110"
                        >
                          <Play size={32} className="ml-2" fill="currentColor" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="mt-6 text-center px-8 max-w-2xl">
                  <h3 className="text-white text-xl md:text-2xl font-bold leading-snug">{filteredVideos[currentIndex].title}</h3>
                  <p className="text-gray-400 mt-2 font-medium">Durasi: {filteredVideos[currentIndex].duration}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

const fallbackVideos: VideoData[] = [
  { id: '1', title: "Profil Kementerian Agama Kabupaten OKI", thumbnail: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80", duration: "05:24" },
  { id: '2', title: "Sosialisasi Layanan Sertifikasi Halal Gratis 2024", thumbnail: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=80", duration: "12:10" },
  { id: '3', title: "Dokumentasi Manasik Haji Massal Kemenag OKI 2024", thumbnail: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80", duration: "08:15" },
  { id: '4', title: "Rangkaian Peringatan Hari Santri Nasional Tingkat Kabupaten", thumbnail: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&q=80", duration: "15:45" },
  { id: '5', title: "Penyuluhan Cegah Pernikahan Dini KUA Kayuagung", thumbnail: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80", duration: "06:50" },
  { id: '6', title: "Sosialisasi Penyaluran Zakat Fitrah BAZNAS & Kemenag", thumbnail: "https://images.unsplash.com/photo-1590407727780-33734dc8cb10?auto=format&fit=crop&q=80", duration: "10:30" }
];
