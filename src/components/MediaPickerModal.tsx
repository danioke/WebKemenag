import React, { useState, useEffect } from 'react';
import { X, Search, Image as ImageIcon, Video, FileText, Upload, Folder, Check } from 'lucide-react';
import { toast } from 'sonner';

interface MediaFile {
  id: string;
  name: string;
  url: string;
  embedUrl: string;
  size: string;
  createdTime: string;
  mimeType: string;
}

interface MediaPickerModalProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

export default function MediaPickerModal({ onSelect, onClose }: MediaPickerModalProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('image');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/files?type=${category}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const rawFiles: MediaFile[] = data.files || (Array.isArray(data) ? data : []);
        const filteredFiles = rawFiles.filter(f => {
          const lowerName = (f.name || '').toLowerCase();
          const lowerId = (f.id || '').toLowerCase();
          const lowerUrl = (f.url || '').toLowerCase();
          return (
            !lowerName.includes('og_image') &&
            !lowerName.startsWith('og_') &&
            !lowerName.includes('dummy') &&
            !lowerId.includes('og_image') &&
            !lowerId.includes('dummy') &&
            !lowerUrl.includes('/og_image/') &&
            f.size !== '0 KB'
          );
        });
        setFiles(filteredFiles);
      }
    } catch (error) {
      console.error('Failed to fetch media', error);
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
        const data = await res.json();
        toast.success('File berhasil diunggah');
        onSelect(data.url);
      } else {
        toast.error('Gagal mengunggah file');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat mengunggah');
    } finally {
      setUploading(false);
    }
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl relative animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
          <h2 className="text-xl font-bold text-gray-800">Pilih Media</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-white">
          <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto w-full md:w-auto">
            {[
              { id: 'image', label: 'Foto', icon: ImageIcon },
              { id: 'video', label: 'Video', icon: Video },
              { id: 'pdf', label: 'Dokumen', icon: FileText }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${category === cat.id ? 'bg-white text-green-800 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <cat.icon size={16} />
                {cat.label}
              </button>
            ))}
          </div>
          
          <div className="flex w-full md:w-auto gap-3">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari media..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>
            <label className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors shadow-sm shrink-0">
              {uploading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Upload size={18} />
              )}
              <span className="hidden sm:inline">Unggah Baru</span>
              <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} accept="image/*,video/*" />
            </label>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full"></div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <ImageIcon size={48} className="mb-4 text-gray-300" />
              <p>Tidak ada media ditemukan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredFiles.map(file => {
                const isImage = file.mimeType.startsWith('image/');
                return (
                  <div 
                    key={file.id} 
                    onClick={() => onSelect(file.url)}
                    className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md hover:border-green-500 cursor-pointer transition-all group"
                  >
                    <div className="aspect-square bg-gray-100 relative overflow-hidden flex items-center justify-center">
                      {isImage ? (
                        <img src={file.url} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <Video size={48} className="text-gray-400" />
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-green-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-white text-green-800 p-2 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all">
                          <Check size={24} />
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-medium text-gray-800 truncate" title={file.name}>{file.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
