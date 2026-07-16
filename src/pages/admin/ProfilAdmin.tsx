import React, { useState, useEffect } from 'react';
import { db, doc, getDoc, setDoc } from '../../lib/db';
import { toast } from 'sonner';
import { Save, Plus, Trash2, Edit } from 'lucide-react';

interface Seksi {
  id: string;
  name: string;
  role: string;
  photoUrl: string;
}

export default function ProfilAdmin() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [visi, setVisi] = useState('');
  const [misi, setMisi] = useState<string[]>([]);
  const [tugas, setTugas] = useState('');
  const [fungsi, setFungsi] = useState<string[]>([]);
  
  const [kepalaNama, setKepalaNama] = useState('');
  const [kepalaPhoto, setKepalaPhoto] = useState('');
  
  const [seksiList, setSeksiList] = useState<Seksi[]>([]);

  useEffect(() => {
    const fetchProfil = async () => {
      try {
        const docRef = doc(db, 'settings', 'profil_kantor');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setVisi(data.visi || '');
          setMisi(data.misi || []);
          setTugas(data.tugas || '');
          setFungsi(data.fungsi || []);
          setKepalaNama(data.kepalaNama || '');
          setKepalaPhoto(data.kepalaPhoto || '');
          setSeksiList(data.seksiList || []);
        } else {
          // Initialize empty
          setMisi(['']);
          setFungsi(['']);
        }
      } catch (error) {
        console.error("Error fetching profil:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfil();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'profil_kantor'), {
        visi,
        misi: misi.filter(m => m.trim() !== ''),
        tugas,
        fungsi: fungsi.filter(f => f.trim() !== ''),
        kepalaNama,
        kepalaPhoto,
        seksiList
      });
      toast.success('Profil kantor berhasil disimpan');
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan profil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    toast.info('Mengunggah gambar...');
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });
      if (res.ok) {
        const data = await res.json();
        callback(data.url);
        toast.success('Gambar berhasil diunggah');
      } else {
        toast.error('Gagal mengunggah gambar');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat mengunggah');
    }
  };

  const updateMisi = (index: number, value: string) => {
    const newMisi = [...misi];
    newMisi[index] = value;
    setMisi(newMisi);
  };
  const updateFungsi = (index: number, value: string) => {
    const newFungsi = [...fungsi];
    newFungsi[index] = value;
    setFungsi(newFungsi);
  };

  if (loading) return <div className="p-8 text-center">Memuat data...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Profil Kantor</h2>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Visi & Misi */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Visi & Misi</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visi</label>
              <textarea
                value={visi}
                onChange={(e) => setVisi(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 h-24"
                placeholder="Masukkan Visi..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Misi</label>
              {misi.map((m, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={m}
                    onChange={(e) => updateMisi(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500"
                    placeholder={`Misi ${index + 1}`}
                  />
                  <button type="button" onClick={() => setMisi(misi.filter((_, i) => i !== index))} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => setMisi([...misi, ''])} className="flex items-center gap-1 text-sm text-green-700 mt-2 hover:underline font-medium">
                <Plus size={16} /> Tambah Misi
              </button>
            </div>
          </div>
        </div>

        {/* Tugas & Fungsi */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Tugas & Fungsi</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tugas Induk</label>
              <textarea
                value={tugas}
                onChange={(e) => setTugas(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 h-24"
                placeholder="Masukkan Tugas Utama..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fungsi</label>
              {fungsi.map((f, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={f}
                    onChange={(e) => updateFungsi(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500"
                    placeholder={`Fungsi ${index + 1}`}
                  />
                  <button type="button" onClick={() => setFungsi(fungsi.filter((_, i) => i !== index))} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => setFungsi([...fungsi, ''])} className="flex items-center gap-1 text-sm text-green-700 mt-2 hover:underline font-medium">
                <Plus size={16} /> Tambah Fungsi
              </button>
            </div>
          </div>
        </div>

        {/* Kepala Kantor */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Kepala Kantor</h3>
          <div className="flex gap-6 items-start">
            <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden shrink-0 border relative group">
              {kepalaPhoto ? (
                <img src={kepalaPhoto} alt="Kepala Kantor" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <span className="text-xs mt-1">Belum ada foto</span>
                </div>
              )}
              <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white">
                <Edit size={24} />
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setKepalaPhoto)} />
              </label>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kepala Kantor</label>
              <input
                type="text"
                value={kepalaNama}
                onChange={(e) => setKepalaNama(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500"
                placeholder="Nama Lengkap dengan Gelar"
              />
              <p className="text-xs text-gray-500 mt-2">Upload foto dengan rasio 3:4 agar terlihat rapi.</p>
            </div>
          </div>
        </div>

        {/* Kepala Seksi / Penyelenggara */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="font-bold text-gray-800">Kepala Seksi / Penyelenggara</h3>
            <button
              type="button"
              onClick={() => setSeksiList([...seksiList, { id: Date.now().toString(), name: '', role: '', photoUrl: '' }])}
              className="flex items-center gap-1 text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 font-medium"
            >
              <Plus size={16} /> Tambah Personil
            </button>
          </div>
          <div className="space-y-4">
            {seksiList.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">Belum ada data personil. Klik tambah untuk memasukkan data.</p>
            )}
            {seksiList.map((seksi, index) => (
              <div key={seksi.id} className="flex gap-4 items-start p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                <div className="w-20 h-24 bg-white rounded overflow-hidden shrink-0 border relative group shadow-sm">
                  {seksi.photoUrl ? (
                    <img src={seksi.photoUrl} alt="Personil" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100">
                      <span className="text-[10px] mt-1 text-center">Foto</span>
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white">
                    <Edit size={16} />
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (url) => {
                      const newList = [...seksiList];
                      newList[index].photoUrl = url;
                      setSeksiList(newList);
                    })} />
                  </label>
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nama Personil</label>
                    <input
                      type="text"
                      value={seksi.name}
                      onChange={(e) => {
                        const newList = [...seksiList];
                        newList[index].name = e.target.value;
                        setSeksiList(newList);
                      }}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-green-500"
                      placeholder="Nama Lengkap dengan Gelar"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Jabatan / Peran</label>
                    <input
                      type="text"
                      value={seksi.role}
                      onChange={(e) => {
                        const newList = [...seksiList];
                        newList[index].role = e.target.value;
                        setSeksiList(newList);
                      }}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-green-500"
                      placeholder="Misal: Kasi Bimas Islam"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSeksiList(seksiList.filter((_, i) => i !== index))}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg mt-6"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pb-8">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-xl font-bold shadow-md transition-all active:scale-95 disabled:opacity-70"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save size={20} />
            )}
            Simpan Profil
          </button>
        </div>

      </form>
    </div>
  );
}
