import { createSlug } from "../lib/helpers";
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ArrowLeft, Calendar as CalendarIcon, MapPin, Clock, Search } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';

interface AgendaData {
  id: string;
  title: string;
  date: string;
  month: string;
  time: string;
  location: string;
  status: string;
}

export default function AllAgenda() {
  const navigate = useNavigate();
  const [agendas, setAgendas] = useState<AgendaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Semua');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchAgendas = async () => {
      try {
        const q = query(collection(db, 'agendas'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AgendaData[];

        if (data.length > 0) {
          setAgendas(data);
        } else {
          setAgendas(fallbackAgendas);
        }
      } catch (error) {
        console.error("Error fetching agendas list:", error);
        setAgendas(fallbackAgendas);
      } finally {
        setLoading(false);
      }
    };

    fetchAgendas();
  }, []);

  // Filter logic
  const filteredAgendas = agendas.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'Semua' || 
                          (selectedStatus === 'Akan Datang' && item.status !== 'Selesai') || 
                          (selectedStatus === 'Selesai' && item.status === 'Selesai');
    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredAgendas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAgendas = filteredAgendas.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus]);

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
          <p className="text-gray-500 font-medium">Memuat semua agenda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Helmet>
        <title>Agenda Kegiatan Resmi | Kemenag OKI</title>
        <meta name="description" content="Jadwal agenda kegiatan, rapat, bimbingan, dan upacara di lingkungan Kantor Kementerian Agama Kabupaten Ogan Komering Ilir" />
      </Helmet>

      {/* Top Nav Bar */}
      <div className="bg-white px-4 py-4 border-b border-gray-100 flex items-center sticky top-0 z-50 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors mr-3">
          <ArrowLeft size={24} />
        </button>
        <h2 className="font-bold text-gray-900 truncate flex-1 text-lg">Semua Agenda & Kegiatan</h2>
      </div>

      <main className="flex-grow py-6 sm:py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Search and Filters Section */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm mb-8 space-y-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                placeholder="Cari agenda atau lokasi kegiatan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-green-500 focus:border-green-500 block pl-10 p-3 outline-none"
              />
            </div>

            {/* Status tabs */}
            <div className="flex gap-2">
              {['Semua', 'Akan Datang', 'Selesai'].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    selectedStatus === status 
                      ? 'bg-green-700 text-white shadow-sm' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Agenda Grid/List */}
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {currentAgendas.length > 0 ? (
                currentAgendas.map((agenda, idx) => (
                  <motion.div
                    key={agenda.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 p-5 sm:p-6 transition-all group flex gap-5 relative overflow-hidden"
                  >
                    {/* Date Column */}
                    <div className="flex flex-col items-center justify-center bg-green-50 text-green-800 rounded-xl min-w-[76px] h-[86px] shrink-0 border border-green-100 group-hover:bg-green-700 group-hover:text-white transition-all shadow-inner">
                      <span className="text-3xl font-extrabold leading-none mb-1">{agenda.date}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest">{agenda.month}</span>
                    </div>
                    
                    {/* Content Column */}
                    <div className="flex flex-col justify-center flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          agenda.status === 'Selesai' 
                            ? 'bg-gray-100 text-gray-500 border border-gray-200' 
                            : 'bg-green-100 text-green-800 border border-green-200'
                        }`}>
                          {agenda.status || 'Mendatang'}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 mb-2.5 leading-snug group-hover:text-green-700 transition-colors">
                        <Link to={`/agenda/${createSlug(agenda.title)}`}>{agenda.title}</Link>
                      </h4>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-amber-500 shrink-0" />
                          <span>{agenda.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <MapPin size={14} className="text-amber-500 shrink-0" />
                          <span className="truncate">{agenda.location}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-gray-400 font-medium">Tidak ada agenda yang cocok dengan filter pencarian.</p>
                </div>
              )}
            </AnimatePresence>
          </div>

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

const fallbackAgendas: AgendaData[] = [
  { id: '1', title: "Rapat Koordinasi Persiapan Pendidikan Profesi Guru (PPG) Madrasah", date: "25", month: "Okt", time: "09:00 - Selesai", location: "Aula Kemenag OKI", status: "Akan Datang" },
  { id: '2', title: "Pembinaan Penyuluh Agama Islam se-Kabupaten OKI", date: "28", month: "Okt", time: "08:30 - 15:00", location: "Gedung Kesenian Kayuagung", status: "Akan Datang" },
  { id: '3', title: "Upacara Peringatan Hari Santri Nasional", date: "22", month: "Okt", time: "07:30 - Selesai", location: "Halaman Kantor Kemenag OKI", status: "Selesai" },
  { id: '4', title: "Bimbingan Manasik Haji Tingkat Kecamatan", date: "15", month: "Okt", time: "08:00 - 12:00", location: "Masjid Agung Kayuagung", status: "Selesai" },
  { id: '5', title: "Rapat Koordinasi Evaluasi Anggaran Triwulan III", date: "10", month: "Okt", time: "13:30 - Selesai", location: "Ruang Rapat Kakanmenag", status: "Selesai" },
  { id: '6', title: "Penyusunan Kurikulum Merdeka Madrasah Aliyah", date: "05", month: "Okt", time: "08:00 - 16:00", location: "MAN 1 Ogan Komering Ilir", status: "Selesai" }
];
