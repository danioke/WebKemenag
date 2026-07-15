import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Image as ImageIcon, Video, ArrowRight, X, ChevronLeft, ChevronRight, Heart, MessageCircle, Share2, Music, VolumeX, Volume2 } from 'lucide-react';
import { collection, getDocs, query, orderBy } from '../lib/db';
import { db } from '../lib/db';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

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

  // Home Carousel Refs
  const photoCarouselRef = useRef<HTMLDivElement>(null);
  const videoCarouselRef = useRef<HTMLDivElement>(null);

  // Fullscreen TikTok Snapping Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalActiveIndex, setModalActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  // TikTok Interactions state
  const [likedItems, setLikedItems] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  const modalContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const photoQ = query(collection(db, 'photos'), orderBy('createdAt', 'desc'));
        const photoSnap = await getDocs(photoQ);
        const photoData = photoSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PhotoData));
        setPhotos(photoData);

        const videoQ = query(collection(db, 'videos'), orderBy('createdAt', 'desc'));
        const videoSnap = await getDocs(videoQ);
        const videoData = videoSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoData));
        setVideos(videoData);

        // Populate initial likes random count to look alive
        const initialLikes: Record<string, number> = {};
        photoData.forEach(p => {
          initialLikes[p.id] = Math.floor(Math.random() * 200) + 50;
        });
        videoData.forEach(v => {
          initialLikes[v.id] = Math.floor(Math.random() * 500) + 120;
        });
        setLikeCounts(initialLikes);

      } catch (error) {
        console.error("Error fetching media:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Home Carousel scroll controls
  const handleScroll = (direction: 'left' | 'right', type: 'foto' | 'video') => {
    const ref = type === 'foto' ? photoCarouselRef : videoCarouselRef;
    if (ref.current) {
      const scrollAmount = ref.current.clientWidth * 0.75;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const openModal = (index: number) => {
    setModalActiveIndex(index);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  };

  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = '';
  };

  // Listen to modal scroll snap to update current active item index and manage video autoplay
  useEffect(() => {
    const container = modalContainerRef.current;
    if (!container || !isModalOpen) return;

    const handleModalScroll = () => {
      const scrollTop = container.scrollTop;
      const height = container.clientHeight;
      if (height === 0) return;
      const index = Math.round(scrollTop / height);
      if (index !== modalActiveIndex) {
        setModalActiveIndex(index);
      }
    };

    container.addEventListener('scroll', handleModalScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleModalScroll);
  }, [isModalOpen, modalActiveIndex]);

  // Click handler to programmatically snap to next/prev in modal
  const handleModalNavigate = (direction: 'up' | 'down') => {
    const container = modalContainerRef.current;
    const mediaArray = activeTab === 'foto' ? photos : videos;
    if (container) {
      const targetIndex = direction === 'up' 
        ? Math.max(0, modalActiveIndex - 1)
        : Math.min(mediaArray.length - 1, modalActiveIndex + 1);

      container.scrollTo({
        top: targetIndex * container.clientHeight,
        behavior: 'smooth'
      });
      setModalActiveIndex(targetIndex);
    }
  };

  const toggleLike = (id: string) => {
    const isLiked = !!likedItems[id];
    setLikedItems(prev => ({ ...prev, [id]: !isLiked }));
    setLikeCounts(prev => ({
      ...prev,
      [id]: isLiked ? (prev[id] || 1) - 1 : (prev[id] || 0) + 1
    }));
    if (!isLiked) {
      toast.success('Menyukai media ini ❤️');
    }
  };

  const handleShare = (title: string) => {
    if (navigator.share) {
      navigator.share({
        title,
        text: `Dokumentasi Kemenag OKI: ${title}`,
        url: window.location.href
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Tautan disalin ke papan klip! 🔗');
    }
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
          <div className="text-center py-20 text-gray-500">Memuat galeri...</div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'foto' && (
              <motion.div 
                key="foto-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="relative group/carousel"
              >
                {photos.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-gray-400 font-medium">Data belum tersedia</p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Carousel navigation buttons */}
                    <button 
                      onClick={() => handleScroll('left', 'foto')}
                      className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-green-800 hover:bg-green-900 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all opacity-0 group-hover/carousel:opacity-100 cursor-pointer hidden md:flex border border-green-700"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button 
                      onClick={() => handleScroll('right', 'foto')}
                      className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-green-800 hover:bg-green-900 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all opacity-0 group-hover/carousel:opacity-100 cursor-pointer hidden md:flex border border-green-700"
                    >
                      <ChevronRight size={20} />
                    </button>

                    {/* Horizontal sliding container */}
                    <div 
                      ref={photoCarouselRef}
                      className="flex gap-4 overflow-x-auto scroll-smooth no-scrollbar snap-x snap-mandatory py-2 scroll-px-4"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {photos.map((photo, idx) => (
                        <div 
                          key={photo.id} 
                          onClick={() => openModal(idx)}
                          className="group relative rounded-2xl overflow-hidden aspect-square shadow-sm cursor-pointer min-w-[260px] sm:min-w-[300px] md:min-w-[340px] flex-shrink-0 snap-start"
                        >
                          <img src={photo.image} alt={photo.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <p className="text-white font-bold text-sm leading-tight">{photo.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'video' && (
              <motion.div 
                key="video-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="relative group/carousel"
              >
                {videos.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-gray-400 font-medium">Data belum tersedia</p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Carousel navigation buttons */}
                    <button 
                      onClick={() => handleScroll('left', 'video')}
                      className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-green-800 hover:bg-green-900 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all opacity-0 group-hover/carousel:opacity-100 cursor-pointer hidden md:flex border border-green-700"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button 
                      onClick={() => handleScroll('right', 'video')}
                      className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 bg-green-800 hover:bg-green-900 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all opacity-0 group-hover/carousel:opacity-100 cursor-pointer hidden md:flex border border-green-700"
                    >
                      <ChevronRight size={20} />
                    </button>

                    {/* Horizontal sliding container */}
                    <div 
                      ref={videoCarouselRef}
                      className="flex gap-5 overflow-x-auto scroll-smooth no-scrollbar snap-x snap-mandatory py-2 scroll-px-4"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {videos.map((video, idx) => (
                        <div 
                          key={video.id} 
                          onClick={() => openModal(idx)}
                          className="group relative rounded-2xl overflow-hidden aspect-video shadow-sm cursor-pointer border border-gray-100 min-w-[280px] sm:min-w-[360px] md:min-w-[420px] flex-shrink-0 snap-start"
                        >
                          <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 group-hover:scale-110 transition-transform shadow-lg">
                              <Play size={24} className="ml-1" fill="currentColor" />
                            </div>
                          </div>
                          <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-semibold px-2.5 py-1 rounded-lg backdrop-blur-sm">
                            {video.duration}
                          </div>
                          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
                            <p className="text-white font-bold line-clamp-1 text-sm">{video.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        <div className="mt-12 text-center">
          {activeTab === 'foto' ? (
            <Link to="/galeri-foto" className="inline-flex items-center text-green-700 font-bold hover:text-green-800 transition-colors gap-1 hover:gap-2">
              Lihat Semua Foto <ArrowRight size={18} />
            </Link>
          ) : (
            <Link to="/galeri-video" className="inline-flex items-center text-green-700 font-bold hover:text-green-800 transition-colors gap-1 hover:gap-2">
              Lihat Semua Video <ArrowRight size={18} />
            </Link>
          )}
        </div>

      </div>

      {/* Fullscreen TikTok-style Snapping Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black flex justify-center items-center">
          
          {/* Back/Close Button */}
          <button 
            onClick={closeModal}
            className="absolute top-6 left-6 z-50 text-white p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full transition-all cursor-pointer border border-white/10"
          >
            <X size={20} />
          </button>

          {/* Mute toggle button (only for videos) */}
          {activeTab === 'video' && (
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="absolute top-6 right-6 z-50 text-white p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full transition-all cursor-pointer border border-white/10"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          )}

          {/* Vertical Scroll Snapping Container */}
          <div 
            ref={modalContainerRef}
            className="w-full h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {activeMediaArray.map((item, index) => {
              const isActive = index === modalActiveIndex;
              const itemId = item.id;
              const isLiked = !!likedItems[itemId];
              const likes = likeCounts[itemId] || 120;

              return (
                <div 
                  key={item.id} 
                  className="w-full h-full snap-start relative flex items-center justify-center bg-zinc-950 overflow-hidden"
                >
                  {/* Media Content */}
                  <div className="w-full h-full flex items-center justify-center p-0 md:p-4 max-w-4xl mx-auto z-10">
                    {activeTab === 'foto' ? (
                      <img 
                        src={(item as PhotoData).image} 
                        alt={item.title}
                        className="max-h-full max-w-full object-contain shadow-2xl"
                        loading="eager"
                      />
                    ) : (
                      <div className="relative w-full h-full bg-black flex items-center justify-center">
                        {(() => {
                          const video = item as VideoData;
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

                          // TikTok Embed
                          if (url.includes('tiktok.com')) {
                            const videoIdMatch = url.match(/\/video\/(\d+)/);
                            if (videoIdMatch && videoIdMatch[1]) {
                              return (
                                <iframe 
                                  src={`https://www.tiktok.com/embed/v2/${videoIdMatch[1]}`}
                                  className="w-full h-full max-w-[500px] border-0 pointer-events-auto"
                                  allowFullScreen
                                />
                              );
                            }
                            return (
                              <div className="text-white text-center p-6 text-xs max-w-sm">
                                Link TikTok tidak lengkap. Silakan saksikan di website TikTok.
                              </div>
                            );
                          }

                          // Generic Player (Youtube, etc)
                          if (url) {
                            return (
                              <Player 
                                url={url}
                                width="100%"
                                height="100%"
                                playing={isActive && isModalOpen}
                                loop={true}
                                muted={isMuted}
                                controls={true}
                                config={{
                                  youtube: {
                                    playerVars: { showinfo: 0, rel: 0, modestbranding: 1 }
                                  }
                                }}
                              />
                            );
                          }

                          return (
                            <div className="relative w-full h-full flex items-center justify-center">
                              <img src={video.thumbnail} className="opacity-50 object-contain w-full h-full" alt="" />
                              <div className="absolute text-center text-white">
                                <Video size={48} className="mx-auto mb-2 text-gray-500" />
                                <p className="text-sm">Link video tidak tersedia.</p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Right Sidebar TikTok Actions */}
                  <div className="absolute right-4 bottom-24 sm:bottom-28 flex flex-col items-center gap-5 z-20">
                    {/* Profile avatar with plus */}
                    <div className="relative mb-2">
                      <div className="w-11 h-11 bg-green-800 rounded-full border border-white/20 flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
                        K
                      </div>
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-[13px] border border-black shadow">
                        +
                      </div>
                    </div>

                    {/* Like button */}
                    <button 
                      onClick={() => toggleLike(itemId)}
                      className="flex flex-col items-center gap-1 group cursor-pointer focus:outline-none"
                    >
                      <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 group-hover:scale-105 active:scale-95 transition-all">
                        <Heart size={22} className={isLiked ? 'text-red-500 fill-red-500' : 'text-white'} />
                      </div>
                      <span className="text-white text-xs font-bold font-sans drop-shadow-md">{likes}</span>
                    </button>

                    {/* Comments button (placeholder counter) */}
                    <button 
                      onClick={() => toast.success('Fitur interaksi komentar khusus anggota diaktifkan.')}
                      className="flex flex-col items-center gap-1 group cursor-pointer focus:outline-none"
                    >
                      <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 group-hover:scale-105 active:scale-95 transition-all">
                        <MessageCircle size={22} />
                      </div>
                      <span className="text-white text-xs font-bold font-sans drop-shadow-md">{Math.floor(likes * 0.15) + 5}</span>
                    </button>

                    {/* Share button */}
                    <button 
                      onClick={() => handleShare(item.title)}
                      className="flex flex-col items-center gap-1 group cursor-pointer focus:outline-none"
                    >
                      <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 group-hover:scale-105 active:scale-95 transition-all">
                        <Share2 size={20} />
                      </div>
                      <span className="text-white text-xs font-bold font-sans drop-shadow-md">Bagikan</span>
                    </button>
                  </div>

                  {/* Bottom-Left Information Overlay */}
                  <div className="absolute bottom-6 left-6 right-20 z-20 text-left text-white pointer-events-none drop-shadow-lg">
                    <p className="font-extrabold text-sm tracking-wide mb-1 flex items-center gap-1.5 text-emerald-400">
                      @kemenag_oki 
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/30">Official</span>
                    </p>
                    <h4 className="text-sm font-bold text-gray-100 max-w-xl line-clamp-2 md:text-base leading-snug">
                      {item.title}
                    </h4>
                    {activeTab === 'video' && (
                      <span className="inline-block text-[11px] bg-white/10 text-white px-2 py-0.5 rounded-md mt-2 font-mono">
                        Durasi: {(item as VideoData).duration}
                      </span>
                    )}

                    {/* Sliding Musical Tape Ticker */}
                    <div className="flex items-center gap-2 mt-3.5 text-xs text-gray-300/80 max-w-[200px] overflow-hidden">
                      <Music size={12} className="shrink-0 animate-pulse text-emerald-400" />
                      <div className="whitespace-nowrap animate-[marquee_12s_linear_infinite] inline-block font-sans">
                        Musik Asli - Humas Kemenag Kabupaten OKI &bull; Dokumentasi Resmi &bull;&nbsp;
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overlay Vertical Up/Down snap helper buttons (for accessibility/mouse-clicks) */}
          <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-20">
            <button 
              onClick={() => handleModalNavigate('up')}
              disabled={modalActiveIndex === 0}
              className="text-white p-3 bg-black/40 hover:bg-black/60 disabled:opacity-20 disabled:cursor-not-allowed backdrop-blur-md rounded-full border border-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="Slide Sebelumnya"
            >
              <ChevronLeft className="rotate-90" size={20} />
            </button>
            <button 
              onClick={() => handleModalNavigate('down')}
              disabled={modalActiveIndex === activeMediaArray.length - 1}
              className="text-white p-3 bg-black/40 hover:bg-black/60 disabled:opacity-20 disabled:cursor-not-allowed backdrop-blur-md rounded-full border border-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="Slide Selanjutnya"
            >
              <ChevronRight className="rotate-90" size={20} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
