import React, { useState, useEffect } from "react";
import { formatIndonesianDate } from "../../lib/utils";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  query,
} from "../../lib/db";
import { db, auth } from "../../lib/db";
import { toast } from "sonner";
import { useMediaPickerStore } from "../../store/useMediaPickerStore";
import { Plus, Edit, Trash2, FileText, X, Upload } from "lucide-react";

interface Pengumuman {
  id: string;
  title: string;
  date: string;
  size: string;
  fileUrl: string;
}

export default function PengumumanAdmin() {
  const [data, setData] = useState<Pengumuman[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    date: "",
    size: "",
    fileUrl: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { openPicker } = useMediaPickerStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLocalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 10MB");
      return;
    }
    const form = new FormData();
    form.append("file", file);
    setUploading(true);
    toast.info("Mengunggah berkas...");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (res.ok) {
        const result = await res.json();
        setFormData({
          ...formData,
          fileUrl: result.url,
          size: result.size || "0 KB",
        });
        toast.success("Berkas berhasil diunggah");
      } else {
        toast.error("Gagal mengunggah berkas");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat mengunggah");
    } finally {
      setUploading(false);
    }
  };

  const fetchData = async () => {
    try {
      const q = query(
        collection(db, "announcements"),
        orderBy("createdAt", "desc"),
      );
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Pengumuman,
      );
      setData(docs);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data pengumuman");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !auth.currentUser &&
      localStorage.getItem("mock_admin_session") !== "true"
    ) {
      toast.error(
        "Anda sedang menggunakan Mode Akses Instan. Login untuk menyimpan perubahan.",
      );
      return;
    }
    if (!formData.title || !formData.date) {
      toast.error("Judul dan tanggal wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        const docRef = doc(db, "announcements", formData.id);
        await updateDoc(docRef, {
          title: formData.title,
          date: formData.date,
          size: formData.size || "0 KB",
          fileUrl: formData.fileUrl || "#",
        });
        toast.success("Pengumuman berhasil diperbarui");
      } else {
        await addDoc(collection(db, "announcements"), {
          title: formData.title,
          date: formData.date,
          size: formData.size || "0 KB",
          fileUrl: formData.fileUrl || "#",
          createdAt: serverTimestamp(),
        });
        toast.success("Pengumuman berhasil ditambahkan");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Save announcement error:", error);
      toast.error(
        "Terjadi kesalahan saat menyimpan data: " +
          (error.message || String(error)),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: Pengumuman) => {
    setFormData(item);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (
      !auth.currentUser &&
      localStorage.getItem("mock_admin_session") !== "true"
    ) {
      toast.error(
        "Anda sedang menggunakan Mode Akses Instan. Login untuk menghapus.",
      );
      return;
    }
    if (window.confirm("Apakah Anda yakin ingin menghapus pengumuman ini?")) {
      try {
        await deleteDoc(doc(db, "announcements", id));
        toast.success("Pengumuman berhasil dihapus");
        fetchData();
      } catch (error) {
        console.error(error);
        toast.error("Gagal menghapus pengumuman");
      }
    }
  };

  const openAddModal = () => {
    setFormData({ id: "", title: "", date: "", size: "", fileUrl: "" });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  if (loading) {
    return <div className="text-gray-500">Memuat data...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kelola Pengumuman</h1>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Tambah Data
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                No
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Judul
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tanggal
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-10 text-center text-gray-500"
                >
                  Belum ada data pengumuman.
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-red-500 shrink-0" />
                      <span className="line-clamp-1">{item.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatIndonesianDate(item.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-900 mx-2"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900 mx-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {isEditing ? "Edit Pengumuman" : "Tambah Pengumuman"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Judul Pengumuman
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      placeholder="cth: 15 Okt 2024 atau 2024-10-15"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white"
                    />
                    <div className="relative">
                      <input
                        type="date"
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            const dateObj = new Date(val);
                            const months = [
                              "Jan",
                              "Feb",
                              "Mar",
                              "Apr",
                              "Mei",
                              "Jun",
                              "Jul",
                              "Agu",
                              "Sep",
                              "Okt",
                              "Nov",
                              "Des",
                            ];
                            const day = dateObj.getDate();
                            const month = months[dateObj.getMonth()];
                            const year = dateObj.getFullYear();
                            const formattedIndo = `${day} ${month} ${year}`;
                            setFormData({ ...formData, date: formattedIndo });
                          }
                        }}
                        className="w-10 h-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm cursor-pointer bg-white"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Ketik manual atau klik kotak pemilih tanggal di sebelah
                    kanan untuk mengisi otomatis.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ukuran File (cth: 2.4 MB)
                  </label>
                  <input
                    type="text"
                    value={formData.size}
                    onChange={(e) =>
                      setFormData({ ...formData, size: e.target.value })
                    }
                    placeholder="Auto terisi jika memilih dari Drive atau ketik manual"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL File (PDF / Dokumen)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.fileUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, fileUrl: e.target.value })
                      }
                      placeholder="Masukkan URL Berkas, upload lokal,  "
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => openPicker((url) => setFormData({ ...formData, fileUrl: url }))}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-md flex items-center justify-center cursor-pointer transition-colors text-xs font-semibold shadow-sm gap-1 w-full"
                    >
                      <Upload size={14} /> Pilih dari Media
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                    ></button>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 text-sm font-medium transition-colors flex items-center justify-center min-w-[90px] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Simpan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
