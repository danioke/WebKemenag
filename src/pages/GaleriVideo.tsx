import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Play, VolumeX, Volume2, Search } from 'lucide-react';
import { db, collection, getDocs, orderBy, query } from '../lib/db';
import ReactPlayer from 'react-player';
const Player = ReactPlayer as any;

interface VideoData {
  id: string;
  title: string;
  duration?: string;
  videoUrl: string;
}

export default function GaleriVideo() {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Track which video is currently in view
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoData));
        setVideos(docs);
      } catch (error) {
        console.error("Error fetching videos:", error);
        // Add some dummy if needed, but let's keep it empty for real data
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  const filteredVideos = videos.filter(video => 
    video.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle scroll snapping detection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollPosition = container.scrollTop;
      const windowHeight = container.clientHeight;
      const activeIndex = Math.round(scrollPosition / windowHeight);
      
      if (activeIndex !== activeVideoIndex) {
        setActiveVideoIndex(activeIndex);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeVideoIndex, filteredVideos]);

  const [isPlaying, setIsPlaying] = useState(true);

  // Reset play state when changing videos
  useEffect(() => {
    setIsPlaying(true);
  }, [activeVideoIndex]);

  const toggleMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsMuted(!isMuted);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const renderVideoPlayer = (video: VideoData, isActive: boolean) => {
    const url = video.videoUrl || '';
    
    // Google Drive
    const gDriveMatch = url.match(/(?:id=|\/d\/)([a-zA-Z0-9_-]{25,})/);
    if (gDriveMatch && gDriveMatch[1]) {
      return (
        <div className="w-full h-full relative">
          <iframe 
            src={`https://drive.google.com/file/d/${gDriveMatch[1]}/preview`} 
            className="w-full h-full border-0 pointer-events-auto" 
            allowFullScreen
          />
        </div>
      );
    }

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

    return (
      <div className="w-full h-full relative cursor-pointer" onClick={togglePlay}>
        <div className="w-full h-full pointer-events-none">
          {/* @ts-ignore */}
          <Player 
            url={url}
            width="100%"
            height="100%"
            playing={isActive && isPlaying}
            loop={true}
            muted={isMuted}
            controls={false}
            playsinline={true}
            style={{ objectFit: 'contain' }}
            config={{
              youtube: {
                playerVars: { showinfo: 0, rel: 0, modestbranding: 1, controls: 0 }
              },
              file: {
                attributes: {
                  style: { width: '100%', height: '100%', objectFit: 'contain' },
                  playsInline: true
                }
              }
            }}
          />
        </div>
        {/* Play overlay for interaction hint */}
        {isActive && !isPlaying && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
             <Play className="text-white drop-shadow-lg opacity-80" size={72} fill="currentColor" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-black overflow-hidden">
      <Header />
      
      <main className="flex-grow pt-24 pb-0 relative h-screen flex flex-col items-center">
        {/* Header / Search Overlay */}
        <div className="absolute top-24 left-0 right-0 z-20 px-4 py-4 flex justify-between items-center max-w-md mx-auto w-full pointer-events-auto">
          <h1 className="text-white font-bold text-xl drop-shadow-md">Galeri Video</h1>
          <div className="relative w-1/2">
            <input 
              type="text" 
              placeholder="Cari..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/20 backdrop-blur-md text-white placeholder:text-white/70 border border-white/30 rounded-full py-1.5 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition-all"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/70" size={14} />
          </div>
        </div>

        {/* Scroll Container */}
        {loading ? (
          <div className="w-full h-full flex items-center justify-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        ) : filteredVideos.length > 0 ? (
          <div 
            ref={containerRef}
            className="w-full max-w-[500px] h-[calc(100vh-6rem)] mx-auto overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar pb-16"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {filteredVideos.map((video, index) => {
              const isActive = index === activeVideoIndex;
              return (
                <div key={video.id} className="w-full h-full snap-start relative bg-black flex items-center justify-center border-b border-gray-800">
                  {/* Video Player */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {renderVideoPlayer(video, isActive)}
                  </div>

                  {/* Right Side Actions / Overlay */}
                  <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-20">
                    <button className="w-12 h-12 bg-gray-800/60 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-gray-600/50 hover:bg-gray-700/80 transition-colors" onClick={toggleMute}>
                      {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                  </div>

                  {/* Bottom Info Overlay */}
                  <div className="absolute bottom-4 left-0 right-16 p-4 z-20 pointer-events-none">
                    <h2 className="text-white font-bold text-lg leading-tight mb-2 drop-shadow-md">
                      {video.title}
                    </h2>
                    {video.duration && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-black/50 text-white backdrop-blur-sm border border-white/20">
                        {video.duration}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/50">
            {videos.length === 0 ? "Data belum tersedia" : "Tidak ada video yang cocok."}
          </div>
        )}
      </main>
      
      {/* Footer can be hidden on video scroll, or we can leave it at the very bottom outside scroll */}
    </div>
  );
}
