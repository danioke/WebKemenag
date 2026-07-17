import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { collection, getDocs } from '../lib/db';
import { db } from '../lib/db';
import { Search, ArrowLeft, Calendar, FileText, Activity, Megaphone } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { createSlug } from '../lib/helpers';
import { formatIndonesianDate } from '../lib/utils';
import Header from '../components/Header';
import Footer from '../components/Footer';

const stripHtml = (html: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').substring(0, 150) + '...';
};

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (queryParam) {
      setSearchQuery(queryParam);
      fetchResults(queryParam);
    } else {
      setLoading(false);
    }
  }, [queryParam]);

  const fetchResults = async (q: string) => {
    setLoading(true);
    try {
      const qLower = q.toLowerCase();
      
      const [beritaSnap, pengumumanSnap, agendaSnap] = await Promise.all([
        getDocs(collection(db, 'berita')),
        getDocs(collection(db, 'pengumuman')),
        getDocs(collection(db, 'agenda'))
      ]);

      const allResults: any[] = [];

      beritaSnap.forEach((doc: any) => {
        const data = doc.data();
        if ((data.title && data.title.toLowerCase().includes(qLower)) || (data.excerpt && data.excerpt.toLowerCase().includes(qLower))) {
          allResults.push({ ...data, id: doc.id, type: 'berita' });
        }
      });

      pengumumanSnap.forEach((doc: any) => {
        const data = doc.data();
        if ((data.title && data.title.toLowerCase().includes(qLower)) || (data.content && data.content.toLowerCase().includes(qLower))) {
          allResults.push({ ...data, id: doc.id, type: 'pengumuman' });
        }
      });

      agendaSnap.forEach((doc: any) => {
        const data = doc.data();
        if (data.title && data.title.toLowerCase().includes(qLower)) {
          allResults.push({ ...data, id: doc.id, type: 'agenda' });
        }
      });

      // Sort by date (descending)
      allResults.sort((a, b) => {
        const dateA = new Date(a.date || a.tanggal || a.createdAt || 0).getTime();
        const dateB = new Date(b.date || b.tanggal || b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      setResults(allResults);
    } catch (error) {
      console.error("Error fetching search results:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'berita': return <FileText size={16} className="text-amber-500" />;
      case 'pengumuman': return <Megaphone size={16} className="text-blue-500" />;
      case 'agenda': return <Calendar size={16} className="text-purple-500" />;
      default: return <Activity size={16} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'berita': return 'Berita';
      case 'pengumuman': return 'Pengumuman';
      case 'agenda': return 'Agenda';
      default: return 'Lainnya';
    }
  };

  const getLink = (item: any) => {
    switch (item.type) {
      case 'berita': return `/berita/${createSlug(item.title)}`;
      case 'pengumuman': return `/pengumuman/${createSlug(item.title)}`;
      case 'agenda': return `/agenda/${createSlug(item.title)}`;
      default: return '#';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Helmet>
        <title>Hasil Pencarian: {queryParam} | Kemenag OKI</title>
      </Helmet>
      
      <Header />

      <main className="flex-grow pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-8 flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-green-700 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 font-medium"
            >
              <ArrowLeft size={18} />
              Kembali
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-8">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-6">Pencarian</h1>
            <form onSubmit={handleSearch} className="relative max-w-2xl">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari informasi layanan, berita..."
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white transition-all text-lg"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-700 hover:bg-green-800 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Cari
              </button>
            </form>
          </div>

          <div className="mb-6 flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-800">Hasil Pencarian untuk "{queryParam}"</h2>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">{results.length} ditemukan</span>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="w-12 h-12 border-4 border-green-200 border-t-green-700 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Mencari informasi...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-6">
              {results.map((item, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={`${item.type}-${item.id}`} 
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full uppercase tracking-wider">
                      {getTypeIcon(item.type)}
                      {getTypeLabel(item.type)}
                    </span>
                    <span className="text-sm text-gray-500 flex items-center gap-1.5">
                      <Calendar size={14} />
                      {formatIndonesianDate(item.date || item.tanggal || item.createdAt)}
                    </span>
                  </div>
                  
                  <Link to={getLink(item)} className="block group-hover:text-green-700 transition-colors">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  </Link>
                  
                  <p className="text-gray-600 line-clamp-2">
                    {stripHtml(item.excerpt || item.content || item.keterangan || '')}
                  </p>
                  
                  <div className="mt-4">
                    <Link to={getLink(item)} className="text-green-700 font-semibold text-sm hover:underline flex items-center gap-1">
                      Baca Selengkapnya
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <Search size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Tidak ada hasil ditemukan</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Maaf, kami tidak dapat menemukan informasi yang cocok dengan kata kunci "{queryParam}". Coba gunakan kata kunci lain.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
