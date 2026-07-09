import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, orderBy, query, doc, setDoc, deleteDoc, Timestamp } from '../../lib/firebase';
import { db } from '../../lib/firebase';
import { toast } from 'sonner';
import { 
  Printer, FileText, Calendar, Image as ImageIcon, Download, 
  Database, Upload, AlertTriangle, RefreshCw, CheckCircle, 
  Info, ShieldAlert, Sliders, Video, Layers, Activity 
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

interface ReportData {
  news: any[];
  photos: any[];
  agendas: any[];
  announcements: any[];
  banners: any[];
  videos: any[];
  infographics: any[];
  navigation: any[];
  categories: any[];
  layanan_data: any[];
}

export default function LaporanAdmin() {
  const [data, setData] = useState<ReportData>({ 
    news: [], photos: [], agendas: [], announcements: [],
    banners: [], videos: [], infographics: [], navigation: [],
    categories: [], layanan_data: []
  });
  const [loading, setLoading] = useState(true);
  
  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Laporan_Sistem_Kemenag_OKI',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          newsSnap, 
          photosSnap, 
          agendasSnap, 
          annSnap,
          bannersSnap,
          videosSnap,
          infoSnap,
          navSnap,
          catSnap,
          laySnap
        ] = await Promise.all([
          getDocs(query(collection(db, 'news'), orderBy('createdAt', 'desc'))),
          getDocs(query(collection(db, 'photos'), orderBy('createdAt', 'desc'))),
          getDocs(query(collection(db, 'agendas'), orderBy('createdAt', 'desc'))),
          getDocs(query(collection(db, 'announcements'), orderBy('createdAt', 'desc'))),
          getDocs(query(collection(db, 'banners'), orderBy('createdAt', 'desc'))),
          getDocs(query(collection(db, 'videos'), orderBy('createdAt', 'desc'))),
          getDocs(query(collection(db, 'infographics'), orderBy('createdAt', 'desc'))),
          getDocs(query(collection(db, 'navigation'), orderBy('order', 'asc'))),
          getDocs(query(collection(db, 'categories'), orderBy('name', 'asc'))),
          getDocs(collection(db, 'layanan_data'))
        ]);

        setData({
          news: newsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
          photos: photosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
          agendas: agendasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
          announcements: annSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
          banners: bannersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
          videos: videosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
          infographics: infoSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
          navigation: navSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
          categories: catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
          layanan_data: laySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
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

  const [restoring, setRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState({ current: 0, total: 0, currentStep: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [restoreMethod, setRestoreMethod] = useState<'merge' | 'overwrite'>('merge');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const expectedKeys = ['news', 'photos', 'agendas', 'announcements', 'banners', 'videos', 'infographics', 'navigation', 'categories', 'layanan_data'];
        const hasSomeKeys = expectedKeys.some(key => Array.isArray(json[key]));
        
        if (!hasSomeKeys) {
          toast.error("Format file cadangan tidak valid. Harus berupa JSON backup Kemenag OKI.");
          setPreviewData(null);
          setSelectedFile(null);
          return;
        }
        
        setPreviewData(json);
        toast.success("File cadangan berhasil dimuat! Silakan tinjau data di bawah.");
      } catch (err) {
        toast.error("Gagal membaca file JSON. Pastikan file tidak rusak.");
        setPreviewData(null);
        setSelectedFile(null);
      }
    };
    reader.readAsText(file);
  };

  const executeRestore = async () => {
    if (!previewData) return;
    
    setRestoring(true);
    setRestoreProgress({ current: 0, total: 1, currentStep: 'Memulai pemulihan...' });
    
    try {
      const collectionsToRestore = Object.keys(previewData).filter(key => Array.isArray(previewData[key]));
      
      // Calculate total documents for progress bar
      let totalDocs = 0;
      collectionsToRestore.forEach(col => {
        totalDocs += previewData[col].length;
      });
      
      let processedDocs = 0;
      
      for (const colName of collectionsToRestore) {
        const docArray = previewData[colName];
        setRestoreProgress(prev => ({ ...prev, currentStep: `Memproses koleksi: ${colName}...` }));
        
        // If overwrite mode, delete existing documents in this collection first
        if (restoreMethod === 'overwrite') {
          setRestoreProgress(prev => ({ ...prev, currentStep: `Membersihkan koleksi lama: ${colName}...` }));
          const currentSnap = await getDocs(collection(db, colName));
          for (const oldDoc of currentSnap.docs) {
            await deleteDoc(doc(db, colName, oldDoc.id));
          }
        }
        
        // Write backup documents
        for (const item of docArray) {
          const { id, ...docData } = item;
          if (!id) continue;
          
          // Re-convert timestamps if they have seconds and nanoseconds
          const parsedData = { ...docData };
          Object.keys(parsedData).forEach(key => {
            const val = parsedData[key];
            if (val && typeof val === 'object' && 'seconds' in val && 'nanoseconds' in val) {
              parsedData[key] = new Timestamp(val.seconds, val.nanoseconds);
            }
          });
          
          await setDoc(doc(db, colName, id), parsedData);
          processedDocs++;
          setRestoreProgress({
            current: processedDocs,
            total: totalDocs,
            currentStep: `Memulihkan ${colName}: (${processedDocs}/${totalDocs})`
          });
        }
      }
      
      toast.success("Database berhasil dipulihkan sepenuhnya!");
      setPreviewData(null);
      setSelectedFile(null);
      
      // Refresh local report state
      window.location.reload();
    } catch (error) {
      console.error("Restore failed:", error);
      toast.error(`Gagal memulihkan database: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setRestoring(false);
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

        {/* Disaster Recovery & Database Restoration Panel */}
        <div className="mt-12 border-t border-gray-100 pt-8 print:hidden">
          <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-6">
            <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center mb-6">
              <div className="flex items-start gap-3">
                <div className="bg-amber-100 p-2.5 rounded-lg text-amber-700 mt-0.5">
                  <Database size={22} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    Pemulihan Database Sistem (Restore)
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Gunakan panel ini untuk mengunggah file cadangan (.json) sebelumnya apabila sistem mengalami gangguan atau kerusakan data.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full flex items-center gap-1">
                  <ShieldAlert size={12} /> Zona Proteksi
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* File Uploader */}
              <div className="bg-white border-2 border-dashed border-gray-200 hover:border-amber-400 rounded-xl p-6 transition-all flex flex-col items-center justify-center text-center group cursor-pointer relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  disabled={restoring}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="bg-gray-50 group-hover:bg-amber-50 text-gray-500 group-hover:text-amber-600 p-4 rounded-full transition-colors mb-4">
                  <Upload size={28} />
                </div>
                {selectedFile ? (
                  <div>
                    <p className="font-bold text-gray-800 text-sm max-w-[280px] truncate">{selectedFile.name}</p>
                    <p className="text-xs text-green-600 font-semibold mt-1">File siap dipulihkan</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-gray-700 text-sm">Pilih atau Seret File Cadangan (.json)</p>
                    <p className="text-xs text-gray-400 mt-1">Hanya mendukung format file JSON hasil backup dari sistem ini</p>
                  </div>
                )}
              </div>

              {/* Restore Configuration */}
              <div className="bg-white border border-gray-200/80 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                    <Sliders size={16} className="text-gray-500" />
                    Pilih Metode Pemulihan:
                  </h4>
                  
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                      <input
                        type="radio"
                        name="restoreMethod"
                        value="merge"
                        checked={restoreMethod === 'merge'}
                        onChange={() => setRestoreMethod('merge')}
                        disabled={restoring}
                        className="mt-1 accent-amber-600"
                      />
                      <div>
                        <span className="font-bold text-xs text-gray-800 block">Gabung Data (Merge)</span>
                        <span className="text-[11px] text-gray-500 block leading-normal mt-0.5">
                          Menambah data baru & memperbarui data lama berdasarkan ID yang sama. Data lain di database tidak akan dihapus. (Paling Aman)
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-red-50/50 transition-colors cursor-pointer border border-transparent hover:border-red-100">
                      <input
                        type="radio"
                        name="restoreMethod"
                        value="overwrite"
                        checked={restoreMethod === 'overwrite'}
                        onChange={() => setRestoreMethod('overwrite')}
                        disabled={restoring}
                        className="mt-1 accent-red-600"
                      />
                      <div>
                        <span className="font-bold text-xs text-red-700 block flex items-center gap-1">
                          Kosongkan & Timpa (Clean Overwrite) <AlertTriangle size={12} />
                        </span>
                        <span className="text-[11px] text-gray-500 block leading-normal mt-0.5">
                          MENGHAPUS seluruh koleksi lama sebelum mengunggah isi file cadangan. Sangat direkomendasikan saat database rusak total.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-50 flex justify-end gap-2">
                  {selectedFile && (
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewData(null);
                      }}
                      disabled={restoring}
                      className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors font-semibold"
                    >
                      Batal
                    </button>
                  )}
                  <button
                    onClick={executeRestore}
                    disabled={!previewData || restoring}
                    className={`px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                      restoreMethod === 'overwrite' 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-amber-600 hover:bg-amber-700 text-white'
                    }`}
                  >
                    {restoring ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" /> Sedang Memulihkan...
                      </>
                    ) : (
                      <>
                        <Database size={14} /> Mulai Restore Database
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Restore Progress bar */}
            {restoring && (
              <div className="mt-6 bg-white border border-gray-200 rounded-xl p-4 shadow-sm animate-fade-in">
                <div className="flex justify-between text-xs font-semibold text-gray-700 mb-2">
                  <span className="flex items-center gap-1.5">
                    <RefreshCw size={12} className="animate-spin text-amber-600" />
                    {restoreProgress.currentStep}
                  </span>
                  <span>{Math.round((restoreProgress.current / (restoreProgress.total || 1)) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-600 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${(restoreProgress.current / (restoreProgress.total || 1)) * 100}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-gray-400 mt-1 text-right">
                  Harap jangan tutup halaman ini selama proses pemulihan data sedang berjalan.
                </p>
              </div>
            )}

            {/* Preview of Backup File */}
            {previewData && !restoring && (
              <div className="mt-6 bg-white border border-gray-200/80 rounded-xl p-5">
                <h4 className="font-bold text-gray-800 text-xs mb-3 flex items-center gap-2">
                  <Info size={14} className="text-amber-600" />
                  Pratinjau Isi File Cadangan (Siap Diunggah):
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  {Object.keys(previewData).map(col => {
                    const count = Array.isArray(previewData[col]) ? previewData[col].length : 0;
                    if (count === 0) return null;
                    return (
                      <div key={col} className="bg-gray-50 border border-gray-100 p-2 rounded-lg flex flex-col justify-between">
                        <span className="text-gray-500 font-semibold capitalize truncate">{col}</span>
                        <span className="text-base font-extrabold text-gray-900 mt-1">{count} <span className="text-[10px] font-normal text-gray-400">item</span></span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
