import React, { useState, useEffect, useMemo, useRef } from "react";
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
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  X,
  CloudDownload,
  Upload,
  Eye,
} from "lucide-react";
import { Link } from "react-router-dom";
import { createSlug } from "../../lib/helpers";
import RichTextEditor from "../../components/RichTextEditor";
import { useMediaPickerStore } from "../../store/useMediaPickerStore";
interface Berita {
  id: string;
  title: string;
  category: string;
  date: string;
  author: string;
  image: string;
  excerpt: string;
}

export default function BeritaAdmin() {
  const [data, setData] = useState<Berita[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    category: "",
    date: "",
    author: "",
    image: "",
    excerpt: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const { openPicker } = useMediaPickerStore();

  // Reusable iframe-safe modal confirmation state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get current news items for the page
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = data.slice(startIndex, startIndex + itemsPerPage);

  // Adjust current page if it exceeds totalPages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [data, currentPage, totalPages]);

  const fetchData = async () => {
    try {
      const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Berita,
      );
      setData(docs);

      const catSnap = await getDocs(
        query(collection(db, "categories"), orderBy("name", "asc")),
      );
      setCategories(
        catSnap.docs.map((doc) => ({ id: doc.id, name: doc.data().name })),
      );
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengambil data berita");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 10MB");
      return;
    }
    const form = new FormData();
    form.append("file", file);
    setUploading(true);
    toast.info("Mengunggah gambar...");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (res.ok) {
        const result = await res.json();
        setFormData({ ...formData, image: result.url });
        toast.success("Gambar berhasil diunggah");
      } else {
        toast.error("Gagal mengunggah gambar");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat mengunggah");
    } finally {
      setUploading(false);
    }
  };

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
    if (!formData.title || !formData.date || !formData.category) {
      toast.error("Judul, kategori, dan tanggal wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        const docRef = doc(db, "news", formData.id);
        await updateDoc(docRef, {
          title: formData.title,
          category: formData.category,
          date: formData.date,
          author: formData.author,
          image: formData.image,
          excerpt: formData.excerpt,
        });
        toast.success("Berita berhasil diperbarui");
      } else {
        await addDoc(collection(db, "news"), {
          title: formData.title,
          category: formData.category,
          date: formData.date,
          author: formData.author,
          image: formData.image,
          excerpt: formData.excerpt,
          createdAt: serverTimestamp(),
        });
        toast.success("Berita berhasil ditambahkan");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat menyimpan data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: Berita) => {
    setFormData(item);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (
      !auth.currentUser &&
      localStorage.getItem("mock_admin_session") !== "true"
    ) {
      toast.error(
        "Anda sedang menggunakan Mode Akses Instan. Login untuk menghapus.",
      );
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: "Hapus Berita",
      message: "Apakah Anda yakin ingin menghapus berita ini?",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "news", id));
          toast.success("Berita berhasil dihapus");
          fetchData();
        } catch (error) {
          console.error(error);
          toast.error("Gagal menghapus berita");
        }
      },
    });
  };

  const openAddModal = () => {
    setFormData({
      id: "",
      title: "",
      category: "",
      date: "",
      author: "",
      image: "",
      excerpt: "",
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  if (loading) {
    return <div className="text-gray-500">Memuat data...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Kelola Berita</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Tambah Berita
          </button>
          <Link
            to="/admin/berita/import"
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <CloudDownload size={16} /> Import WordPress
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                No
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Judul
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kategori
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
            {currentItems.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-gray-500"
                >
                  Belum ada data berita.
                </td>
              </tr>
            ) : (
              currentItems.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    <div className="flex items-center gap-4">
                      {item.image ? (
                        <div className="w-16 h-12 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-12 flex-shrink-0 bg-gray-100 rounded-md flex items-center justify-center border border-gray-200">
                          <FileText className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <span className="line-clamp-2">{item.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatIndonesianDate(item.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/berita/${createSlug(item.title) || item.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-gray-900 bg-gray-50 p-1.5 rounded-md"
                      >
                        <Eye size={16} />
                      </Link>
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 p-1.5 rounded-md"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded-md"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4">
            <p className="text-sm text-gray-600">
              Menampilkan{" "}
              <span className="font-semibold">{startIndex + 1}</span> -{" "}
              <span className="font-semibold">
                {Math.min(startIndex + itemsPerPage, data.length)}
              </span>{" "}
              dari <span className="font-semibold">{data.length}</span> berita
            </p>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-medium transition-colors ${
                        currentPage === page
                          ? "bg-green-700 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 shrink-0">
              <h3 className="text-lg font-bold text-gray-900">
                {isEditing ? "Edit Berita" : "Tambah Berita"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              <form
                id="berita-form"
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Judul Berita
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kategori
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    >
                      <option value="">Pilih Kategori</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                      <option value="Berita Utama">
                        Berita Utama (Manual)
                      </option>
                      <option value="Pendidikan">Pendidikan (Manual)</option>
                      <option value="Keagamaan">Keagamaan (Manual)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Penulis (Author)
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) =>
                      setFormData({ ...formData, author: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gambar Header
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) =>
                        setFormData({ ...formData, image: e.target.value })
                      }
                      placeholder="Masukkan URL Gambar, upload lokal,  "
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => openPicker((url) => setFormData({ ...formData, image: url }))}
                      className="bg-gray-100 hover:bg-gray-200 border border-gray-300 px-4 py-2 rounded-md flex items-center justify-center relative z-10 cursor-pointer transition-colors text-gray-700 text-sm w-full"
                    >
                      <Upload size={16}/> Pilih Media
                    </button>
                  </div>
                  {formData.image && (
                    <div className="mt-3 aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Isi Berita
                  </label>
                  <div className="bg-white border border-gray-300 rounded-md overflow-hidden quill-editor-container">
                    <RichTextEditor
                      value={formData.excerpt}
                      onChange={(content) =>
                        setFormData({ ...formData, excerpt: content })
                      }
                      minHeight="350px"
                    />
                  </div>
                </div>
              </form>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                form="berita-form"
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : null}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {confirmModal.title}
            </h3>
            <p className="text-sm text-gray-600 mb-6">{confirmModal.message}</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setConfirmModal({ ...confirmModal, isOpen: false })
                }
                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal({ ...confirmModal, isOpen: false });
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-green-700 hover:bg-green-800 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
