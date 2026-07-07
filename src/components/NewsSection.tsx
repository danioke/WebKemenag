import { createSlug } from "../lib/helpers";
import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, User, ArrowRight, Eye } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '../lib/firebase';

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
        const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'), limit(3));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as NewsData[];
        
        if (data.length > 0) {
          setNews(data);
        } else {
          setNews([
            {
              id: '1',
              title: "Kakanmenag OKI Resmikan Gedung Balai Nikah dan Pusat Layanan KUA",
              category: "Berita Utama",
              date: "14 Okt 2023",
              author: "Humas OKI",
              image: "https://images.unsplash.com/photo-1577900232427-18219b9166a0?auto=format&fit=crop&q=80",
              excerpt: "Peresmian gedung baru ini diharapkan dapat meningkatkan kualitas pelayanan keagamaan bagi masyarakat di tingkat kecamatan."
            },
            {
              id: '2',
              title: "Pembinaan ASN di Lingkungan Kementerian Agama Kab. OKI",
              category: "Kepegawaian",
              date: "12 Okt 2023",
              author: "Admin Kepegawaian",
              image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80",
              excerpt: "Kegiatan pembinaan ini bertujuan untuk memperkuat integritas dan profesionalitas aparatur sipil negara."
            },
            {
              id: '3',
              title: "Pelepasan Kontingen Kompetisi Sains Madrasah (KSM) Tingkat Provinsi",
              category: "Pendidikan",
              date: "08 Okt 2023",
              author: "Seksi Penmad",
              image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80",
              excerpt: "Sebanyak 45 siswa-siswi madrasah dari Kabupaten OKI siap bersaing di tingkat provinsi Sumatera Selatan."
            }
          ]);
        }
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <section className="py-20 bg-white">
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 transition-all group flex flex-col"
              >
                <div className="relative overflow-hidden aspect-[16/10]">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                    {item.category}
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><Calendar size={14} /> {item.date}</span>
                    <span className="flex items-center gap-1"><User size={14} /> {item.author || 'Admin'}</span>
                    <span className="flex items-center gap-1"><Eye size={14} /> {item.views || 0}</span>
                  </div>
                  
                  <h4 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-green-700 transition-colors">
                    <Link to={`/berita/${createSlug(item.title)}`}>{item.title}</Link>
                  </h4>
                  
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-grow">
                    {stripHtml(item.excerpt)}
                  </p>
                  
                  <Link to={`/berita/${createSlug(item.title)}`} className="inline-flex items-center text-sm font-semibold text-green-700 hover:text-green-800 mt-auto">
                    Baca Selengkapnya
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
