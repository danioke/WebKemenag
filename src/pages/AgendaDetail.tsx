import { createSlug } from "../lib/helpers";
import { formatAgendaFullDate } from "../lib/utils";
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from '../lib/db';
import { db } from '../lib/db';
import { Clock, MapPin, ArrowLeft, Calendar as CalendarIcon, Tag, Share2, ArrowRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

interface Agenda {
  id: string;
  title: string;
  date: string;
  month: string;
  time: string;
  location: string;
  status: string;
}

export default function AgendaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const [otherAgendas, setOtherAgendas] = useState<Agenda[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgendaAndOthers = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const q = query(collection(db, 'agendas'));
        const querySnapshot = await getDocs(q);
        
        let foundDoc = null;
        for (const doc of querySnapshot.docs) {
          if (doc.id === id || createSlug(doc.data().title) === id) {
            foundDoc = { id: doc.id, ...doc.data() } as Agenda;
            break;
          }
        }
        
        if (foundDoc) {
          setAgenda(foundDoc);
          
          // Fetch other agendas
          const otherQ = query(collection(db, 'agendas'), orderBy('createdAt', 'desc'), limit(5));
          const otherSnap = await getDocs(otherQ);
          const others = otherSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Agenda))
            .filter(item => item.id !== foundDoc?.id)
            .slice(0, 3); // top 3 other agendas
            
          if (others.length > 0) {
            setOtherAgendas(others);
          } else {
            // Fallback others
            setOtherAgendas([
              { id: '1', title: "Rapat Koordinasi Persiapan Hari Santri Nasional 2024", date: "15", month: "Okt", time: "09:00 - Selesai", location: "Aula Kemenag OKI", status: "Mendatang" },
              { id: '2', title: "Bimbingan Manasik Haji Tingkat Kabupaten OKI", date: "22", month: "Okt", time: "08:00 - 15:00", location: "Masjid Agung Kayuagung", status: "Mendatang" },
              { id: '3', title: "Pembinaan Penyuluh Agama Islam Non-PNS", date: "28", month: "Okt", time: "10:00 - Selesai", location: "KUA Kecamatan Kayuagung", status: "Mendatang" }
            ].filter(item => item.id !== foundDoc?.id).slice(0, 3));
          }
        }
      } catch (error) {
        console.error("Error fetching agenda:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAgendaAndOthers();
  }, [id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: agenda?.title,
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
          <p className="text-gray-500">Memuat agenda...</p>
        </div>
      </div>
    );
  }

  if (!agenda) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <div className="bg-white px-4 py-4 border-b border-gray-100 flex items-center sticky top-0 z-50">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
        </div>
        <div className="flex-grow flex flex-col items-center justify-center p-4">
          <p className="text-gray-500 mb-4">Agenda tidak ditemukan.</p>
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
        <title>{agenda.title} | Agenda Kemenag OKI</title>
        <meta name="description" content={`Agenda: ${agenda.title} pada tanggal ${agenda.date} ${agenda.month} pukul ${agenda.time} di ${agenda.location}`} />
        <meta property="og:title" content={agenda.title} />
        <meta property="og:description" content={`Agenda: ${agenda.title} pada tanggal ${agenda.date} ${agenda.month} pukul ${agenda.time} di ${agenda.location}`} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="article" />
      </Helmet>

      {/* Mobile-style Top Nav Bar */}
      <div className="bg-white px-4 py-4 border-b border-gray-100 flex items-center sticky top-0 z-50 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors mr-3">
          <ArrowLeft size={24} />
        </button>
        <h2 className="font-semibold text-gray-900 truncate flex-1">Detail Agenda</h2>
        <button onClick={handleShare} className="p-2 -mr-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
          <Share2 size={20} />
        </button>
      </div>

      <main className="flex-grow py-6 sm:py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <article className="bg-white p-6 sm:p-10 rounded-none sm:rounded-2xl sm:shadow-sm sm:border sm:border-gray-100 pb-10">
            <div className="flex flex-col md:flex-row gap-8 items-start mt-4 sm:mt-0">
              <div className="flex flex-col items-center justify-center bg-green-50 text-green-800 rounded-2xl min-w-[120px] h-[120px] shrink-0 border border-green-100 shadow-sm w-full md:w-auto">
                <span className="text-5xl font-bold leading-none mb-1">{agenda.date}</span>
                <span className="text-sm font-semibold uppercase tracking-wider">{agenda.month}</span>
              </div>

              <div className="flex-grow w-full">
                <div className="mb-4">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${agenda.status === 'Selesai' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-800'}`}>
                    {agenda.status}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 leading-tight">
                  {agenda.title}
                </h1>

                <div className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <div className="flex items-center text-gray-700 gap-3">
                    <CalendarIcon size={20} className="text-amber-500 shrink-0" />
                    <span className="font-medium text-base sm:text-lg">{formatAgendaFullDate(agenda)}</span>
                  </div>
                  <div className="flex items-center text-gray-700 gap-3">
                    <Clock size={20} className="text-amber-500 shrink-0" />
                    <span className="font-medium text-base sm:text-lg">{agenda.time} - Selesai</span>
                  </div>
                  <div className="flex items-center text-gray-700 gap-3">
                    <MapPin size={20} className="text-amber-500 shrink-0" />
                    <span className="font-medium text-base sm:text-lg">{agenda.location}</span>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Agenda Lainnya */}
          {otherAgendas.length > 0 && (
            <div className="bg-white rounded-none sm:rounded-2xl sm:shadow-sm sm:border sm:border-gray-100 p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Agenda Lainnya</h3>
                <Link to="/agenda" className="text-sm font-semibold text-green-700 hover:text-green-800 flex items-center gap-1">
                  Lihat Semua <ArrowRight size={16} />
                </Link>
              </div>
              <div className="space-y-4">
                {otherAgendas.map((item) => (
                  <Link 
                    key={item.id} 
                    to={`/agenda/${createSlug(item.title)}`}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-100 transition-all group animate-fade-in"
                  >
                    <div className="flex flex-col items-center justify-center bg-green-50 text-green-800 rounded-xl w-16 h-16 shrink-0 border border-green-100">
                      <span className="text-xl font-bold leading-none mb-0.5">{item.date}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider">{item.month}</span>
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.status === 'Selesai' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-800'}`}>
                          {item.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-800 text-sm md:text-base leading-snug group-hover:text-green-700 transition-colors line-clamp-1">
                        {item.title}
                      </h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 mt-1 font-medium">
                        <span className="flex items-center gap-1"><Clock size={12} /> {item.time}</span>
                        <span className="flex items-center gap-1"><MapPin size={12} /> {item.location}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
