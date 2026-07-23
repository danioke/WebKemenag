import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Play, Search, Video } from 'lucide-react';
import { db, collection, getDocs, orderBy, query } from '../lib/db';
import { Helmet } from 'react-helmet-async';
import { getYouTubeThumbnail } from '../lib/helpers';

interface VideoData {
  id: string;
  title: string;
  thumbnail?: string;
  duration?: string;
  videoUrl: string;
}

export default function GaleriVideo() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoData));
        setVideos(docs);
      } catch (error) {
        console.error("Error fetching videos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  const filteredVideos = videos.filter(video => 
    video.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Helmet>
        <title>Galeri Video | Kemenag OKI</title>
      </Helmet>
      <Header />
      
      <main className="flex-grow pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Galeri Video</h1>
              <p className="text-gray-600">Dokumentasi video kegiatan Kementerian Agama Kabupaten Ogan Komering Ilir.</p>
            </div>
            <div className="relative max-w-sm w-full">
              <input 
                type="text" 
                placeholder="Cari video..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow bg-white shadow-sm"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div>
              <p className="mt-4 text-gray-500 font-medium">Memuat galeri video...</p>
            </div>
          ) : filteredVideos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video) => (
                <div 
                  key={video.id} 
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100 group flex flex-col"
                  onClick={() => navigate(`/galeri-video/${video.id}`)}
                >
                  <div className="aspect-video bg-gray-900 relative flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                    
                    {(video.thumbnail || getYouTubeThumbnail(video.videoUrl)) && (
                      <img 
                        src={video.thumbnail || getYouTubeThumbnail(video.videoUrl) || undefined} 
                        alt={video.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    
                    {/* Play Button Overlay */}
                    <div className="z-20 w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 group-hover:bg-red-600/90 transition-all duration-300">
                      <Play className="text-white ml-1" size={28} fill="currentColor" />
                    </div>
                    
                    {video.duration && (
                      <div className="absolute bottom-3 right-3 z-20 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded font-medium">
                        {video.duration}
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                      {video.title}
                    </h3>
                    <div className="mt-4 flex items-center text-xs text-gray-500 font-medium">
                      <Video size={14} className="mr-1.5" />
                      <span>Video Dokumentasi</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <Video className="mx-auto text-gray-300 mb-4" size={48} />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Video Tidak Ditemukan</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {videos.length === 0 
                  ? "Belum ada video yang diunggah ke galeri." 
                  : "Tidak ada video yang cocok dengan kata kunci pencarian Anda."}
              </p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
