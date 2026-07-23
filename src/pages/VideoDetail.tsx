import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { db, doc, getDoc } from '../lib/db';
import { ArrowLeft, Play, ChevronRight } from 'lucide-react';
import ReactPlayer from 'react-player';
import { Helmet } from 'react-helmet-async';

const Player = ReactPlayer as any;

export default function VideoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideo = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'videos', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setVideo({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching video:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();
  }, [id]);

  const renderPlayer = (url: string) => {
    if (!url) return null;
    
    // Google Drive
    const gDriveMatch = url.match(/(?:id=|\/d\/)([a-zA-Z0-9_-]{25,})/);
    if (gDriveMatch && gDriveMatch[1]) {
      return (
        <iframe 
          src={`https://drive.google.com/file/d/${gDriveMatch[1]}/preview`} 
          className="w-full aspect-video rounded-xl shadow-lg border-0" 
          allowFullScreen
        />
      );
    }
    
    // TikTok
    if (url.includes('tiktok.com')) {
      const videoIdMatch = url.match(/\/video\/(\d+)/);
      if (videoIdMatch && videoIdMatch[1]) {
        return (
          <div className="flex justify-center">
            <iframe 
              src={`https://www.tiktok.com/embed/v2/${videoIdMatch[1]}`}
              className="w-full max-w-[400px] aspect-[9/16] rounded-xl shadow-lg border-0"
              allowFullScreen
            />
          </div>
        );
      }
      return (
        <div className="bg-gray-100 p-8 rounded-xl text-center text-gray-700">
          <p className="mb-4">Untuk memutar video TikTok, mohon gunakan link lengkap.</p>
          <a href={url} target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline">Buka di TikTok</a>
        </div>
      );
    }

        // Facebook Video Embed
    if (url.includes('facebook.com') || url.includes('fb.watch') || url.includes('fb.gg')) {
      const embedSrc = url.includes('facebook.com/plugins/video.php')
        ? url
        : `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=true`;
      return (
        <div className="w-full aspect-video rounded-xl overflow-hidden shadow-lg bg-black flex items-center justify-center">
          <iframe 
            src={embedSrc}
            className="w-full h-full border-0"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          />
        </div>
      );
    }

    // Default (YouTube, direct MP4, etc)
    return (
      <div className="rounded-xl overflow-hidden shadow-lg aspect-video bg-black">
        <Player 
          url={url}
          width="100%"
          height="100%"
          controls={true}
          config={{
            youtube: {
              playerVars: { showinfo: 0, rel: 0, modestbranding: 1 }
            }
          }}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-grow pt-24 pb-12 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-grow pt-24 pb-12 text-center flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Video tidak ditemukan</h2>
          <button onClick={() => navigate('/galeri-video')} className="text-emerald-700 hover:underline flex items-center gap-2">
            <ArrowLeft size={16} /> Kembali ke Galeri
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Helmet>
        <title>{video.title} | Kemenag OKI</title>
      </Helmet>
      <Header />
      <main className="flex-grow pt-28 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 mb-6 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <button 
              onClick={() => navigate('/')} 
              className="hover:text-emerald-700 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft size={14} className="sm:hidden mr-1" />
              <span className="hidden sm:inline">Beranda</span>
              <span className="sm:hidden">Kembali</span>
            </button>
            <ChevronRight size={14} className="text-gray-400 shrink-0 hidden sm:block" />
            <button 
              onClick={() => navigate('/galeri-video')} 
              className="hover:text-emerald-700 transition-colors hidden sm:block"
            >
              Galeri Video
            </button>
            <ChevronRight size={14} className="text-gray-400 shrink-0 hidden sm:block" />
            <span className="text-gray-900 font-medium truncate max-w-[150px] sm:max-w-[300px] hidden sm:block">
              {video.title}
            </span>
          </nav>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">{video.title}</h1>
            
            <div className="w-full mb-8">
              {renderPlayer(video.videoUrl)}
            </div>
            
            <div className="flex flex-wrap items-center text-sm text-gray-500 gap-4 border-t pt-4">
              {video.duration && (
                <span className="font-medium bg-gray-100 px-3 py-1 rounded-full">
                  Durasi: {video.duration}
                </span>
              )}
              <span>Diunggah pada {video.createdAt ? new Date(video.createdAt.seconds * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
