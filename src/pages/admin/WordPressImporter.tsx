import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from '../../lib/db';
import { db } from '../../lib/db';
import { toast } from 'sonner';
import { ArrowLeft, CloudDownload, RefreshCw, CheckSquare, Square, Globe, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WPPost {
  id: number;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  date: string;
  link: string;
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string;
    }>;
    'author'?: Array<{
      name: string;
    }>;
    'wp:term'?: Array<Array<{
      name: string;
    }>>;
  };
}

export default function WordPressImporter() {
  const navigate = useNavigate();
  const [wpUrl, setWpUrl] = useState('https://sumsel.kemenag.go.id');
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<WPPost[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [customCategory, setCustomCategory] = useState('Berita');
  const [useOriginalDate, setUseOriginalDate] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  const fetchWordPressPosts = async () => {
    if (!wpUrl) {
      toast.error('Masukkan URL WordPress terlebih dahulu');
      return;
    }

    // Clean up URL
    let cleanUrl = wpUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    // Remove trailing slash
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }

    setLoading(true);
    setPosts([]);
    setSelectedIds([]);

    try {
      // Use proxy to avoid CORS issues
      const response = await fetch("/api/proxy-wp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wpUrl: cleanUrl })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP status ${response.status}`);
      }

      const data: WPPost[] = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Format data tidak sesuai, pastikan ini adalah situs WordPress');
      }

      if (data.length === 0) {
        toast.info('Tidak ada artikel yang ditemukan di situs tersebut');
      } else {
        setPosts(data);
        // Select all by default
        setSelectedIds(data.map(p => p.id));
        toast.success(`Berhasil memuat ${data.length} artikel dari WordPress!`);
      }
    } catch (error) {
      console.error('Error fetching WP posts:', error);
      toast.error('Gagal menghubungkan ke situs WordPress. Pastikan URL benar dan mendukung REST API.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === posts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(posts.map(p => p.id));
    }
  };

  const toggleSelectPost = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleImport = async () => {
    const toImport = posts.filter(p => selectedIds.includes(p.id));
    if (toImport.length === 0) {
      toast.error('Pilih minimal satu artikel untuk diimport');
      return;
    }

    setImporting(true);
    setImportProgress({ current: 0, total: toImport.length });

    let successCount = 0;
    let duplicateCount = 0;

    for (let i = 0; i < toImport.length; i++) {
      const post = toImport[i];
      setImportProgress({ current: i + 1, total: toImport.length });

      try {
        // Simple check to prevent duplicate imports by matching title
        const newsRef = collection(db, 'news');
        const dupQuery = query(newsRef, where('title', '==', post.title.rendered));
        const dupSnap = await getDocs(dupQuery);

        if (!dupSnap.empty) {
          duplicateCount++;
          continue;
        }

        // Get featured image
        let imageUrl = '';
        if (post._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
          const wpImage = post._embedded['wp:featuredmedia'][0].source_url;
          try {
            const imgRes = await fetch("/api/download-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: wpImage, category: "foto" })
            });
            if (imgRes.ok) {
              const imgData = await imgRes.json();
              imageUrl = imgData.url;
            } else {
              imageUrl = wpImage;
            }
          } catch {
            imageUrl = wpImage;
          }
        }

        // Get author name
        let authorName = 'Administrator';
        if (post._embedded?.author?.[0]?.name) {
          authorName = post._embedded.author[0].name;
        }

        // Extract clean text/HTML for excerpt/content
        let fullContent = (post.content.rendered || post.excerpt.rendered).replace(/srcset="[^"]*"/g, "");
        
        // Download all inline images
        const imgRegex = /<img[^>]+src="([^">]+)"/g;
        let match;
        const inlineImgUrls = [];
        while ((match = imgRegex.exec(fullContent)) !== null) {
           inlineImgUrls.push(match[1]);
        }
        
        for (const url of inlineImgUrls) {
           try {
             const dlRes = await fetch("/api/download-image", {
                 method: "POST",
                 headers: { "Content-Type": "application/json" },
                 body: JSON.stringify({ url, category: "foto" })
              });
              if (dlRes.ok) {
                 const dlData = await dlRes.json();
                 fullContent = fullContent.split(url).join(dlData.url);
              }
           } catch {
             // ignore
           }
        }

        // Parse date to clean YYYY-MM-DD
        let postDate = '';
        let originalDateObj = new Date();
        try {
          originalDateObj = new Date(post.date);
          postDate = originalDateObj.toISOString().split('T')[0];
        } catch {
          postDate = new Date().toISOString().split('T')[0];
        }

        // Add to Firestore
        await addDoc(collection(db, 'news'), {
          title: post.title.rendered,
          category: customCategory,
          date: postDate,
          author: authorName,
          image: imageUrl || 'https://images.unsplash.com/photo-1604085572504-a392ddf0d86a?auto=format&fit=crop&q=80',
          excerpt: fullContent,
          createdAt: useOriginalDate ? originalDateObj : serverTimestamp()
        });

        successCount++;
      } catch (err) {
        console.error('Gagal mengimpor artikel:', post.title.rendered, err);
      }
    }

    setImporting(false);
    
    if (successCount > 0) {
      toast.success(`Berhasil mengimpor ${successCount} artikel ke database!`);
    }
    if (duplicateCount > 0) {
      toast.info(`${duplicateCount} artikel dilewati karena sudah ada di database.`);
    }

    // Redirect back to news list after 2 seconds
    setTimeout(() => {
      navigate('/admin/berita');
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto font-sans">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/admin/berita')}
          className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Migrasi & Import WordPress</h1>
          <p className="text-sm text-gray-500">Impor berita dari website WordPress lama Anda dengan mudah</p>
        </div>
      </div>

      {/* URL Input Area */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Globe size={18} className="text-green-700" />
          Koneksi Situs WordPress
        </h2>
        
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={wpUrl}
              onChange={(e) => setWpUrl(e.target.value)}
              placeholder="Contoh: https://sumsel.kemenag.go.id"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600 text-sm"
              disabled={loading || importing}
            />
          </div>
          <button
            onClick={fetchWordPressPosts}
            disabled={loading || importing}
            className="px-5 py-2.5 bg-green-700 hover:bg-green-800 disabled:bg-gray-200 text-white font-medium text-sm rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Menghubungkan...
              </>
            ) : (
              <>
                <CloudDownload size={16} />
                Tarik Artikel
              </>
            )}
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mt-2">
          * Sistem akan menarik 120 artikel terbaru secara otomatis melalui endpoint WordPress REST API.
        </p>
      </div>

      {/* Configuration & Selection */}
      {posts.length > 0 && !importing && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-50 pb-4">
            <div>
              <h3 className="font-bold text-gray-900">Konfigurasi Kategori Impor</h3>
              <p className="text-xs text-gray-500">Pilih kategori penampung untuk artikel hasil impor di database</p>
            </div>
            <div>
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600 text-sm bg-white"
              >
                <option value="Berita">Berita</option>
                <option value="Pengumuman">Pengumuman</option>
                <option value="Artikel">Artikel</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-50 pb-4">
            <div>
              <h3 className="font-bold text-gray-900">Pertahankan Tanggal & Waktu Asli</h3>
              <p className="text-xs text-gray-500">Artikel diimpor menggunakan tanggal & waktu rilis aslinya di WordPress agar urutan berita tetap benar.</p>
            </div>
            <div className="flex items-center">
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useOriginalDate}
                  onChange={(e) => setUseOriginalDate(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-green-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-700"></div>
                <span className="ml-3 text-sm font-semibold text-gray-700">
                  {useOriginalDate ? 'Aktif (Urutan Sesuai Asli)' : 'Gunakan Waktu Sekarang'}
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-700 font-medium transition-colors"
            >
              {selectedIds.length === posts.length ? (
                <>
                  <CheckSquare size={18} className="text-green-700" />
                  Batal Pilih Semua
                </>
              ) : (
                <>
                  <Square size={18} />
                  Pilih Semua ({posts.length})
                </>
              )}
            </button>
            <span className="text-xs text-gray-500 font-mono">
              {selectedIds.length} terpilih untuk diimport
            </span>
          </div>

          {/* List of articles */}
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 border-t border-gray-50 pt-4">
            {posts.map((post) => {
              const isSelected = selectedIds.includes(post.id);
              const wpMedia = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
              const cleanTitle = post.title.rendered.replace(/&#8211;/g, '-').replace(/&#8217;/g, "'").replace(/&nbsp;/g, ' ');
              return (
                <div
                  key={post.id}
                  onClick={() => toggleSelectPost(post.id)}
                  className={`flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-green-50/40 border-green-200' : 'bg-gray-50/50 border-gray-100 hover:border-gray-200'}`}
                >
                  <div className="shrink-0 text-gray-400">
                    {isSelected ? (
                      <CheckSquare size={20} className="text-green-700" />
                    ) : (
                      <Square size={20} />
                    )}
                  </div>
                  {wpMedia && (
                    <img
                      src={wpMedia}
                      alt=""
                      className="w-12 h-12 object-cover rounded-lg shrink-0 bg-gray-100"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-gray-800 truncate" dangerouslySetInnerHTML={{ __html: cleanTitle }} />
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <span>{new Date(post.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span>•</span>
                      <span>Penulis: {post._embedded?.author?.[0]?.name || 'Admin'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end mt-6 pt-4 border-t border-gray-50">
            <button
              onClick={handleImport}
              disabled={selectedIds.length === 0}
              className="px-6 py-2.5 bg-green-700 hover:bg-green-800 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <CloudDownload size={16} />
              Impor Sekarang
            </button>
          </div>
        </div>
      )}

      {/* Progress Overlay / State */}
      {importing && (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center py-16 flex flex-col items-center justify-center">
          <div className="relative mb-6">
            <RefreshCw size={48} className="text-green-700 animate-spin" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Sedang Mengimpor Data...</h3>
          <p className="text-sm text-gray-500 mb-4">
            Memasukkan artikel {importProgress.current} dari {importProgress.total} ke dalam database Firestore.
          </p>
          <div className="w-64 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-700 transition-all duration-300"
              style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Guide/Instruction if no posts fetched yet */}
      {posts.length === 0 && !loading && !importing && (
        <div className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-200 text-center py-10">
          <Globe size={40} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-700">Belum Ada Data yang Diambil</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
            Gunakan kotak input di atas untuk memasukkan alamat website WordPress Anda, kemudian klik "Tarik Artikel" untuk melihat pratinjau daftar postingan.
          </p>
        </div>
      )}
    </div>
  );
}
