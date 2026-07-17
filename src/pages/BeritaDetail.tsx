import { createSlug } from "../lib/helpers";
import { formatIndonesianDate } from "../lib/utils";
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, limit, getDocs, where } from '../lib/db';
import { db } from '../lib/db';
import { Calendar, User, Share2, ArrowLeft, Tag, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';

interface Berita {
  id: string;
  title: string;
  category: string;
  date: string;
  author: string;
  image: string;
  excerpt: string;
  views?: number;
}

function formatBeritaDateTime(dateString: string | undefined): string {
  if (!dateString) return '';
  
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const dateObj = new Date(dateString);
  if (isNaN(dateObj.getTime())) {
    return `Kamis, ${dateString} | 09:33 WIB`;
  }
  
  const dayName = days[dateObj.getDay()];
  const dateNum = dateObj.getDate();
  const monthName = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  
  let finalHours = hours;
  let finalMinutes = minutes;
  if (hours === '00' && minutes === '00') {
    finalHours = '09';
    finalMinutes = '33';
  }
  
  return `${dayName}, ${dateNum} ${monthName} ${year} | ${finalHours}:${finalMinutes} WIB`;
}

export default function BeritaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [berita, setBerita] = useState<Berita | null>(null);
  const [otherNews, setOtherNews] = useState<Berita[]>([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const q = query(collection(db, 'news'));
        const querySnapshot = await getDocs(q);
        
        let foundDoc = null;
        for (const d of querySnapshot.docs) {
          if (d.id === id || createSlug(d.data().title) === id) {
            foundDoc = { id: d.id, ...d.data() } as Berita;
            break;
          }
        }
        
        if (foundDoc) {
          setBerita(foundDoc);
          import('../lib/db').then(({ updateDoc, doc }) => {
            updateDoc(doc(db, 'news', foundDoc.id), {
              views: (foundDoc.views || 0) + 1
            }).catch(e => console.error("Error updating views", e));
          });
          
          // Fetch other news (latest 5, excluding current)
          const otherQ = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
          const otherSnap = await getDocs(otherQ);
          const newsData = otherSnap.docs
            .map(d => ({ id: d.id, ...d.data() } as Berita))
            .filter(item => item.id !== foundDoc?.id)
            .slice(0, 5);
          setOtherNews(newsData);
        }

      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: berita?.title,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link disalin ke clipboard');
    }
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 340; // width of card + gap
      carouselRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
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
          <p className="text-gray-500">Memuat berita...</p>
        </div>
      </div>
    );
  }

  if (!berita) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <div className="bg-white px-4 py-4 border-b border-gray-100 flex items-center sticky top-0 z-50">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
        </div>
        <div className="flex-grow flex flex-col items-center justify-center p-4">
          <p className="text-gray-500 mb-4">Berita tidak ditemukan.</p>
          <Link to="/" className="text-green-700 font-semibold hover:underline flex items-center gap-2">
            <ArrowLeft size={16} /> Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Helmet>
        <title>{berita.title} | Kemenag OKI</title>
        <meta name="description" content={berita.title} />
        <meta property="og:title" content={berita.title} />
        <meta property="og:description" content={berita.title} />
        {berita.image && <meta property="og:image" content={berita.image} />}
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="article" />
      </Helmet>

      {/* Mobile-style Top Nav Bar */}
      <div className="bg-white px-4 py-4 border-b border-gray-100 flex items-center sticky top-0 z-50 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors mr-3">
          <ArrowLeft size={24} />
        </button>
        <h2 className="font-semibold text-gray-900 truncate flex-1">Berita</h2>
        <button onClick={handleShare} className="p-2 -mr-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
          <Share2 size={20} />
        </button>
      </div>

      <main className="flex-grow py-6 sm:py-12">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white sm:p-10 rounded-none sm:rounded-2xl sm:shadow-sm sm:border sm:border-gray-100 pb-10">
          
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-green-700 text-white font-bold rounded text-xs uppercase tracking-wider">
              {berita.category}
            </span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight mt-2">
            {berita.title}
          </h1>

          {/* Author, Date, and Views Box */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 mb-8 bg-gray-50 border border-gray-100 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center border border-white shadow-sm shrink-0">
                <User size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-sm sm:text-base leading-tight">
                  {berita.author || 'Tim Humas Kemenag OKI'}
                </h3>
                <p className="text-gray-500 text-xs sm:text-sm mt-1 flex items-center">
                  {formatBeritaDateTime(berita.date)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center px-3 py-1.5 bg-white border border-gray-200/60 rounded-lg text-xs text-emerald-800 font-semibold shadow-sm">
              <Eye size={14} className="text-emerald-600" />
              <span>{berita.views || 0} kali dibaca</span>
            </div>
          </div>

          {berita.image && (
            <div className="mb-10 rounded-xl overflow-hidden shadow-sm aspect-video bg-gray-100 relative">
              <img src={berita.image} alt={berita.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="overflow-x-auto">
            <div 
              className="prose prose-lg prose-green max-w-none prose-img:rounded-xl prose-img:max-w-full text-gray-700 leading-relaxed break-words"
              dangerouslySetInnerHTML={{ __html: berita.excerpt }}
            />
          </div>
        </article>

        {/* Berita Lainnya - Carousel/Horizontal Scroll */}
        {otherNews.length > 0 && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Berita Lainnya</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => scrollCarousel('left')}
                  className="p-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm text-gray-600"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => scrollCarousel('right')}
                  className="p-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm text-gray-600"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
            
            <div 
              ref={carouselRef}
              className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory scrollbar-hide" 
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {otherNews.map((item, idx) => (
                <Link 
                  key={item.id} 
                  to={`/berita/${createSlug(item.title)}`}
                  className="snap-start shrink-0 w-[280px] sm:w-[320px] bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 transition-all group flex flex-col"
                >
                  <div className="relative overflow-hidden aspect-[16/10] bg-gray-100">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200"></div>
                    )}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-green-800 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                      {item.category}
                    </div>
                  </div>
                  
                  <div className="p-4 flex flex-col flex-grow">
                    <h4 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-green-700 transition-colors">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-auto">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {formatIndonesianDate(item.date)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
