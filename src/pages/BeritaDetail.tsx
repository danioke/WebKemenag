import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Calendar, User, Share2, ArrowLeft, Tag } from 'lucide-react';
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
  slug?: string;
}

export default function BeritaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [berita, setBerita] = useState<Berita | null>(null);
  const [otherNews, setOtherNews] = useState<Berita[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        // First try to find by slug
        const slugQuery = query(collection(db, 'kemenag_news'), where('slug', '==', id));
        const slugSnap = await getDocs(slugQuery);
        
        let foundBerita = null;
        let foundId = id;
        
        if (!slugSnap.empty) {
          foundBerita = { id: slugSnap.docs[0].id, ...slugSnap.docs[0].data() } as Berita;
          foundId = slugSnap.docs[0].id;
        } else {
          // Fallback to fetch by ID
          const docRef = doc(db, 'kemenag_news', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            foundBerita = { id: docSnap.id, ...docSnap.data() } as Berita;
          }
        }

        if (foundBerita) {
          setBerita(foundBerita);
        }

        // Fetch other news (latest 4, excluding current)
        const q = query(collection(db, 'kemenag_news'), orderBy('createdAt', 'desc'), limit(5));
        const querySnapshot = await getDocs(q);
        const newsData = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Berita))
          .filter(item => item.id !== foundId)
          .slice(0, 4);
        setOtherNews(newsData);

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
          
          <div className="flex items-center gap-3 mb-4 mt-4 sm:mt-0 flex-wrap">
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
            <h3 className="text-xl font-bold text-gray-900 mb-6">Berita Lainnya</h3>
            <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {otherNews.map((item, idx) => (
                <Link 
                  key={item.id} 
                  to={`/berita/${item.slug || item.id}`}
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
