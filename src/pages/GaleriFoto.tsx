import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ArrowLeft, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';

interface PhotoData {
  id: string;
  title: string;
  image: string;
}

export default function GaleriFoto() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const photoQ = query(collection(db, 'photos'), orderBy('createdAt', 'desc'));
        const photoSnap = await getDocs(photoQ);
        const photoData = photoSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PhotoData));
        setPhotos(photoData.length > 0 ? photoData : fallbackPhotos);
      } catch (error) {
        console.error("Error fetching photos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(photos.length / itemsPerPage);
  const currentPhotos = photos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openModal = (photoId: string) => {
    const index = photos.findIndex(p => p.id === photoId);
    if (index !== -1) {
      setCurrentIndex(index);
      setIsModalOpen(true);
      document.body.style.overflow = 'hidden';
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = '';
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : prev));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <div className="bg-white px-4 py-4 border-b border-gray-100 flex items-center sticky top-0 z-50">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
        </div>
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-500">Memuat galeri...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Helmet>
        <title>Galeri Foto | Kemenag OKI</title>
        <meta name="description" content="Galeri Foto kegiatan Kementerian Agama Kabupaten Ogan Komering Ilir" />
      </Helmet>

      {/* Mobile-style Top Nav Bar */}
      <div className="bg-white px-4 py-4 border-b border-gray-100 flex items-center sticky top-0 z-50 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors mr-3">
          <ArrowLeft size={24} />
        </button>
        <h2 className="font-semibold text-gray-900 truncate flex-1">Galeri Foto</h2>
      </div>

      <main className="flex-grow py-6 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentPhotos.map((photo) => (
              <div 
                key={photo.id} 
                onClick={() => openModal(photo.id)}
                className="group relative rounded-xl overflow-hidden aspect-square shadow-sm cursor-pointer bg-white"
              >
                <img src={photo.image} alt={photo.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <p className="text-white font-medium text-sm leading-tight">{photo.title}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-10 flex justify-center items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
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
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Selanjutnya
              </button>
            </div>
          )}

        </div>
      </main>

      {/* Fullscreen TikTok-style Modal */}
      {isModalOpen && (
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
              disabled={currentIndex === photos.length - 1}
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
                className="w-full h-full flex flex-col items-center justify-center p-4 max-w-5xl mx-auto"
              >
                <img 
                  src={photos[currentIndex].image} 
                  alt={photos[currentIndex].title}
                  className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl"
                />
                <div className="mt-6 text-center px-8">
                  <h3 className="text-white text-xl md:text-2xl font-bold">{photos[currentIndex].title}</h3>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

const fallbackPhotos: PhotoData[] = [
  { id: '1', title: "Kegiatan Pembinaan Kerukunan Umat Beragama", image: "https://images.unsplash.com/photo-1551041777-ed277b8ce348?auto=format&fit=crop&q=80" },
  { id: '2', title: "Rapat Koordinasi KUA Kecamatan", image: "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&q=80" },
  { id: '3', title: "Pembinaan Madrasah", image: "https://images.unsplash.com/photo-1519817914152-2a041fdd68c6?auto=format&fit=crop&q=80" },
  { id: '4', title: "Peringatan Maulid Nabi", image: "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&q=80" },
  { id: '5', title: "Hari Santri Nasional", image: "https://images.unsplash.com/photo-1519817914152-2a041fdd68c6?auto=format&fit=crop&q=80" },
  { id: '6', title: "Pelepasan Jamaah Haji", image: "https://images.unsplash.com/photo-1519817914152-2a041fdd68c6?auto=format&fit=crop&q=80" },
  { id: '7', title: "Peringatan Isra Mi'raj", image: "https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&q=80" },
];
