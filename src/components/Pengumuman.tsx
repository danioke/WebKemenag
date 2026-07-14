import { createSlug } from "../lib/helpers";
import { formatIndonesianDate } from "../lib/utils";
import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Download, ArrowRight } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from '../lib/db';
import { Link } from 'react-router-dom';
import { db } from '../lib/db';

interface PengumumanData {
  id: string;
  title: string;
  date: string;
  size: string;
  fileUrl: string;
}

export default function Pengumuman() {
  const [pengumuman, setPengumuman] = useState<PengumumanData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(4));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as PengumumanData[];
        
        if (data.length > 0) {
          setPengumuman(data);
        } else {
          // Fallback data if empty
          setPengumuman([
            { id: '1', title: "Pengumuman Hasil Seleksi Administrasi Calon PPPK Kementerian Agama Tahun 2024", date: "15 Okt 2024", size: "2.4 MB", fileUrl: "#" },
            { id: '2', title: "Surat Edaran Panduan Peringatan Hari Santri Nasional Tahun 2024", date: "10 Okt 2024", size: "1.1 MB", fileUrl: "#" },
            { id: '3', title: "Jadwal Pelaksanaan SKD CPNS Kementerian Agama Formasi Tahun 2024", date: "05 Okt 2024", size: "3.5 MB", fileUrl: "#" }
          ]);
        }
      } catch (error) {
        console.error("Error fetching announcements:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div className="max-w-2xl">
            <h2 className="text-green-700 font-semibold tracking-wide uppercase text-sm mb-2">Informasi Publik</h2>
            <h3 className="text-3xl font-bold text-gray-900">Pengumuman & Edaran</h3>
          </div>
          <Link to="/pengumuman" className="inline-flex items-center text-green-700 font-semibold hover:text-green-800 transition-colors">
            Lihat Semua <ArrowRight size={18} className="ml-1" />
          </Link>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-500">Memuat pengumuman...</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {pengumuman.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="group p-5 hover:bg-gray-50 transition-colors flex items-center gap-4 sm:gap-6"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-bold text-sm shrink-0">
                    {idx + 1}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
                    <FileText size={24} />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="text-base font-bold text-gray-900 mb-1 truncate group-hover:text-green-700 transition-colors">
                      <Link to={`/pengumuman/${createSlug(item.title)}`} className="focus:outline-none">
                        <span className="absolute inset-0" aria-hidden="true"></span>
                        {item.title}
                      </Link>
                    </h4>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{formatIndonesianDate(item.date)}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                      <span>PDF • {item.size}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-gray-400 group-hover:text-green-700 transition-colors">
                    <Download size={20} />
                  </div>
                </motion.div>
              ))}
            </ul>
          )}
        </div>
        
      </div>
    </section>
  );
}
