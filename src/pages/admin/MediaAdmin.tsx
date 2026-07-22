import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import ImageEditorModal from "../../components/ImageEditorModal";
import { Folder, Image as ImageIcon, Video, FileText, Upload, X, Search, Trash2, Copy, Crop } from 'lucide-react';

interface MediaFile {
  id: string;
  name: string;
  url: string;
  embedUrl: string;
  size: string;
  createdTime: string;
  mimeType: string;
}

export default function MediaAdmin() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingImage, setEditingImage] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [appUrl, setAppUrl] = useState('');

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/files?type=${category}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || (Array.isArray(data) ? data : []));
        if (data.appUrl) setAppUrl(data.appUrl);
      } else {
        toast.error('Gagal memuat media');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat memuat media');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [category]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 10MB");
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    setUploading(true);
    toast.info('Mengunggah file...');
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (res.ok) {
        toast.success('File berhasil diunggah');
        fetchFiles();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Gagal mengunggah file');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat mengunggah');
    } finally {
      setUploading(false);
      e.target.value = ''; // reset input
    }
  };

  const handleSaveCrop = async (blob: Blob) => {
    const formData = new FormData();
    formData.append("file", blob, "cropped-" + Date.now() + ".jpg");
    toast.info("Menyimpan hasil crop...");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        toast.success("Gambar crop berhasil disimpan");
        fetchFiles();
      } else {
        toast.error("Gagal menyimpan gambar crop");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan");
    }
  };

  const handleDelete = async (url: string) => {
    // If it's a data URL or absolute external URL
    if (url.startsWith('data:') || (url.startsWith('http') && !url.includes('/uploads/'))) {
      try {
        let localFilesStr = localStorage.getItem('mock_db_uploaded_files');
        if (localFilesStr) {
          let parsed = JSON.parse(localFilesStr);
          parsed = parsed.filter((f: any) => f.url !== url && f.id !== url);
          localStorage.setItem('mock_db_uploaded_files', JSON.stringify(parsed));
        }
        toast.success('File berhasil dihapus');
        setDeleteConfirm(null);
        fetchFiles();
      } catch (e) {
        toast.error('Gagal menghapus file dari penyimpanan lokal');
      }
      return;
    }

    // Extract category and filename from url (e.g. /uploads/foto/file.jpg)
    const parts = url.split('/');
    if (parts.length < 4) {
      toast.error('Gagal mengurai URL file untuk dihapus');
      return;
    }
    
    const cat = parts[2];
    const filename = parts[parts.length - 1];
    
    try {
      const res = await fetch(`/api/files/${cat}/${filename}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        toast.success('File berhasil dihapus');
        setDeleteConfirm(null);
        fetchFiles();
      } else {
        toast.error('Gagal menghapus file');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat menghapus file');
    }
  };

  const copyUrl = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      navigator.clipboard.writeText(url);
      toast.success('URL disalin!');
      return;
    }
    let baseUrl = appUrl || window.location.origin;
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    const fullUrl = baseUrl + url;
    navigator.clipboard.writeText(fullUrl);
    toast.success('URL disalin!');
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Media Library</h2>
        <div>
          <label className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-colors text-sm font-medium">
            {uploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Upload size={16} />}
            Unggah Media Lokal
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} accept="image/*,video/*,.pdf" />
          </label>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'all', label: 'Semua', icon: Folder },
              { id: 'image', label: 'Foto Berita', icon: ImageIcon },
              { id: 'foto_pejabat', label: 'Foto Pejabat', icon: ImageIcon },
              { id: 'foto_staf', label: 'Foto Staf', icon: ImageIcon },
              { id: 'video', label: 'Video', icon: Video },
              { id: 'pdf', label: 'PDF / Dokumen', icon: FileText }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${category === cat.id ? 'bg-white text-green-800 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <cat.icon size={16} />
                <span className="hidden sm:inline">{cat.label}</span>
              </button>
            ))}
          </div>
          
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Cari file..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Folder size={48} className="mx-auto text-gray-300 mb-3" />
              <p>Belum ada media di kategori ini</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredFiles.map(file => (
                <div key={file.id} className="group relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50 hover:border-green-400 transition-colors">
                  <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
                    {file.mimeType.startsWith('image/') ? (
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                    ) : file.mimeType.startsWith('video/') ? (
                      <Video size={32} className="text-gray-400" />
                    ) : (
                      <FileText size={32} className="text-gray-400" />
                    )}
                    
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-2">
                      <button onClick={() => copyUrl(file.url)} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm" title="Salin URL">
                        <Copy size={16} />
                      </button>
                      <button onClick={() => { setEditingImage(file.url); setEditorOpen(true); }} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm" title="Crop Gambar" style={{ display: file.mimeType.startsWith("image/") ? "block" : "none" }}><Crop size={16} /></button>
                      <button onClick={() => setDeleteConfirm(file.url)} className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white backdrop-blur-sm" title="Hapus File">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="p-2 text-xs">
                    <p className="truncate font-medium text-gray-800" title={file.name}>{file.name}</p>
                    <p className="text-gray-500">{file.size}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus File?</h3>
            <p className="text-gray-600 text-sm mb-6">
              Apakah Anda yakin ingin menghapus file ini? File yang dihapus mungkin membuat gambar/dokumen di artikel menjadi hilang.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
