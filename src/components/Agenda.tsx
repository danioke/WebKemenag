import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, MapPin, Clock, ArrowRight } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '../lib/firebase';

interface AgendaData {
  id: string;
  title: string;
  date: string;
  month: string;
  time: string;
  location: string;
  status: string;
}

export default function Agenda() {
  const [agendas, setAgendas] = useState<AgendaData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(collection(db, 'agendas'), orderBy('createdAt', 'desc'), limit(3));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AgendaData[];
        
        if (data.length > 0) {
          setAgendas(data);
        } else {
          setAgendas([
            { id: '1', title: "Rapat Koordinasi Persiapan Pendidikan Profesi Guru (PPG) Madrasah", date: "25", month: "Okt", time: "09:00 - Selesai", location: "Aula Kemenag OKI", status: "Akan Datang" },
            { id: '2', title: "Pembinaan Penyuluh Agama Islam se-Kabupaten OKI", date: "28", month: "Okt", time: "08:30 - 15:00", location: "Gedung Kesenian Kayuagung", status: "Akan Datang" },
            { id: '3', title: "Upacara Peringatan Hari Santri Nasional", date: "22", month: "Okt", time: "07:30 - Selesai", location: "Halaman Kantor Kemenag OKI", status: "Selesai" }
          ]);
        }
      } catch (error) {
        console.error("Error fetching agendas:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <section className="py-20 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="max-w-2xl">
            <h2 className="text-green-700 font-semibold tracking-wide uppercase text-sm mb-2">Jadwal Kegiatan</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900">Agenda Kemenag OKI</h3>
          </div>
          <Link to="/agenda" className="inline-flex items-center text-green-700 font-semibold hover:text-green-800 transition-colors">
            Lihat Semua Agenda <ArrowRight size={18} className="ml-1" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Memuat agenda...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {agendas.map((agenda, idx) => (
              <motion.div
                key={agenda.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 p-6 transition-all group flex gap-5"
              >
                {/* Date Column */}
                <div className="flex flex-col items-center justify-center bg-green-50 text-green-800 rounded-lg min-w-[70px] h-[80px] shrink-0 border border-green-100 group-hover:bg-green-700 group-hover:text-white transition-colors">
                  <span className="text-2xl font-bold leading-none mb-1">{agenda.date}</span>
                  <span className="text-xs font-semibold uppercase tracking-wider">{agenda.month}</span>
                </div>
                
                {/* Content Column */}
                <div className="flex flex-col justify-center flex-grow">
                  <h4 className="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-green-700 transition-colors">
                    <Link to={`/agenda/${agenda.id}`}>{agenda.title}</Link>
                  </h4>
                  
                  <div className="space-y-1.5 mt-auto">
                    <div className="flex items-center text-sm text-gray-600 gap-2">
                      <Clock size={14} className="text-amber-500 shrink-0" />
                      <span>{agenda.time}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 gap-2">
                      <MapPin size={14} className="text-amber-500 shrink-0" />
                      <span className="truncate">{agenda.location}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
