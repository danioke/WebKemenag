import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'sonner';
import { Printer, FileText, Calendar, Image as ImageIcon, Download } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

interface ReportData {
  news: any[];
  photos: any[];
  agendas: any[];
  announcements: any[];
}

export default function LaporanAdmin() {
  const [data, setData] = useState<ReportData>({ news: [], photos: [], agendas: [], announcements: [] });
  const [loading, setLoading] = useState(true);
  
  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Laporan_Sistem_Kemenag_OKI',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [newsSnap, photosSnap, agendasSnap, annSnap] = await Promise.all([
          getDocs(query(collection(db, 'news'), orderBy('createdAt', 'desc'))),
          getDocs(query(collection(db, 'photos'), orderBy('createdAt', 'desc'))),
          getDocs(query(collection(db, 'agendas'), orderBy('createdAt', 'desc'))),
          getDocs(query(collection(db, 'announcements'), orderBy('createdAt', 'desc')))
        ]);

        setData({
          news: newsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
          photos: photosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
          agendas: agendasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
          announcements: annSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        });
      } catch (error) {
        console.error("Error fetching report data", error);
        toast.error('Gagal memuat data laporan');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleBackup = () => {
    try {
      const backupData = JSON.stringify(data, null, 2);
      const blob = new Blob([backupData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.download = `Backup_DB_Kemenag_OKI_${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Database berhasil dicadangkan");
    } catch (e) {
      toast.error("Gagal membuat backup");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg text-blue-700">
            <FileText size={20} />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Laporan & Backup</h2>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Printer size={16} /> Cetak Laporan
          </button>
          <button
            onClick={handleBackup}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Download size={16} /> Backup DB
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Printable Area */}
        <div ref={printRef} className="print:p-8 print:text-black">
          <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-4">
            <h1 className="text-2xl font-bold uppercase mb-1">KEMENTERIAN AGAMA KABUPATEN OGAN KOMERING ILIR</h1>
            <p className="text-sm">Laporan Rekapitulasi Data Sistem Informasi</p>
            <p className="text-sm mt-1">Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Berita */}
            <div className="border border-gray-200 rounded-xl p-4 print:border-none print:p-0">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2 border-b border-gray-100 pb-2 print:border-black print:text-xl">
                <FileText size={18} className="text-blue-600 print:hidden" /> 
                Berita ({data.news.length})
              </h3>
              <ul className="space-y-2 max-h-64 overflow-y-auto print:max-h-none print:overflow-visible text-sm text-gray-700 print:text-black">
                {data.news.map((item: any, i) => (
                  <li key={item.id} className="flex gap-2">
                    <span className="font-medium">{i+1}.</span>
                    <span>{item.title}</span>
                  </li>
                ))}
                {data.news.length === 0 && <li className="text-gray-400 italic">Tidak ada data</li>}
              </ul>
            </div>

            {/* Foto */}
            <div className="border border-gray-200 rounded-xl p-4 print:border-none print:p-0">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2 border-b border-gray-100 pb-2 print:border-black print:text-xl">
                <ImageIcon size={18} className="text-green-600 print:hidden" /> 
                Foto ({data.photos.length})
              </h3>
              <ul className="space-y-2 max-h-64 overflow-y-auto print:max-h-none print:overflow-visible text-sm text-gray-700 print:text-black">
                {data.photos.map((item: any, i) => (
                  <li key={item.id} className="flex gap-2">
                    <span className="font-medium">{i+1}.</span>
                    <span>{item.title}</span>
                  </li>
                ))}
                {data.photos.length === 0 && <li className="text-gray-400 italic">Tidak ada data</li>}
              </ul>
            </div>

            {/* Agenda */}
            <div className="border border-gray-200 rounded-xl p-4 print:border-none print:p-0">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2 border-b border-gray-100 pb-2 print:border-black print:text-xl">
                <Calendar size={18} className="text-purple-600 print:hidden" /> 
                Agenda ({data.agendas.length})
              </h3>
              <ul className="space-y-2 max-h-64 overflow-y-auto print:max-h-none print:overflow-visible text-sm text-gray-700 print:text-black">
                {data.agendas.map((item: any, i) => (
                  <li key={item.id} className="flex gap-2">
                    <span className="font-medium">{i+1}.</span>
                    <span>{item.title}</span>
                  </li>
                ))}
                {data.agendas.length === 0 && <li className="text-gray-400 italic">Tidak ada data</li>}
              </ul>
            </div>

            {/* Pengumuman */}
            <div className="border border-gray-200 rounded-xl p-4 print:border-none print:p-0">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2 border-b border-gray-100 pb-2 print:border-black print:text-xl">
                <FileText size={18} className="text-amber-600 print:hidden" /> 
                Pengumuman ({data.announcements.length})
              </h3>
              <ul className="space-y-2 max-h-64 overflow-y-auto print:max-h-none print:overflow-visible text-sm text-gray-700 print:text-black">
                {data.announcements.map((item: any, i) => (
                  <li key={item.id} className="flex gap-2">
                    <span className="font-medium">{i+1}.</span>
                    <span>{item.title}</span>
                  </li>
                ))}
                {data.announcements.length === 0 && <li className="text-gray-400 italic">Tidak ada data</li>}
              </ul>
            </div>
          </div>
          
          <div className="hidden print:block mt-16 text-right w-full">
            <p className="mb-16">Kayuagung, {new Date().toLocaleDateString('id-ID')}</p>
            <p className="font-bold border-b border-black inline-block min-w-[200px]">Admin Sistem</p>
          </div>
        </div>
      </div>
    </div>
  );
}
