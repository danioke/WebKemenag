import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { db, doc, getDoc } from '../lib/db';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, ChevronRight } from 'lucide-react';
import ReactPlayer from 'react-player';
import { Helmet } from 'react-helmet-async';

const Player = ReactPlayer as any;

export default function VideoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [playerAspect, setPlayerAspect] = useState<'auto' | 'landscape' | 'portrait'>('auto');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const fetchVideo = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'videos', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const videoData = { id: docSnap.id, ...docSnap.data() };
          setVideo(videoData);

          import('../lib/visitor').then(({ recordVisitorView }) => {
            recordVisitorView({
              contentId: videoData.id,
              title: videoData.title || "Video Humas Kemenag OKI",
              contentType: 'Video'
            });
          });
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

    // Facebook Video / Reel Embed
    if (url.includes('facebook.com') || url.includes('fb.watch') || url.includes('fb.gg')) {
      let cleanFbUrl = url;
      if (url.includes('facebook.com/plugins/video.php')) {
        try {
          const urlObj = new URL(url);
          const hrefParam = urlObj.searchParams.get('href');
          if (hrefParam) cleanFbUrl = decodeURIComponent(hrefParam);
        } catch (e) {
          // fallback
        }
      }

      const isReelUrl = cleanFbUrl.toLowerCase().includes('/reel/') || 
                        cleanFbUrl.toLowerCase().includes('/reels/') || 
                        cleanFbUrl.toLowerCase().includes('/share/r/') || 
                        cleanFbUrl.toLowerCase().includes('reel');
      
      const isPortrait = playerAspect === 'portrait' || (playerAspect === 'auto' && isReelUrl);

      if (Player && typeof Player.canPlay === 'function' && Player.canPlay(cleanFbUrl)) {
        return (
          <div className="flex flex-col items-center w-full space-y-4">
            {/* Controls toolbar */}
            <div className="flex flex-wrap items-center justify-between w-full gap-2 text-xs bg-gray-100 p-2 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-bold hover:bg-emerald-800 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  <span>{isPlaying ? 'Jeda Video' : 'Putar Video'}</span>
                </button>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isMuted ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
                  }`}
                >
                  {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  <span>{isMuted ? 'Suara Senyap (Muted)' : 'Suara Aktif'}</span>
                </button>
              </div>

              {/* Format Switcher */}
              <div className="flex items-center gap-1">
                <span className="text-gray-500 font-medium px-1 hidden sm:inline">Format:</span>
                <button
                  onClick={() => setPlayerAspect('landscape')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${!isPortrait ? 'bg-white text-emerald-800 shadow-sm border border-emerald-200' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Horizontal (16:9)
                </button>
                <button
                  onClick={() => setPlayerAspect('portrait')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${isPortrait ? 'bg-white text-emerald-800 shadow-sm border border-emerald-200' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Tegak / Reel (9:16)
                </button>
              </div>
            </div>

            <div 
              className={`w-full rounded-2xl overflow-hidden shadow-xl bg-black flex items-center justify-center border border-gray-800 transition-all duration-300 relative ${
                isPortrait 
                  ? 'max-w-[420px] aspect-[9/16] h-[640px] max-h-[80vh]' 
                  : 'w-full aspect-video'
              }`}
            >
              <Player 
                url={cleanFbUrl}
                width="100%"
                height="100%"
                playing={isPlaying}
                muted={isMuted}
                controls={true}
              />
            </div>
          </div>
        );
      }

      const embedSrc = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(cleanFbUrl)}&show_text=false&autoplay=${isPlaying ? 'true' : 'false'}&muted=${isMuted ? 'true' : 'false'}&mute=${isMuted ? '1' : '0'}`;

      return (
        <div className="flex flex-col items-center w-full space-y-4">
          {/* Controls toolbar */}
          <div className="flex flex-wrap items-center justify-between w-full gap-2 text-xs bg-gray-100 p-2 rounded-xl border border-gray-200">
            {/* Play/Pause & Mute Toggles */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-bold hover:bg-emerald-800 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                <span>{isPlaying ? 'Jeda Video' : 'Putar Video'}</span>
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isMuted ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
                }`}
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                <span>{isMuted ? 'Suara Senyap (Muted)' : 'Suara Aktif'}</span>
              </button>
            </div>

            {/* Format Switcher */}
            <div className="flex items-center gap-1">
              <span className="text-gray-500 font-medium px-1 hidden sm:inline">Format:</span>
              <button
                onClick={() => setPlayerAspect('landscape')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${!isPortrait ? 'bg-white text-emerald-800 shadow-sm border border-emerald-200' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Horizontal (16:9)
              </button>
              <button
                onClick={() => setPlayerAspect('portrait')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${isPortrait ? 'bg-white text-emerald-800 shadow-sm border border-emerald-200' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Tegak / Reel (9:16)
              </button>
            </div>
          </div>

          <div 
            className={`w-full rounded-2xl overflow-hidden shadow-xl bg-black flex items-center justify-center border border-gray-800 transition-all duration-300 ${
              isPortrait 
                ? 'max-w-[420px] aspect-[9/16] h-[640px] max-h-[80vh]' 
                : 'w-full aspect-video'
            }`}
          >
            <iframe 
              key={`${cleanFbUrl}-${isMuted}-${isPlaying}`}
              src={embedSrc}
              className="w-full h-full border-0"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            />
          </div>
        </div>
      );
    }

    // Default (YouTube, direct MP4, etc)
    return (
      <div className="flex flex-col items-center w-full space-y-4">
        {/* Controls Toolbar for YouTube / Direct Video */}
        <div className="flex items-center justify-between w-full gap-2 text-xs bg-gray-100 p-2 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-bold hover:bg-emerald-800 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              <span>{isPlaying ? 'Jeda Video' : 'Putar Video'}</span>
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isMuted ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
              }`}
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              <span>{isMuted ? 'Suara Senyap (Muted)' : 'Suara Aktif'}</span>
            </button>
          </div>
          <span className="text-[11px] text-gray-500 italic hidden sm:inline">Pemutar Otomatis Terhubung</span>
        </div>

        <div className="w-full rounded-2xl overflow-hidden shadow-lg aspect-video bg-black border border-gray-800">
          <Player 
            url={url}
            width="100%"
            height="100%"
            playing={isPlaying}
            muted={isMuted}
            controls={true}
            config={{
              youtube: {
                playerVars: { 
                  autoplay: isPlaying ? 1 : 0, 
                  mute: isMuted ? 1 : 0,
                  showinfo: 0, 
                  rel: 0, 
                  modestbranding: 1 
                }
              }
            }}
          />
        </div>
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
