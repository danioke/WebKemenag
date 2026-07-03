import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ArrowLeft, FileText, Download, Search, ExternalLink } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';

interface PengumumanData {
  id: string;
  title: string;
  date: string;
  size: string;
  fileUrl: string;
}

export default function AllPengumuman() {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<PengumumanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const q = query(collection(db, 'kemenag_announcements'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as PengumumanData[];

        if (data.length > 0) {
          setAnnouncements(data);
        } else {
          setAnnouncements(fallbackAnnouncements);
        }
      } catch (error) {
        console.error("Error fetching announcements list:", error);
        setAnnouncements(fallbackAnnouncements);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  // Filter logic
  const filteredAnnouncements = announcements.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAnnouncements = filteredAnnouncements.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
          <p className="text-gray-500 font-medium">Memuat semua pengumuman...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Helmet>
        <title>Pengumuman & Edaran Resmi | Kemenag OKI</title>
        <meta name="description" content="Daftar pengumuman, surat edaran, dan dokumen resmi Kantor Kementerian Agama Kabupaten Ogan Komering Ilir" />
      </Helmet>

      {/* Top Nav Bar */}
      <div className="bg-white px-4 py-4 border-b border-gray-100 flex items-center sticky top-0 z-50 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors mr-3">
          <ArrowLeft size={24} />
        </button>
        <h2 className="font-bold text-gray-900 truncate flex-1 text-lg">Semua Pengumuman & Edaran</h2>
      </div>

      <main className="flex-grow py-6 sm:py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Search Box */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm mb-8">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                placeholder="Cari pengumuman atau surat edaran..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-green-500 focus:border-green-500 block pl-10 p-3.5 outline-none"
              />
            </div>
          </div>

          {/* List Section */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <AnimatePresence mode="popLayout">
              {currentAnnouncements.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {currentAnnouncements.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.25 }}
                      className="group p-5 sm:p-6 hover:bg-gray-50 transition-colors flex items-center gap-4 sm:gap-6 relative"
                    >
                      <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
                        <FileText size={24} />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="text-base font-bold text-gray-900 mb-1.5 leading-snug group-hover:text-green-700 transition-colors">
                          <Link to={`/pengumuman/${item.slug || item.id}`} className="focus:outline-none">
                            <span className="absolute inset-0" aria-hidden="true"></span>
                            {item.title}
                          </Link>
                        </h4>
                        <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                          <span>{item.date}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                          <span>PDF • {item.size}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-gray-400 group-hover:text-green-700 transition-colors relative z-10 p-2">
                        <Download size={20} />
                      </div>
                    </motion.div>
                  ))}
                </ul>
              ) : (
                <div className="p-20 text-center text-gray-500 font-medium">
                  Tidak ada pengumuman yang cocok dengan pencarian Anda.
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-10 flex justify-center items-center gap-2">
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

const fallbackAnnouncements: PengumumanData[] = [
  { id: '1', title: "Pengumuman Hasil Seleksi Administrasi Calon PPPK Kementerian Agama Tahun 2024", date: "15 Okt 2024", size: "2.4 MB", fileUrl: "#" },
  { id: '2', title: "Surat Edaran Panduan Peringatan Hari Santri Nasional Tahun 2024", date: "10 Okt 2024", size: "1.1 MB", fileUrl: "#" },
  { id: '3', title: "Jadwal Pelaksanaan SKD CPNS Kementerian Agama Formasi Tahun 2024", date: "05 Okt 2024", size: "3.5 MB", fileUrl: "#" },
  { id: '4', title: "Penerimaan Mahasiswa Praktek Kerja Lapangan (PKL) Angkatan II", date: "01 Okt 2024", size: "750 KB", fileUrl: "#" },
  { id: '5', title: "Pengumuman Pemenang Kompetisi Film Pendek Religi Kab. OKI 2024", date: "24 Sep 2024", size: "1.8 MB", fileUrl: "#" },
  { id: '6', title: "Panduan Teknis Pelaksanaan Peringatan Maulid Nabi Muhammad SAW", date: "18 Sep 2024", size: "1.2 MB", fileUrl: "#" }
];
