import { createSlug } from "../lib/helpers";
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
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
          import('firebase/firestore').then(({ updateDoc, doc }) => {
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
          
          <div className="mb-4 mt-4 sm:mt-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold uppercase tracking-wide">
              <Tag size={12} /> {berita.category}
            </span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {berita.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8 border-b border-gray-100 pb-6">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              <span>{berita.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <User size={16} className="text-gray-400" />
              <span>{berita.author || 'Admin'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-gray-400" />
              <span>{berita.views || 0} kali dibaca</span>
            </div>
          </div>

          {berita.image && (
            <div className="mb-10 rounded-xl overflow-hidden shadow-sm aspect-video bg-gray-100">
              <img src={berita.image} alt={berita.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div 
            className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: berita.excerpt }}
          />
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
                      <span className="flex items-center gap-1"><Calendar size={12} /> {item.date}</span>
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
