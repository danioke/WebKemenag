import { createSlug } from "../lib/helpers";
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from '../lib/db';
import { db } from '../lib/db';
import { ArrowLeft, FileText, Download, ExternalLink, Share2, ArrowRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

interface Pengumuman {
  id: string;
  title: string;
  date: string;
  size: string;
  fileUrl: string;
}

export default function PengumumanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pengumuman, setPengumuman] = useState<Pengumuman | null>(null);
  const [otherAnnouncements, setOtherAnnouncements] = useState<Pengumuman[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPengumumanAndOthers = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const q = query(collection(db, 'announcements'));
        const querySnapshot = await getDocs(q);
        
        let foundDoc = null;
        for (const doc of querySnapshot.docs) {
          if (doc.id === id || createSlug(doc.data().title) === id) {
            foundDoc = { id: doc.id, ...doc.data() } as Pengumuman;
            break;
          }
        }
        
        if (foundDoc) {
          setPengumuman(foundDoc);
          
          // Fetch others
          const otherQ = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(5));
          const otherSnap = await getDocs(otherQ);
          const others = otherSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Pengumuman))
            .filter(item => item.id !== foundDoc?.id)
            .slice(0, 3); // top 3 other ones
            
          if (others.length > 0) {
            setOtherAnnouncements(others);
          } else {
            // Fallback others
            setOtherAnnouncements([
              { id: '1', title: "Pengumuman Hasil Seleksi Administrasi Calon PPPK Kementerian Agama Tahun 2024", date: "15 Okt 2024", size: "2.4 MB", fileUrl: "#" },
              { id: '2', title: "Surat Edaran Panduan Peringatan Hari Santri Nasional Tahun 2024", date: "10 Okt 2024", size: "1.1 MB", fileUrl: "#" },
              { id: '3', title: "Jadwal Pelaksanaan SKD CPNS Kementerian Agama Formasi Tahun 2024", date: "05 Okt 2024", size: "3.5 MB", fileUrl: "#" }
            ].filter(item => item.id !== foundDoc?.id).slice(0, 3));
          }
        }
      } catch (error) {
        console.error("Error fetching announcement:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPengumumanAndOthers();
  }, [id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: pengumuman?.title,
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
          <p className="text-gray-500">Memuat pengumuman...</p>
        </div>
      </div>
    );
  }

  if (!pengumuman) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <div className="bg-white px-4 py-4 border-b border-gray-100 flex items-center sticky top-0 z-50">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
        </div>
        <div className="flex-grow flex flex-col items-center justify-center p-4">
          <p className="text-gray-500 mb-4">Pengumuman tidak ditemukan.</p>
          <Link to="/" className="text-green-700 font-semibold hover:underline flex items-center gap-2">
            <ArrowLeft size={16} /> Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const isValidUrl = pengumuman.fileUrl && pengumuman.fileUrl !== '#';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Helmet>
        <title>{pengumuman.title} | Pengumuman Kemenag OKI</title>
        <meta name="description" content={`Pengumuman: ${pengumuman.title} pada tanggal ${pengumuman.date}`} />
        <meta property="og:title" content={pengumuman.title} />
        <meta property="og:description" content={`Pengumuman: ${pengumuman.title} pada tanggal ${pengumuman.date}`} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="article" />
      </Helmet>

      {/* Mobile-style Top Nav Bar */}
      <div className="bg-white px-4 py-4 border-b border-gray-100 flex items-center sticky top-0 z-50 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors mr-3">
          <ArrowLeft size={24} />
        </button>
        <h2 className="font-semibold text-gray-900 truncate flex-1">Detail Pengumuman</h2>
        <button onClick={handleShare} className="p-2 -mr-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
          <Share2 size={20} />
        </button>
      </div>

      <main className="flex-grow py-6 sm:py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <article className="bg-white p-6 sm:p-10 rounded-none sm:rounded-2xl sm:shadow-sm sm:border sm:border-gray-100 text-center pb-10">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 mt-4 sm:mt-0">
              <FileText size={40} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-tight">
              {pengumuman.title}
            </h1>
            
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500 mb-10">
              <span>{pengumuman.date}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
              <span>Dokumen PDF</span>
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
              <span>{pengumuman.size}</span>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {isValidUrl ? (
                <>
                  <a 
                    href={pengumuman.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-green-700 text-green-700 font-bold rounded-xl hover:bg-green-50 transition-colors"
                  >
                    <ExternalLink size={20} />
                    Lihat Dokumen
                  </a>
                  <a 
                    href={pengumuman.fileUrl} 
                    download
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-700 text-white font-bold rounded-xl hover:bg-green-800 transition-colors shadow-sm"
                  >
                    <Download size={20} />
                    Download File
                  </a>
                </>
              ) : (
                <div className="px-6 py-4 bg-yellow-50 text-yellow-800 rounded-xl text-sm font-medium border border-yellow-200">
                  File dokumen tidak tersedia.
                </div>
              )}
            </div>
          </article>

          {/* Informasi Publik Lainnya */}
          {otherAnnouncements.length > 0 && (
            <div className="bg-white rounded-none sm:rounded-2xl sm:shadow-sm sm:border sm:border-gray-100 p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Informasi Publik Lainnya</h3>
                <Link to="/" className="text-sm font-semibold text-green-700 hover:text-green-800 flex items-center gap-1">
                  Lihat Semua <ArrowRight size={16} />
                </Link>
              </div>
              <div className="space-y-4">
                {otherAnnouncements.map((item) => (
                  <Link 
                    key={item.id} 
                    to={`/pengumuman/${createSlug(item.title)}`}
                    className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-100 transition-all group animate-fade-in"
                  >
                    <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-bold text-gray-800 text-sm md:text-base leading-snug group-hover:text-green-700 transition-colors line-clamp-2">
                        {item.title}
                      </h4>
                      <div className="flex gap-4 text-xs text-gray-400 mt-1.5 font-medium">
                        <span>{item.date}</span>
                        <span>•</span>
                        <span>{item.size}</span>
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
