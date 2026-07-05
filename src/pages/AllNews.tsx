import { createSlug } from "../lib/helpers";
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ArrowLeft, Calendar, User, Search, Tag, Eye } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';

interface NewsData {
  id: string;
  title: string;
  category: string;
  date: string;
  author: string;
  image: string;
  excerpt: string;
}

const stripHtml = (html: string) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8211;/g, '-')
    .replace(/&#8217;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
};

export default function AllNews() {
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchAllNews = async () => {
      try {
        const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as NewsData[];

        if (data.length > 0) {
          setNews(data);
        } else {
          setNews(fallbackNews);
        }
      } catch (error) {
        console.error("Error fetching news list:", error);
        setNews(fallbackNews);
      } finally {
        setLoading(false);
      }
    };

    fetchAllNews();
  }, []);

  // Filter logic
  const filteredNews = news.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.excerpt && item.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get distinct categories
  const categories = ['Semua', ...Array.from(new Set(news.map(item => item.category))).filter(Boolean)];

  // Pagination calculations
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentNews = filteredNews.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset page when search or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <div className="bg-white px-4 py-4 border-b border-gray-100 flex items-center sticky top-0 z-50 shadow-sm">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors mr-3">
            <ArrowLeft size={24} />
          </button>
          <h2 className="font-semibold text-gray-900">Kembali</h2>
        </div>
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-500 font-medium">Memuat semua berita...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Helmet>
        <title>Berita & Informasi Terkini | Kemenag OKI</title>
        <meta name="description" content="Kumpulan berita, kegiatan, dan informasi terbaru di lingkungan Kantor Kementerian Agama Kabupaten Ogan Komering Ilir" />
      </Helmet>

      {/* Top Nav Bar */}
      <div className="bg-white px-4 py-4 border-b border-gray-100 flex items-center sticky top-0 z-50 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors mr-3">
          <ArrowLeft size={24} />
        </button>
        <h2 className="font-bold text-gray-900 truncate flex-1 text-lg">Semua Berita & Informasi</h2>
      </div>

      <main className="flex-grow py-6 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Search and Filters Section */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm mb-8 space-y-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                placeholder="Cari berita..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-green-500 focus:border-green-500 block pl-10 p-3 outline-none"
              />
            </div>

            {/* Horizontal scroll of categories */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1">Kategori:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                    selectedCategory === cat 
                      ? 'bg-green-700 text-white shadow-sm' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* News Grid */}
          <AnimatePresence mode="popLayout">
            {currentNews.length > 0 ? (
              <motion.div 
                layout 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {currentNews.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg border border-gray-100 transition-all group flex flex-col"
                  >
                    <div className="relative overflow-hidden aspect-[16/10]">
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute top-4 left-4 bg-amber-400 text-amber-900 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm uppercase tracking-wider">
                        {item.category}
                      </div>
                    </div>
                    
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3 font-medium">
                        <span className="flex items-center gap-1"><Calendar size={13} /> {item.date}</span>
                        <span className="flex items-center gap-1"><User size={13} /> {item.author || 'Humas'}</span>
                        <span className="flex items-center gap-1"><Eye size={13} /> {item.views || 0}</span>
                      </div>
                      
                      <h4 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-green-700 transition-colors leading-snug">
                        <Link to={`/berita/${createSlug(item.title)}`}>{item.title}</Link>
                      </h4>
                      
                      <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-grow leading-relaxed">
                        {stripHtml(item.excerpt)}
                      </p>
                      
                      <Link to={`/berita/${createSlug(item.title)}`} className="inline-flex items-center text-sm font-bold text-green-700 hover:text-green-800 mt-auto transition-colors">
                        Baca Selengkapnya
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-gray-400 font-medium">Tidak ada berita yang cocok dengan filter pencarian.</p>
              </div>
            )}
          </AnimatePresence>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Sebelumnya
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                      currentPage === page 
                        ? 'bg-green-700 text-white shadow-sm' 
                        : 'border border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Selanjutnya
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

const fallbackNews: NewsData[] = [
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
  },
  {
    id: '4',
    title: "Kemenag OKI Gelar Bimbingan Perkawinan bagi Calon Pengantin",
    category: "Bimas Islam",
    date: "05 Okt 2023",
    author: "Humas OKI",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80",
    excerpt: "Program bimbingan perkawinan ini diadakan guna membekali calon pengantin agar memiliki kesiapan mental dan spiritual dalam membina rumah tangga."
  },
  {
    id: '5',
    title: "Rapat Persiapan Menyambut Hari Amal Bakti (HAB) Kemenag RI Ke-78",
    category: "Rapat",
    date: "01 Okt 2023",
    author: "Humas OKI",
    image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80",
    excerpt: "Seluruh jajaran kepala KUA dan madrasah mengikuti rapat persiapan rangkaian kegiatan memeriahkan Hari Amal Bakti."
  },
  {
    id: '6',
    title: "Penyaluran Zakat Produktif oleh Penyelenggara Zawa Kemenag OKI",
    category: "Zakat & Wakaf",
    date: "28 Sep 2023",
    author: "Humas OKI",
    image: "https://images.unsplash.com/photo-1590407757780-33734dc8cb10?auto=format&fit=crop&q=80",
    excerpt: "Sebanyak puluhan pelaku usaha mikro menerima bantuan zakat produktif sebagai modal usaha demi peningkatan kesejahteraan keluarga."
  }
];
