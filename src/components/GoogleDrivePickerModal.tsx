import React, { useState, useEffect } from 'react';
import { X, Search, UploadCloud, File, RefreshCw, Check, AlertCircle, HardDrive } from 'lucide-react';
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
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'browse' | 'upload'>('browse');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Load token on mount / open
  useEffect(() => {
    if (isOpen) {
      getAccessToken().then((cachedToken) => {
        if (cachedToken) {
          setToken(cachedToken);
          fetchFiles(cachedToken);
        }
      });
    }
  }, [isOpen]);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        toast.success('Berhasil terhubung dengan Google Drive');
        fetchFiles(result.accessToken);
      }
    } catch (error) {
      console.error(error);
      toast.error('Gagal menghubungkan ke Google Drive');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await logoutGoogle();
      setToken(null);
      setFiles([]);
      toast.success('Berhasil memutuskan koneksi Google Drive. Anda sekarang dapat masuk dengan akun lain.');
    } catch (error) {
      console.error(error);
      toast.error('Gagal memutuskan koneksi Google Drive');
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async (authToken: string) => {
    setLoading(true);
    try {
      const driveFiles = await listDriveFiles(authToken, fileType);
      setFiles(driveFiles);
    } catch (error) {
      console.error(error);
      toast.error('Gagal memuat file dari Google Drive');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (token) {
      fetchFiles(token);
    }
  };

  // Drag and drop handlers
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
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!token) {
      toast.error('Silakan hubungkan Google Drive terlebih dahulu');
      return;
    }

    // Validate type
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

    setUploading(true);
    try {
      toast.info(`Mengunggah "${file.name}" ke Google Drive...`);
      const result = await uploadFileToDrive(file, token);
      if (result) {
        toast.success('File berhasil diunggah dan diatur publik!');
        // Return file
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
      setUploading(false);
    }
  };

  const handleSelectFile = (file: any) => {
    onSelect({
      id: file.id,
      name: file.name,
      url: getDriveDirectUrl(file.id),
      embedUrl: getDriveEmbedUrl(file.id),
      size: file.size ? `${Math.round(Number(file.size) / 1024)} KB` : undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[85vh] border border-gray-100">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 shrink-0 bg-green-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 text-green-800 rounded-xl">
              <HardDrive size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Google Drive Explorer</h3>
              <p className="text-xs text-gray-500">
                Pilih atau unggah file untuk {fileType === 'image' ? 'Galeri Foto' : fileType === 'video' ? 'Galeri Video' : 'Pengumuman (PDF)'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto flex flex-col min-h-0 bg-gray-50/50">
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
              <h4 className="text-lg font-bold text-gray-900 mb-2">Hubungkan dengan Google Drive</h4>
              <p className="text-sm text-gray-500 mb-6">
                Untuk dapat mengambil file langsung dari Google Drive atau mengunggah media baru, Anda perlu masuk menggunakan akun Google Anda terlebih dahulu.
              </p>

              <button
                onClick={handleSignIn}
                disabled={loading}
                className="gsi-material-button w-full flex justify-center py-2 px-4 shadow-md font-semibold rounded-xl text-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                style={{ cursor: 'pointer' }}
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper flex items-center gap-3">
                  <div className="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block', width: 20, height: 20 }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents text-gray-700 font-medium">Masuk dengan Google</span>
                </div>
              </button>
            </div>
          ) : (
            /* Explorer / Uploader Tab Interface */
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* Tabs */}
              <div className="flex border-b border-gray-100 bg-white px-5">
                <button
                  onClick={() => setActiveTab('browse')}
                  className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors ${
                    activeTab === 'browse'
                      ? 'border-green-600 text-green-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Pilih dari Google Drive
                </button>
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors ${
                    activeTab === 'upload'
                      ? 'border-green-600 text-green-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Unggah Baru ke Drive
                </button>
              </div>

              {activeTab === 'browse' ? (
                /* Browse Tab */
                <div className="flex-1 flex flex-col min-h-0 p-5">
                  {/* Search and Refresh */}
                  <div className="flex gap-3 mb-4 shrink-0">
                    <div className="relative flex-1">
                      <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Cari file di Google Drive..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                      />
                    </div>
                    <button
                      onClick={handleRefresh}
                      disabled={loading}
                      title="Segarkan daftar file"
                      className="p-2 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors bg-white text-gray-600 disabled:opacity-50"
                    >
                      <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                  </div>

                  {/* Files List */}
                  <div className="flex-1 overflow-y-auto min-h-0">
                    {loading && files.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full py-10">
                        <RefreshCw size={30} className="animate-spin text-green-600 mb-2" />
                        <span className="text-sm text-gray-500">Memuat berkas dari Drive...</span>
                      </div>
                    ) : filteredFiles.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                        <AlertCircle size={32} className="mb-2 text-gray-300" />
                        <span className="text-sm font-medium text-gray-500">Tidak ada file ditemukan</span>
                        <p className="text-xs text-gray-400 max-w-xs mt-1">
                          Pastikan file tersebut sudah ada di Google Drive Anda dengan tipe yang sesuai.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {filteredFiles.map((file) => (
                          <div
                            key={file.id}
                            onClick={() => handleSelectFile(file)}
                            className="bg-white rounded-xl border border-gray-100 hover:border-green-500 hover:ring-1 hover:ring-green-500 p-3 flex flex-col cursor-pointer transition-all duration-200 group relative shadow-sm"
                          >
                            {/* File Thumbnail or Icon representation */}
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
                                  <File size={28} />
                                </div>
                              )}
                              <div className="absolute top-1.5 right-1.5 bg-green-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Check size={12} className="stroke-[3]" />
                              </div>
                            </div>
                            
                            {/* File Info */}
                            <div className="flex-1 flex flex-col min-h-0">
                              <span className="font-semibold text-xs text-gray-800 line-clamp-1 group-hover:text-green-700 transition-colors">
                                {file.name}
                              </span>
                              <span className="text-[10px] text-gray-400 mt-0.5">
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
                /* Upload Tab */
                <div className="flex-1 flex flex-col p-5 h-full">
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 text-center transition-colors bg-white ${
                      dragActive
                        ? 'border-green-500 bg-green-50/20'
                        : 'border-gray-200 hover:border-green-400'
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

                    {uploading ? (
                      <div className="flex flex-col items-center">
                        <RefreshCw size={40} className="animate-spin text-green-600 mb-4" />
                        <h4 className="font-bold text-gray-800 text-base mb-1">Sedang mengunggah...</h4>
                        <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                          Harap tunggu sebentar, file sedang diunggah ke Google Drive Anda dan hak aksesnya disesuaikan menjadi publik agar pemirsa portal dapat mengaksesnya.
                        </p>
                      </div>
                    ) : (
                      <label htmlFor="drive-file-upload-input" className="cursor-pointer flex flex-col items-center">
                        <div className="p-4 bg-green-50 text-green-700 rounded-full mb-4 shadow-sm">
                          <UploadCloud size={32} />
                        </div>
                        <span className="font-bold text-sm text-gray-800 mb-1">
                          Tarik dan lepas file di sini, atau cari berkas
                        </span>
                        <p className="text-xs text-gray-400 max-w-sm leading-relaxed mt-1">
                          File yang diunggah akan otomatis disimpan di akun Google Drive Anda dan dikonfigurasi agar dapat dilihat secara publik di situs web ini.
                        </p>
                        <div className="mt-6 px-4 py-2 bg-green-700 text-white rounded-xl text-xs font-semibold hover:bg-green-800 shadow transition-colors inline-block">
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

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex justify-between items-center shrink-0 bg-gray-50">
          <div>
            {token && (
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
              >
                Putuskan Koneksi / Ganti Akun Google
              </button>
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
