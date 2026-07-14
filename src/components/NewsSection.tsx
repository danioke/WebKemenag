import { createSlug } from "../lib/helpers";
import { formatIndonesianDate } from "../lib/utils";
import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, User, ArrowRight, Eye } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from '../lib/db';
import { Link } from 'react-router-dom';
import { db } from '../lib/db';

interface NewsData {
  id: string;
  title: string;
  category: string;
  date: string;
  author: string;
  image: string;
  excerpt: string;
  views?: number;
}

const stripHtml = (html: string) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8211;/g, '-')
    .replace(/&#8217;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
};

export default function NewsSection() {
  const [news, setNews] = useState<NewsData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'), limit(5));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as NewsData[];
        
        if (data.length > 0) {
          setNews(data);
        } else {
          setNews([]);
        }
      } catch (error) {
        console.error("Error fetching news:", error);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="max-w-2xl">
            <h2 className="text-green-700 font-semibold tracking-wide uppercase text-sm mb-2">Berita & Informasi</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900">Kabar Terbaru Kemenag OKI</h3>
          </div>
          <Link to="/berita" className="inline-flex items-center text-green-700 font-semibold hover:text-green-800 transition-colors">
            Lihat Semua Berita <ArrowRight size={18} className="ml-1" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Memuat berita...</div>
        ) : news.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-gray-400 font-medium">Data belum tersedia</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main News Card */}
            {news[0] && (
              <div className="lg:col-span-7">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 transition-all group flex flex-col h-full"
                >
                  <Link to={`/berita/${createSlug(news[0].title)}`} className="relative overflow-hidden aspect-[16/10] sm:aspect-[2/1] lg:aspect-[16/10] block">
                    <img 
                      src={news[0].image} 
                      alt={news[0].title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      {news[0].category}
                    </div>
                  </Link>
                  
                  <div className="p-6 sm:p-8 flex flex-col flex-grow">
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1"><Calendar size={14} /> {formatIndonesianDate(news[0].date)}</span>
                      <span className="flex items-center gap-1"><User size={14} /> {news[0].author || 'Admin'}</span>
                      <span className="flex items-center gap-1"><Eye size={14} /> {news[0].views || 0}</span>
                    </div>
                    
                    <h4 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 line-clamp-3 group-hover:text-green-700 transition-colors leading-tight">
                      <Link to={`/berita/${createSlug(news[0].title)}`}>{news[0].title}</Link>
                    </h4>
                    
                    <p className="text-gray-600 text-base line-clamp-3 mb-6 flex-grow">
                      {stripHtml(news[0].excerpt)}
                    </p>
                    
                    <Link to={`/berita/${createSlug(news[0].title)}`} className="inline-flex items-center text-sm font-semibold text-green-700 hover:text-green-800 mt-auto">
                      Baca Selengkapnya
                    </Link>
                  </div>
                </motion.div>
              </div>
            )}

            {/* News List */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {news.slice(1).map((item, idx) => (
                <motion.div
                  key={item.id || `news-${idx}`}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 transition-all group flex h-full"
                >
                  <Link to={`/berita/${createSlug(item.title)}`} className="w-32 sm:w-40 h-auto flex-shrink-0 relative overflow-hidden block">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 absolute inset-0"
                    />
                  </Link>
                  
                  <div className="p-4 sm:p-5 flex flex-col flex-grow justify-center">
                    <div className="flex items-center gap-3 text-[10px] sm:text-xs text-gray-500 mb-2">
                      <span className="text-amber-600 font-bold uppercase">{item.category}</span>
                      <span className="flex items-center gap-1"><Calendar size={12} /> {formatIndonesianDate(item.date)}</span>
                    </div>
                    
                    <h4 className="text-sm sm:text-base font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-green-700 transition-colors leading-snug">
                      <Link to={`/berita/${createSlug(item.title)}`}>{item.title}</Link>
                    </h4>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
