import React, { useState, useEffect } from 'react';
import { X, Search, UploadCloud, File, RefreshCw, Check, AlertCircle, HardDrive, Server, Trash2, Cloud, FolderOpen } from 'lucide-react';
import { googleSignIn, getAccessToken, listDriveFiles, uploadFileToDrive, getDriveDirectUrl, getDriveEmbedUrl, logoutGoogle } from '../lib/googleDrive';
import { toast } from 'sonner';

interface GoogleDrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (file: { id: string; name: string; url: string; embedUrl: string; size?: string }) => void;
  fileType: 'image' | 'video' | 'pdf';
}

export default function GoogleDrivePickerModal({
  isOpen,
  onClose,
  onSelect,
  fileType,
}: GoogleDrivePickerModalProps) {
  // Storage source toggle: 'hosting' or 'google-drive'
  const [storageSource, setStorageSource] = useState<'hosting' | 'google-drive'>('hosting');

  // --- Google Drive States ---
  const [token, setToken] = useState<string | null>(null);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [driveSearchQuery, setDriveSearchQuery] = useState('');
  const [driveActiveTab, setDriveActiveTab] = useState<'browse' | 'upload'>('browse');
  const [driveUploading, setDriveUploading] = useState(false);

  // --- Hosting Storage States ---
  const [hostingLoading, setHostingLoading] = useState(false);
  const [hostingFiles, setHostingFiles] = useState<any[]>([]);
  const [hostingSearchQuery, setHostingSearchQuery] = useState('');
  const [hostingActiveTab, setHostingActiveTab] = useState<'browse' | 'upload'>('browse');
  const [hostingUploading, setHostingUploading] = useState(false);

  const [dragActive, setDragActive] = useState(false);

  // Load initial data on mount / open
  useEffect(() => {
    if (isOpen) {
      // 1. Always load hosting files first since it is the default tab
      fetchHostingFiles();

      // 2. Check if Google Drive has cached token in background
      getAccessToken().then((cachedToken) => {
        if (cachedToken) {
          setToken(cachedToken);
          fetchDriveFiles(cachedToken);
        }
      });
    }
  }, [isOpen, fileType]);

  // --- HOSTING STORAGE LOGIC (Niagahoster API) ---
  
  const fetchHostingFiles = async () => {
    setHostingLoading(true);
    try {
      const res = await fetch(`/api/files?type=${fileType}`);
      if (res.ok) {
        const data = await res.json();
        setHostingFiles(data);
      } else {
        toast.error('Gagal memuat file dari penyimpanan hosting');
      }
    } catch (error) {
      console.error('Error fetching hosting files:', error);
      toast.error('Gagal memuat file dari penyimpanan hosting. Pastikan server aktif.');
    } finally {
      setHostingLoading(false);
    }
  };

  const handleHostingUpload = async (file: File) => {
    // Validate file type
    if (fileType === 'image' && !file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }
    if (fileType === 'video' && !file.type.startsWith('video/')) {
      toast.error('File harus berupa video');
      return;
    }
    if (fileType === 'pdf' && file.type !== 'application/pdf') {
      toast.error('File harus berupa dokumen PDF');
      return;
    }

    setHostingUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      toast.info(`Mengunggah "${file.name}" ke penyimpanan hosting Niagahoster...`);
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('File berhasil diunggah ke penyimpanan hosting!');
        
        // Refresh local listing
        await fetchHostingFiles();

        // Select the file and close modal
        onSelect({
          id: data.id,
          name: data.name,
          url: data.url,
          embedUrl: data.embedUrl,
          size: data.size,
        });
        onClose();
      } else {
        const errText = await res.json();
        toast.error(`Gagal mengunggah ke hosting: ${errText.error || 'Terjadi kesalahan'}`);
      }
    } catch (error: any) {
      console.error('Hosting upload error:', error);
      toast.error('Terjadi kesalahan koneksi saat mengunggah ke hosting');
    } finally {
      setHostingUploading(false);
    }
  };

  const handleDeleteHostingFile = async (id: string, url: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering selection
    
    if (!window.confirm('Apakah Anda yakin ingin menghapus file ini secara permanen dari hosting Niagahoster?')) {
      return;
    }

    // Determine category from url path (e.g. /uploads/foto/filename -> category is 'foto')
    const parts = url.split('/');
    const category = parts[parts.length - 2];
    const filename = parts[parts.length - 1];

    try {
      const res = await fetch(`/api/files/${category}/${filename}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('File berhasil dihapus dari penyimpanan hosting');
        fetchHostingFiles();
      } else {
        const errData = await res.json();
        toast.error(`Gagal menghapus file: ${errData.error || 'Terjadi kesalahan'}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Gagal menghapus file dari hosting');
    }
  };


  // --- GOOGLE DRIVE LOGIC ---

  const handleDriveSignIn = async () => {
    setDriveLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        toast.success('Berhasil terhubung dengan Google Drive');
        fetchDriveFiles(result.accessToken);
      }
    } catch (error) {
      console.error(error);
      toast.error('Gagal menghubungkan ke Google Drive');
    } finally {
      setDriveLoading(false);
    }
  };

  const handleDriveSignOut = async () => {
    setDriveLoading(true);
    try {
      await logoutGoogle();
      setToken(null);
      setDriveFiles([]);
      toast.success('Koneksi Google Drive diputuskan.');
    } catch (error) {
      console.error(error);
      toast.error('Gagal memutuskan koneksi Google Drive');
    } finally {
      setDriveLoading(false);
    }
  };

  const fetchDriveFiles = async (authToken: string) => {
    setDriveLoading(true);
    try {
      const files = await listDriveFiles(authToken, fileType);
      setDriveFiles(files);
    } catch (error) {
      console.error(error);
      toast.error('Gagal memuat file dari Google Drive');
    } finally {
      setDriveLoading(false);
    }
  };

  const handleDriveUpload = async (file: File) => {
    if (!token) {
      toast.error('Silakan hubungkan Google Drive terlebih dahulu');
      return;
    }

    if (fileType === 'image' && !file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }
    if (fileType === 'video' && !file.type.startsWith('video/')) {
      toast.error('File harus berupa video');
      return;
    }
    if (fileType === 'pdf' && file.type !== 'application/pdf') {
      toast.error('File harus berupa dokumen PDF');
      return;
    }

    setDriveUploading(true);
    try {
      toast.info(`Mengunggah "${file.name}" ke Google Drive...`);
      const result = await uploadFileToDrive(file, token);
      if (result) {
        toast.success('File berhasil diunggah ke Google Drive dan diatur publik!');
        onSelect({
          id: result.id,
          name: result.name,
          url: getDriveDirectUrl(result.id),
          embedUrl: getDriveEmbedUrl(result.id),
          size: result.size,
        });
        onClose();
      } else {
        toast.error('Gagal mengunggah file ke Google Drive');
      }
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan saat mengunggah file');
    } finally {
      setDriveUploading(false);
    }
  };


  // --- DRAG & DROP HANDLERS (SHARED) ---
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (storageSource === 'hosting') {
        handleHostingUpload(file);
      } else {
        handleDriveUpload(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (storageSource === 'hosting') {
        handleHostingUpload(file);
      } else {
        handleDriveUpload(file);
      }
    }
  };


  if (!isOpen) return null;

  // Filter lists based on search
  const filteredHostingFiles = hostingFiles.filter((f) =>
    f.name.toLowerCase().includes(hostingSearchQuery.toLowerCase())
  );

  const filteredDriveFiles = driveFiles.filter((f) =>
    f.name.toLowerCase().includes(driveSearchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col h-[85vh] border border-gray-100">
        
        {/* Main Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 shrink-0 bg-green-50/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-700 text-white rounded-xl shadow-md">
              <FolderOpen size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Pengelola File & Media</h3>
              <p className="text-xs text-gray-500">
                Unggah dan pilih media untuk {fileType === 'image' ? 'Galeri Foto / Cover' : fileType === 'video' ? 'Galeri Video' : 'Pengumuman / Dokumen (PDF)'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Source Provider Selector Tabs */}
        <div className="flex bg-gray-50/80 border-b border-gray-100 shrink-0 p-2 gap-2">
          <button
            onClick={() => setStorageSource('hosting')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs transition-all ${
              storageSource === 'hosting'
                ? 'bg-green-700 text-white shadow-md shadow-green-700/10'
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Server size={16} />
            <span>Penyimpanan Hosting (Niagahoster)</span>
            <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded-full font-bold">Direkomendasikan</span>
          </button>
          
          <button
            onClick={() => setStorageSource('google-drive')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs transition-all ${
              storageSource === 'google-drive'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Cloud size={16} />
            <span>Penyimpanan Google Drive</span>
          </button>
        </div>

        {/* Dynamic Panel based on Storage Source */}
        <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
          
          {storageSource === 'hosting' ? (
            /* ==============================================
               HOSTING STORAGE INTERFACE
               ============================================== */
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* Tabs inside Hosting storage */}
              <div className="flex border-b border-gray-100 bg-white px-5 shrink-0">
                <button
                  onClick={() => setHostingActiveTab('browse')}
                  className={`py-3 px-4 font-semibold text-xs border-b-2 transition-colors ${
                    hostingActiveTab === 'browse'
                      ? 'border-green-700 text-green-800'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Lihat Berkas di Hosting
                </button>
                <button
                  onClick={() => setHostingActiveTab('upload')}
                  className={`py-3 px-4 font-semibold text-xs border-b-2 transition-colors ${
                    hostingActiveTab === 'upload'
                      ? 'border-green-700 text-green-800'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Unggah Berkas Baru ke Hosting
                </button>
              </div>

              {hostingActiveTab === 'browse' ? (
                /* Hosting Browse Tab */
                <div className="flex-1 flex flex-col min-h-0 p-5 bg-gray-50/30">
                  {/* Search and Refresh */}
                  <div className="flex gap-3 mb-4 shrink-0">
                    <div className="relative flex-1">
                      <Search size={18} className="absolute left-3.5 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Cari file di hosting..."
                        value={hostingSearchQuery}
                        onChange={(e) => setHostingSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 bg-white shadow-sm"
                      />
                    </div>
                    <button
                      onClick={fetchHostingFiles}
                      disabled={hostingLoading}
                      title="Segarkan daftar file"
                      className="p-2 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors bg-white text-gray-600 disabled:opacity-50 shadow-sm"
                    >
                      <RefreshCw size={18} className={hostingLoading ? 'animate-spin' : ''} />
                    </button>
                  </div>

                  {/* Hosting Files List / Grid */}
                  <div className="flex-1 overflow-y-auto min-h-0">
                    {hostingLoading && hostingFiles.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full py-10">
                        <RefreshCw size={30} className="animate-spin text-green-700 mb-2" />
                        <span className="text-xs text-gray-500">Memuat berkas dari hosting...</span>
                      </div>
                    ) : filteredHostingFiles.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm p-6">
                        <AlertCircle size={32} className="mb-2 text-gray-300" />
                        <span className="text-xs font-semibold text-gray-600">Tidak ada file ditemukan di hosting</span>
                        <p className="text-[11px] text-gray-400 max-w-xs mt-1 leading-relaxed">
                          Anda belum mengunggah file apa pun dengan format {fileType === 'image' ? 'gambar' : fileType === 'video' ? 'video' : 'PDF'}. Klik tab "Unggah Berkas Baru" untuk memulai.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {filteredHostingFiles.map((file) => (
                          <div
                            key={file.id}
                            onClick={() => {
                              onSelect(file);
                              onClose();
                            }}
                            className="bg-white rounded-xl border border-gray-100 hover:border-green-500 hover:ring-1 hover:ring-green-500 p-3 flex flex-col cursor-pointer transition-all duration-200 group relative shadow-sm hover:shadow"
                          >
                            {/* Card Media Preview */}
                            <div className="aspect-video bg-gray-50 rounded-lg overflow-hidden mb-2 flex items-center justify-center relative border border-gray-100">
                              {fileType === 'image' ? (
                                <img
                                  src={file.url}
                                  alt={file.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    // Fallback if image fails to load
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : fileType === 'video' ? (
                                <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-white">
                                  <span className="text-[10px] font-mono bg-black/40 px-2 py-1 rounded">VIDEO</span>
                                </div>
                              ) : (
                                <div className="p-3 bg-red-50 text-red-600 rounded-full">
                                  <File size={26} />
                                </div>
                              )}

                              {/* Hover actions */}
                              <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button
                                  onClick={(e) => handleDeleteHostingFile(file.id, file.url, e)}
                                  className="p-1.5 bg-red-600 text-white hover:bg-red-700 rounded-lg shadow-md transition-colors"
                                  title="Hapus file secara permanen"
                                >
                                  <Trash2 size={13} />
                                </button>
                                <div className="bg-green-600 text-white rounded-lg p-1.5 shadow-md">
                                  <Check size={13} className="stroke-[3]" />
                                </div>
                              </div>
                            </div>
                            
                            {/* File Info */}
                            <div className="flex flex-col min-h-0 mt-1">
                              <span className="font-semibold text-[11px] text-gray-800 line-clamp-1 group-hover:text-green-700 transition-colors" title={file.name}>
                                {file.name}
                              </span>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-[9px] text-gray-400">
                                  {file.size}
                                </span>
                                <span className="text-[9px] text-gray-400">
                                  {new Date(file.createdTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Hosting Upload Tab */
                <div className="flex-1 flex flex-col p-5 h-full">
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 text-center transition-colors bg-white ${
                      dragActive
                        ? 'border-green-600 bg-green-50/10'
                        : 'border-gray-200 hover:border-green-500'
                    }`}
                  >
                    <input
                      id="hosting-file-upload-input"
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept={
                        fileType === 'image'
                          ? 'image/*'
                          : fileType === 'video'
                          ? 'video/*'
                          : 'application/pdf'
                      }
                    />

                    {hostingUploading ? (
                      <div className="flex flex-col items-center max-w-sm">
                        <RefreshCw size={40} className="animate-spin text-green-700 mb-4" />
                        <h4 className="font-bold text-gray-800 text-sm mb-1">Sedang mengunggah ke hosting...</h4>
                        <p className="text-[11px] text-gray-400 leading-relaxed">
                          Harap tunggu sebentar, file sedang dikirim dan diproses di disk penyimpanan Niagahoster Anda.
                        </p>
                      </div>
                    ) : (
                      <label htmlFor="hosting-file-upload-input" className="cursor-pointer flex flex-col items-center w-full">
                        <div className="p-4 bg-green-50 text-green-700 rounded-2xl mb-4 shadow-sm">
                          <UploadCloud size={32} />
                        </div>
                        <span className="font-bold text-xs text-gray-800 mb-1">
                          Tarik dan lepas file di sini, atau klik untuk memilih
                        </span>
                        <p className="text-[10px] text-gray-400 max-w-sm leading-relaxed mt-1">
                          File akan disimpan langsung pada disk space hosting Anda. Mendukung {fileType === 'image' ? 'JPG, PNG, GIF, WebP (maks 150MB)' : fileType === 'video' ? 'MP4, WebM (maks 150MB)' : 'Dokumen PDF (maks 150MB)'}.
                        </p>
                        <div className="mt-6 px-5 py-2.5 bg-green-700 text-white rounded-xl text-xs font-semibold hover:bg-green-800 shadow transition-colors inline-block">
                          Pilih File dari Komputer
                        </div>
                      </label>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ==============================================
               GOOGLE DRIVE INTERFACE (Original)
               ============================================== */
            <div className="flex-1 flex flex-col min-h-0">
              {!token ? (
                /* Connect Google Drive Auth Step */
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-inner animate-pulse">
                    <svg className="w-10 h-10" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3zm-5.55-8h-2.9v3H8v2h2.55v3h2.9v-3H16v-2h-2.55z"
                      />
                    </svg>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 mb-2">Hubungkan dengan Google Drive</h4>
                  <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                    Untuk mengambil file dari Google Drive atau mengunggah media baru ke Drive, Anda perlu masuk menggunakan akun Google Anda terlebih dahulu.
                  </p>

                  <button
                    onClick={handleDriveSignIn}
                    disabled={driveLoading}
                    className="w-full flex justify-center py-2.5 px-4 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-semibold text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block', width: 18, height: 18 }}>
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      </svg>
                      <span>Masuk dengan Google</span>
                    </div>
                  </button>
                </div>
              ) : (
                /* Google Drive Active Interface */
                <div className="flex-1 flex flex-col min-h-0">
                  
                  {/* Google Drive Tab selector */}
                  <div className="flex border-b border-gray-100 bg-white px-5 shrink-0">
                    <button
                      onClick={() => setDriveActiveTab('browse')}
                      className={`py-3 px-4 font-semibold text-xs border-b-2 transition-colors ${
                        driveActiveTab === 'browse'
                          ? 'border-blue-600 text-blue-700'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Pilih dari Google Drive
                    </button>
                    <button
                      onClick={() => setDriveActiveTab('upload')}
                      className={`py-3 px-4 font-semibold text-xs border-b-2 transition-colors ${
                        driveActiveTab === 'upload'
                          ? 'border-blue-600 text-blue-700'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Unggah Baru ke Drive
                    </button>
                  </div>

                  {driveActiveTab === 'browse' ? (
                    /* Drive Browse Tab */
                    <div className="flex-1 flex flex-col min-h-0 p-5 bg-gray-50/20">
                      {/* Search and Refresh */}
                      <div className="flex gap-3 mb-4 shrink-0">
                        <div className="relative flex-1">
                          <Search size={18} className="absolute left-3.5 top-2.5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Cari file di Google Drive..."
                            value={driveSearchQuery}
                            onChange={(e) => setDriveSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                          />
                        </div>
                        <button
                          onClick={() => fetchDriveFiles(token)}
                          disabled={driveLoading}
                          title="Segarkan daftar file"
                          className="p-2 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors bg-white text-gray-600 disabled:opacity-50 shadow-sm"
                        >
                          <RefreshCw size={18} className={driveLoading ? 'animate-spin' : ''} />
                        </button>
                      </div>

                      {/* Drive Files List */}
                      <div className="flex-1 overflow-y-auto min-h-0">
                        {driveLoading && driveFiles.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full py-10">
                            <RefreshCw size={30} className="animate-spin text-blue-600 mb-2" />
                            <span className="text-xs text-gray-500">Memuat berkas dari Drive...</span>
                          </div>
                        ) : filteredDriveFiles.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200 p-6 shadow-sm">
                            <AlertCircle size={32} className="mb-2 text-gray-300" />
                            <span className="text-xs font-semibold text-gray-600">Tidak ada file ditemukan di Google Drive</span>
                            <p className="text-[11px] text-gray-400 max-w-xs mt-1 leading-relaxed">
                              Pastikan file tersebut sudah ada di Google Drive Anda dengan tipe yang sesuai.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {filteredDriveFiles.map((file) => (
                              <div
                                key={file.id}
                                onClick={() => {
                                  onSelect({
                                    id: file.id,
                                    name: file.name,
                                    url: getDriveDirectUrl(file.id),
                                    embedUrl: getDriveEmbedUrl(file.id),
                                    size: file.size ? `${Math.round(Number(file.size) / 1024)} KB` : undefined,
                                  });
                                  onClose();
                                }}
                                className="bg-white rounded-xl border border-gray-100 hover:border-blue-500 hover:ring-1 hover:ring-blue-500 p-3 flex flex-col cursor-pointer transition-all duration-200 group relative shadow-sm hover:shadow"
                              >
                                <div className="aspect-video bg-gray-50 rounded-lg overflow-hidden mb-2.5 flex items-center justify-center relative border border-gray-100">
                                  {file.thumbnailLink && fileType !== 'pdf' ? (
                                    <img
                                      src={file.thumbnailLink.replace('=s220', '=s400')}
                                      alt={file.name}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                  ) : (
                                    <div className="p-3 bg-red-50 text-red-600 rounded-full">
                                      <File size={26} />
                                    </div>
                                  )}
                                  <div className="absolute top-1.5 right-1.5 bg-blue-500 text-white rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Check size={12} className="stroke-[3]" />
                                  </div>
                                </div>
                                <div className="flex flex-col min-h-0">
                                  <span className="font-semibold text-[11px] text-gray-800 line-clamp-1 group-hover:text-blue-700 transition-colors" title={file.name}>
                                    {file.name}
                                  </span>
                                  <span className="text-[9px] text-gray-400 mt-0.5">
                                    {file.size ? `${Math.round(Number(file.size) / 1024)} KB` : 'Ukuran tidak diketahui'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Drive Upload Tab */
                    <div className="flex-1 flex flex-col p-5 h-full">
                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 text-center transition-colors bg-white ${
                          dragActive
                            ? 'border-blue-500 bg-blue-50/10'
                            : 'border-gray-200 hover:border-blue-400'
                        }`}
                      >
                        <input
                          id="drive-file-upload-input"
                          type="file"
                          className="hidden"
                          onChange={handleFileChange}
                          accept={
                            fileType === 'image'
                              ? 'image/*'
                              : fileType === 'video'
                              ? 'video/*'
                              : 'application/pdf'
                          }
                        />

                        {driveUploading ? (
                          <div className="flex flex-col items-center max-w-sm">
                            <RefreshCw size={40} className="animate-spin text-blue-600 mb-4" />
                            <h4 className="font-bold text-gray-800 text-sm mb-1">Sedang mengunggah ke Drive...</h4>
                            <p className="text-[11px] text-gray-400 leading-relaxed">
                              Harap tunggu sebentar, file sedang diunggah ke Google Drive Anda dan hak aksesnya disesuaikan menjadi publik agar pemirsa portal dapat mengaksesnya.
                            </p>
                          </div>
                        ) : (
                          <label htmlFor="drive-file-upload-input" className="cursor-pointer flex flex-col items-center w-full">
                            <div className="p-4 bg-blue-50 text-blue-700 rounded-2xl mb-4 shadow-sm">
                              <UploadCloud size={32} />
                            </div>
                            <span className="font-bold text-xs text-gray-800 mb-1">
                              Tarik dan lepas file di sini, atau klik untuk memilih
                            </span>
                            <p className="text-[10px] text-gray-400 max-w-sm leading-relaxed mt-1">
                              File yang diunggah akan disimpan di Google Drive Anda dan dikonfigurasi otomatis agar dapat dilihat secara publik di situs web ini.
                            </p>
                            <div className="mt-6 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow transition-colors inline-block">
                              Pilih File Komputer
                            </div>
                          </label>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 flex justify-between items-center shrink-0 bg-gray-50">
          <div>
            {storageSource === 'google-drive' && token && (
              <button
                onClick={handleDriveSignOut}
                disabled={driveLoading}
                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-[10px] font-bold transition-colors shadow-sm disabled:opacity-50"
              >
                Putuskan Koneksi / Ganti Akun Google
              </button>
            )}
            {storageSource === 'hosting' && (
              <div className="text-[10px] text-gray-400 flex items-center gap-1.5 font-medium">
                <Server size={12} className="text-green-700" />
                <span>Penyimpanan lokal hosting aktif</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 text-xs font-semibold transition-colors shadow-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
