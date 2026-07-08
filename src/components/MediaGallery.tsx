import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Image as ImageIcon, Video, ArrowRight, X, ChevronUp, ChevronDown } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link } from 'react-router-dom';

interface PhotoData {
  id: string;
  title: string;
  image: string;
}

interface VideoData {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  videoUrl?: string;
}

import ReactPlayer from 'react-player';
const Player = ReactPlayer as any;

export default function MediaGallery() {
  const [activeTab, setActiveTab] = useState<'foto' | 'video'>('foto');
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);

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

        const videoQ = query(collection(db, 'videos'), orderBy('createdAt', 'desc'));
        const videoSnap = await getDocs(videoQ);
        const videoData = videoSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoData));
        setVideos(videoData.length > 0 ? videoData : fallbackVideos);
      } catch (error) {
        console.error("Error fetching media:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openModal = (index: number) => {
    setCurrentIndex(index);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  };

  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = '';
  };

  const handleNext = () => {
    const arr = activeTab === 'foto' ? photos : videos;
    setCurrentIndex((prev) => (prev < arr.length - 1 ? prev + 1 : prev));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const activeMediaArray = activeTab === 'foto' ? photos : videos;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-green-700 font-semibold tracking-wide uppercase text-sm mb-2">Dokumentasi</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Galeri Foto & Video</h3>
          
          <div className="inline-flex bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('foto')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'foto' ? 'bg-white text-green-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <ImageIcon size={16} /> Galeri Foto
            </button>
            <button 
              onClick={() => setActiveTab('video')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'video' ? 'bg-white text-green-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Video size={16} /> Galeri Video
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Memuat galeri...</div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'foto' && (
              <motion.div 
                key="foto-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {photos.map((photo, idx) => (
                  <div 
                    key={photo.id} 
                    onClick={() => openModal(idx)}
                    className="group relative rounded-xl overflow-hidden aspect-square shadow-sm cursor-pointer"
                  >
                    <img src={photo.image} alt={photo.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <p className="text-white font-medium text-sm leading-tight">{photo.title}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'video' && (
              <motion.div 
                key="video-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {videos.map((video, idx) => (
                  <div 
                    key={video.id} 
                    onClick={() => openModal(idx)}
                    className="group relative rounded-xl overflow-hidden aspect-video shadow-sm cursor-pointer border border-gray-100"
                  >
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 group-hover:scale-110 transition-transform shadow-lg">
                        <Play size={24} className="ml-1" fill="currentColor" />
                      </div>
                    </div>
                    <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded backdrop-blur-sm">
                      {video.duration}
                    </div>
                    <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
                      <p className="text-white font-semibold line-clamp-1">{video.title}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        <div className="mt-10 text-center">
          {activeTab === 'foto' ? (
            <Link to="/galeri-foto" className="inline-flex items-center text-green-700 font-semibold hover:text-green-800 transition-colors">
              Lihat Semua Foto <ArrowRight size={18} className="ml-1" />
            </Link>
          ) : (
            <Link to="/galeri-video" className="inline-flex items-center text-green-700 font-semibold hover:text-green-800 transition-colors">
              Lihat Semua Video <ArrowRight size={18} className="ml-1" />
            </Link>
          )}
        </div>

      </div>

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
              disabled={currentIndex === activeMediaArray.length - 1}
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
                {activeTab === 'foto' ? (
                  <img 
                    src={(activeMediaArray[currentIndex] as PhotoData).image} 
                    alt={activeMediaArray[currentIndex].title}
                    className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl"
                  />
                ) : (
                  <div className="relative w-full max-w-4xl aspect-video max-h-[85vh] bg-black rounded-lg overflow-hidden flex items-center justify-center shadow-2xl">
                    {(() => {
                      const video = activeMediaArray[currentIndex] as VideoData;
                      const url = video.videoUrl || '';
                      
                      // Google Drive
                      const gDriveMatch = url.match(/(?:id=|\/d\/)([a-zA-Z0-9_-]{25,})/);
                      if (gDriveMatch && gDriveMatch[1]) {
                        return (
                          <iframe 
                            src={`https://drive.google.com/file/d/${gDriveMatch[1]}/preview`} 
                            className="w-full h-full border-0 pointer-events-auto" 
                            allowFullScreen
                          />
                        );
                      }

                      // TikTok
                      if (url.includes('tiktok.com')) {
                        const videoIdMatch = url.match(/\/video\/(\d+)/);
                        if (videoIdMatch && videoIdMatch[1]) {
                          return (
                            <div className="w-full h-full relative flex items-center justify-center bg-black">
                              <iframe 
                                src={`https://www.tiktok.com/embed/v2/${videoIdMatch[1]}`}
                                className="w-full h-[100%] max-w-[500px] border-0 pointer-events-auto"
                                allowFullScreen
                              />
                            </div>
                          );
                        }
                        return (
                          <div className="w-full h-full relative flex items-center justify-center bg-black/80 text-white p-6 text-center text-sm">
                            Untuk memutar video TikTok, mohon gunakan link lengkap (misalnya: https://www.tiktok.com/@user/video/123456789). Link pendek (vt.tiktok.com) tidak dapat diputar langsung.
                          </div>
                        );
                      }

                      // Generic Player (YouTube, Facebook, etc)
                      if (url) {
                        return (
                          <Player 
                            url={url}
                            width="100%"
                            height="100%"
                            playing={true}
                            controls={true}
                            config={{
                              youtube: {
                                playerVars: { showinfo: 0, rel: 0, modestbranding: 1 }
                              }
                            }}
                          />
                        );
                      }

                      // Fallback if no URL
                      return (
                        <div className="w-full h-full relative flex items-center justify-center bg-black">
                          <img 
                            src={video.thumbnail} 
                            alt={video.title}
                            className="w-full h-full object-contain opacity-50"
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 text-center">
                            <Video size={48} className="mb-4 text-gray-500" />
                            <p className="text-gray-400">Video tidak memiliki tautan (URL) untuk diputar.</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
                
                <div className="mt-6 text-center px-8">
                  <h3 className="text-white text-xl md:text-2xl font-bold">{activeMediaArray[currentIndex].title}</h3>
                  {activeTab === 'video' && (
                    <p className="text-gray-400 mt-2">Durasi: {(activeMediaArray[currentIndex] as VideoData).duration}</p>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}
    </section>
  );
}

const fallbackPhotos: PhotoData[] = [
  { id: '1', title: "Kegiatan Pembinaan Kerukunan Umat Beragama", image: "https://images.unsplash.com/photo-1551041777-ed277b8ce348?auto=format&fit=crop&q=80" },
  { id: '2', title: "Rapat Koordinasi KUA Kecamatan", image: "https://images.unsplash.com/photo-1551041777-ed277b8ce348?auto=format&fit=crop&q=80" },
  { id: '3', title: "Pembinaan Madrasah", image: "https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&q=80" },
  { id: '4', title: "Peringatan Maulid Nabi", image: "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&q=80" }
];

const fallbackVideos: VideoData[] = [
  { id: '1', title: "Profil Kementerian Agama Kabupaten OKI", thumbnail: "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&q=80", duration: "05:24" },
  { id: '2', title: "Sosialisasi Layanan Sertifikasi Halal Gratis 2024", thumbnail: "https://images.unsplash.com/photo-1564683214965-3619addd900d?auto=format&fit=crop&q=80", duration: "12:10" }
];
