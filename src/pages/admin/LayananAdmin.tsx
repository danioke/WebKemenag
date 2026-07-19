import React, { useState, useEffect } from "react";
import { db, auth } from "../../lib/db";
import { useMediaPickerStore } from "../../store/useMediaPickerStore";
import { doc, getDoc, setDoc } from "../../lib/db";
import { toast } from "sonner";
import RichTextEditor from "../../components/RichTextEditor";
import {
  Plus,
  Trash2,
  Edit2,
  GraduationCap,
  BookOpen,
  Building2,
  Book,
  User,
  Image as ImageIcon,
  Briefcase,
  FileText,
  Loader2,
  Save,
  X,
  Award,
  Upload,
} from "lucide-react";

// Default values for fallbacks
const defaultLayananData: Record<string, any> = {
  "pendidikan-madrasah": {
    title: "Pendidikan Madrasah",
    tugasFungsi: `
      <p class="mb-4">Seksi Pendidikan Madrasah mempunyai tugas melakukan pelayanan, bimbingan teknis, pembinaan, serta pengelolaan data dan informasi pada satuan pendidikan Raudhatul Athfal (RA), Madrasah Ibtidaiyah (MI), Madrasah Tsanawiyah (MTs), dan Madrasah Aliyah (MA) di bawah naungan Kantor Kementerian Agama Kabupaten Ogan Komering Ilir.</p>
      <h4 class="font-bold text-gray-900 mt-6 mb-3 text-lg">Tugas & Fungsi Utama:</h4>
      <ul class="list-disc pl-5 space-y-2 text-gray-700">
        <li>Penyusunan kebijakan teknis operasional kurikulum, kesiswaan, kelembagaan, sarana prasarana, serta pendidik dan tenaga kependidikan madrasah.</li>
        <li>Pelaksanaan pelayanan administrasi kesiswaan, meliputi pengurusan mutasi siswa, validasi kelulusan, dan rekomendasi izin pendirian operasional madrasah baru.</li>
        <li>Pelaksanaan bimbingan teknis, monitoring, evaluasi, dan pelaporan pelaksanaan program peningkatan mutu pembelajaran.</li>
        <li>Pengelolaan sistem informasi pendidikan melalui verifikasi EMIS (Education Management Information System) dan SIMPATIKA pendidik secara berkala.</li>
        <li>Fasilitasi penyaluran dana Bantuan Operasional Sekolah (BOS) dan pembayaran Tunjangan Profesi Guru (TPG) bersertifikasi.</li>
      </ul>
    `,
    kasiName: "Muh. Sobari, S.Pd.I.,M.Pd.",
    kasiPhoto:
      "https://images.unsplash.com/photo-1564683214965-3619addd900d?auto=format&fit=crop&q=80&w=400",
    staf: [
      {
        id: "1",
        name: "Ahmad Fauzi, S.Pd.I",
        role: "Pelaksana Kelembagaan & SIMPATIKA",
        photo:
          "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&q=80&w=250",
      },
      {
        id: "2",
        name: "Siti Rahma, M.Pd.",
        role: "Pengelola Kurikulum & Kesiswaan",
        photo:
          "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&q=80&w=250",
      },
      {
        id: "3",
        name: "Budi Santoso, S.E.",
        role: "Pengelola Sarana & Prasarana",
        photo:
          "https://images.unsplash.com/photo-1585036156171-384164a8c675?auto=format&fit=crop&q=80&w=250",
      },
      {
        id: "4",
        name: "Eka Lestari, S.Sos.",
        role: "Admin EMIS & Keuangan",
        photo:
          "https://images.unsplash.com/photo-1604085572504-a392ddf0d86a?auto=format&fit=crop&q=80&w=250",
      },
    ],
  },
  "bimas-islam": {
    title: "Bimbingan Masyarakat Islam",
    tugasFungsi: `
      <p class="mb-4">Seksi Bimbingan Masyarakat Islam mempunyai tugas melaksanakan pembinaan, bimbingan teknis, fasilitasi, pelayanan, serta pengelolaan data dan informasi di bidang kepenghuluan, pemberdayaan KUA, keluarga sakinah, kemasjidan, zakat, wakaf, dan penerangan agama Islam.</p>
      <h4 class="font-bold text-gray-900 mt-6 mb-3 text-lg">Tugas & Fungsi Utama:</h4>
      <ul class="list-disc pl-5 space-y-2 text-gray-700">
        <li>Perumusan teknis bimbingan kemasjidan, pemeliharaan arah kiblat, serta pengelolaan pendaftaran masjid/mushalla ke sistem nasional SIMAS.</li>
        <li>Pelayanan pendaftaran, pemeriksaan nikah, rujuk, pembinaan administrasi kepenghuluan KUA, serta bimbingan calon pengantin (Bimwin).</li>
        <li>Fasilitasi sertifikasi tanah wakaf keagamaan dan pembinaan nazhir (pengelola tanah wakaf) berkolaborasi dengan BPN Kabupaten OKI.</li>
        <li>Pembinaan dan pembekalan materi dakwah bagi penyuluh agama Islam fungsional maupun non-ASN untuk memperkuat moderasi beragama.</li>
        <li>Pemantauan serta evaluasi tata kelola zakat, UPZ (Unit Pengumpul Zakat) kecamatan, dan lembaga filantropi Islam lainnya.</li>
      </ul>
    `,
    kasiName: "H. Ismid, S.Ag,.M.M",
    kasiPhoto:
      "https://images.unsplash.com/photo-1604085572504-a392ddf0d86a?auto=format&fit=crop&q=80&w=400",
    staf: [
      {
        id: "1",
        name: "Hidayatullah, S.Th.I",
        role: "Penyuluh Agama Islam Ahli Muda",
        photo:
          "https://images.unsplash.com/photo-1564683214965-3619addd900d?auto=format&fit=crop&q=80&w=250",
      },
      {
        id: "2",
        name: "Drs. Iskandar",
        role: "Pengelola Pemberdayaan KUA & Masjid",
        photo:
          "https://images.unsplash.com/photo-1604085572504-a392ddf0d86a?auto=format&fit=crop&q=80&w=250",
      },
      {
        id: "3",
        name: "Muryadi, S.H.",
        role: "Pranata Humas & Urusan Wakaf",
        photo:
          "https://images.unsplash.com/photo-1519817914152-2a041fdd68c6?auto=format&fit=crop&q=80&w=250",
      },
    ],
  },
  "pondok-pesantren": {
    title: "Pendidikan Diniyah & Pondok Pesantren",
    tugasFungsi: `
      <p class="mb-4">Seksi Pendidikan Diniyah dan Pondok Pesantren mempunyai tugas melaksanakan pelayanan administrasi, pembinaan kurikulum, serta bimbingan teknis kelembagaan bagi Pondok Pesantren, Madrasah Diniyah Takmiliyah (MDT), dan Lembaga Pendidikan Al-Qur'an (LPQ) di Kabupaten OKI.</p>
      <h4 class="font-bold text-gray-900 mt-6 mb-3 text-lg">Tugas & Fungsi Utama:</h4>
      <ul class="list-disc pl-5 space-y-2 text-gray-700">
        <li>Verifikasi pengajuan baru dan pembaruan izin operasional (Tanda Daftar) Pondok Pesantren, MDT, serta LPQ dalam sistem EMIS PD Pontren.</li>
        <li>Pembinaan kurikulum pembelajaran pesantren, koordinasi ujian akhir diniyah, dan pengawasan kualitas pendidikan madrasah non-formal.</li>
        <li>Verifikasi, validasi, dan penyaluran Program Indonesia Pintar (PIP) khusus santri kurang mampu di lingkungan pondok pesantren.</li>
        <li>Penyelenggaraan program beasiswa santri berprestasi serta pembinaan tata kelola kelembagaan dan kemandirian ekonomi pesantren.</li>
        <li>Penyusunan pelaporan, rekomendasi proposal bantuan fasilitas fisik, serta sarana penunjang aktivitas belajar mengajar santri.</li>
      </ul>
    `,
    kasiName: "H. Syamsul Bahri, S.Ag.,M.M",
    kasiPhoto:
      "https://images.unsplash.com/photo-1585036156171-384164a8c675?auto=format&fit=crop&q=80&w=400",
    staf: [
      {
        id: "1",
        name: "Siti Aminah, S.Ag.",
        role: "Pengelola Sarana Prasarana Diniyah",
        photo:
          "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&q=80&w=250",
      },
      {
        id: "2",
        name: "Zulkarnain, S.Pd.I",
        role: "Pelaksana EMIS & Kelembagaan Pesantren",
        photo:
          "https://images.unsplash.com/photo-1551041777-ed277b8ce348?auto=format&fit=crop&q=80&w=250",
      },
    ],
  },
  "sertifikasi-halal": {
    title: "Layanan Sertifikasi Halal",
    tugasFungsi: "",
    syarat: `
      <div class="space-y-6">
        <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-emerald-900">
          <h4 class="text-xl font-bold mb-2 flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
            Program Sertifikasi Halal Gratis (SEHATI)
          </h4>
          <p class="text-sm leading-relaxed text-emerald-800">
            Kementerian Agama RI melalui Badan Penyelenggara Jaminan Produk Halal (BPJPH) memfasilitasi program Sertifikasi Halal Gratis (SEHATI) dengan mekanisme self-declare bagi para pelaku Usaha Mikro dan Kecil (UMK) di seluruh Indonesia, termasuk di Kabupaten OKI.
          </p>
        </div>

        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h4 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            Syarat Pendaftaran Sertifikasi Halal (Self Declare):
          </h4>
          <ul class="space-y-3 text-sm text-gray-600">
            <li class="flex gap-3">
              <span class="text-emerald-600 font-bold shrink-0">✓</span>
              <span>Produk tidak berisiko atau menggunakan bahan yang sudah dipastikan kehalalannya (sudah memiliki sertifikat halal sebelumnya).</span>
            </li>
            <li class="flex gap-3">
              <span class="text-emerald-600 font-bold shrink-0">✓</span>
              <span>Proses produksi dipastikan kehalalannya dan bersifat sederhana.</span>
            </li>
            <li class="flex gap-3">
              <span class="text-emerald-600 font-bold shrink-0">✓</span>
              <span>Memiliki Nomor Induk Berusaha (NIB) berbasis risiko.</span>
            </li>
            <li class="flex gap-3">
              <span class="text-emerald-600 font-bold shrink-0">✓</span>
              <span>Memiliki omset penjualan tahunan maksimal Rp 500.000.000 (Lima Ratus Juta Rupiah).</span>
            </li>
            <li class="flex gap-3">
              <span class="text-emerald-600 font-bold shrink-0">✓</span>
              <span>Memiliki outlet / fasilitas produksi maksimal 1 (satu) lokasi.</span>
            </li>
            <li class="flex gap-3">
              <span class="text-emerald-600 font-bold shrink-0">✓</span>
              <span>Bersedia mendampingi proses verifikasi bahan bersama Pendamping PPH (Proses Produk Halal) setempat.</span>
            </li>
          </ul>
        </div>

        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 mb-20 sm:mb-6">
          <h4 class="text-lg font-bold text-gray-900 mb-4">Alur Sertifikasi Halal Gratis (SEHATI):</h4>
          <div class="relative ml-4 sm:ml-0 pl-6 border-l-2 border-emerald-100 space-y-6">
            <div class="relative">
              <div class="absolute -left-9 top-0.5 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md shadow-emerald-600/20">
                1
              </div>
              <h5 class="font-bold text-gray-900 text-sm mb-1">Registrasi Akun SIHALAL</h5>
              <p class="text-xs text-gray-500">Pelaku usaha mendaftar akun di portal resmi <a href="https://ptsp.halal.go.id" target="_blank" rel="noopener noreferrer" class="text-emerald-700 hover:underline font-semibold">ptsp.halal.go.id</a> menggunakan email aktif atau NIB.</p>
            </div>
            <div class="relative">
              <div class="absolute -left-9 top-0.5 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md shadow-emerald-600/20">
                2
              </div>
              <h5 class="font-bold text-gray-900 text-sm mb-1">Lengkapi Profil & Unggah Dokumen</h5>
              <p class="text-xs text-gray-500">Mengisi profil badan usaha, detail produk, daftar bahan baku yang digunakan, serta mengunggah surat pernyataan mandiri pelaku usaha (self declare).</p>
            </div>
            <div class="relative">
              <div class="absolute -left-9 top-0.5 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md shadow-emerald-600/20">
                3
              </div>
              <h5 class="font-bold text-gray-900 text-sm mb-1">Verifikasi & Validasi oleh Pendamping PPH</h5>
              <p class="text-xs text-gray-500">Pendamping PPH (Proses Produk Halal) Kabupaten OKI akan melakukan audit lapangan untuk mengecekan bahan, peralatan, dan proses produksi.</p>
            </div>
            <div class="relative">
              <div class="absolute -left-9 top-0.5 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md shadow-emerald-600/20">
                4
              </div>
              <h5 class="font-bold text-gray-900 text-sm mb-1">Sidang Fatwa MUI & Sertifikat Terbit</h5>
              <p class="text-xs text-gray-500">Hasil verifikasi dikirim ke Komite Fatwa MUI untuk menyetujui kehalalan produk, kemudian BPJPH menerbitkan Sertifikat Halal resmi secara elektronik.</p>
            </div>
          </div>
        </div>
      </div>
    `,
  },
  "pendidikan-agama-islam": {
    title: "Pendidikan Agama Islam (PAIS)",
    tugasFungsi: `
      <p class="mb-4">Seksi Pendidikan Agama Islam (PAIS) mempunyai tugas melakukan pelayanan, bimbingan teknis, pembinaan, serta pengelolaan data and informasi Pendidikan Agama Islam pada Pendidikan Anak Usia Dini (PAUD), Taman Kanak-Kanak (TK), Sekolah Dasar (SD), Sekolah Menengah Pertama (SMP), Sekolah Menengah Atas (SMA), dan Sekolah Menengah Kejuruan (SMK) di bawah naungan Kantor Kementerian Agama Kabupaten Ogan Komering Ilir.</p>
      <h4 class="font-bold text-gray-900 mt-6 mb-3 text-lg">Tugas & Fungsi Utama:</h4>
      <ul class="list-disc pl-5 space-y-2 text-gray-700">
        <li>Penyusunan kebijakan teknis operasional kurikulum, kesiswaan, kelembagaan, sarana prasarana, serta pendidik dan tenaga kependidikan Agama Islam pada sekolah umum.</li>
        <li>Pelaksanaan pelayanan administrasi pendidik Agama Islam (GPAI) meliputi bimbingan sertifikasi dan peningkatan kompetensi guru.</li>
        <li>Pelaksanaan bimbingan teknis, monitoring, evaluasi, dan pelaporan pelaksanaan program peningkatan mutu pembelajaran Pendidikan Agama Islam.</li>
        <li>Pengelolaan sistem informasi pendidikan melalui verifikasi database SIAGA (Sistem Informasi dan Administrasi Guru Agama) secara berkala.</li>
        <li>Fasilitasi penyaluran tunjangan profesi guru (TPG) bersertifikasi bagi Guru Pendidikan Agama Islam pada sekolah.</li>
      </ul>
    `,
    kasiName: "Hj. Zubaidah, S.Ag.",
    kasiPhoto:
      "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&q=80&w=400",
    staf: [
      {
        id: "1",
        name: "Rahmat Hidayat, S.Pd.I",
        role: "Pengelola Data SIAGA & TPG PAIS",
        photo:
          "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&q=80&w=250",
      },
      {
        id: "2",
        name: "Nurlaila, S.Th.I",
        role: "Pelaksana Kurikulum & Evaluasi PAIS",
        photo:
          "https://images.unsplash.com/photo-1585036156171-384164a8c675?auto=format&fit=crop&q=80&w=250",
      },
    ],
  },
};

interface StafItem {
  id: string;
  name: string;
  role: string;
  photo: string;
}

export default function LayananAdmin() {
  const [activeTab, setActiveTab] = useState("pendidikan-madrasah");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states for selected service
  const [title, setTitle] = useState("");
  const [tugasFungsi, setTugasFungsi] = useState("");
  const [kasiName, setKasiName] = useState("");
  const [kasiPhoto, setKasiPhoto] = useState("");
  const [staf, setStaf] = useState<StafItem[]>([]);
  const [syarat, setSyarat] = useState("");

  // Staf Modal state for adding/editing a staff member
  const [isStafModalOpen, setIsStafModalOpen] = useState(false);
  const [editingStaf, setEditingStaf] = useState<StafItem | null>(null);
  const [stafFormData, setStafFormData] = useState({
    name: "",
    role: "",
    photo: "",
  });

  const [uploadingKasi, setUploadingKasi] = useState(false);
  const [uploadingStaf, setUploadingStaf] = useState(false);
  const { openPicker } = useMediaPickerStore();

  const handleUploadKasi = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 10MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", "foto_pejabat");

    setUploadingKasi(true);
    toast.info("Mengunggah foto pejabat...");
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setKasiPhoto(data.url);
        toast.success("Foto pejabat berhasil diunggah");
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal mengunggah foto");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat mengunggah");
    } finally {
      setUploadingKasi(false);
      e.target.value = "";
    }
  };

  const handleUploadStaf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 10MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", "foto_staf");

    setUploadingStaf(true);
    toast.info("Mengunggah foto staf...");
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setStafFormData((prev) => ({ ...prev, photo: data.url }));
        toast.success("Foto staf berhasil diunggah");
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal mengunggah foto");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat mengunggah");
    } finally {
      setUploadingStaf(false);
      e.target.value = "";
    }
  };

  const loadLayananData = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "layanan_data", activeTab);
      const docSnap = await getDoc(docRef);

      const fallback = defaultLayananData[activeTab];
      if (docSnap.exists()) {
        const fetched = docSnap.data();
        setTitle(fetched.title || fallback.title);
        setTugasFungsi(
          fetched.tugasFungsi !== undefined
            ? fetched.tugasFungsi
            : fallback.tugasFungsi,
        );
        setKasiName(
          fetched.kasiName !== undefined ? fetched.kasiName : fallback.kasiName,
        );
        setKasiPhoto(
          fetched.kasiPhoto !== undefined
            ? fetched.kasiPhoto
            : fallback.kasiPhoto,
        );
        setStaf(
          fetched.staf !== undefined ? fetched.staf : fallback.staf || [],
        );
        setSyarat(
          fetched.syarat !== undefined ? fetched.syarat : fallback.syarat || "",
        );
      } else {
        setTitle(fallback.title);
        setTugasFungsi(fallback.tugasFungsi || "");
        setKasiName(fallback.kasiName || "");
        setKasiPhoto(fallback.kasiPhoto || "");
        setStaf(fallback.staf || []);
        setSyarat(fallback.syarat || "");
      }
    } catch (error) {
      console.error("Gagal mengambil data:", error);
      toast.error(
        "Gagal mengambil data layanan dari database, menggunakan data bawaan",
      );
      const fallback = defaultLayananData[activeTab];
      setTitle(fallback.title);
      setTugasFungsi(fallback.tugasFungsi || "");
      setKasiName(fallback.kasiName || "");
      setKasiPhoto(fallback.kasiPhoto || "");
      setStaf(fallback.staf || []);
      setSyarat(fallback.syarat || "");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLayananData();
  }, [activeTab]);

  const handleSave = async () => {
    if (
      !auth.currentUser &&
      localStorage.getItem("mock_admin_session") !== "true"
    ) {
      toast.error(
        "Anda sedang menggunakan Mode Akses Instan. Login untuk menyimpan perubahan.",
      );
      return;
    }

    setSaving(true);
    try {
      const docRef = doc(db, "layanan_data", activeTab);
      await setDoc(
        docRef,
        {
          id: activeTab,
          title,
          tugasFungsi,
          kasiName,
          kasiPhoto,
          staf,
          syarat,
          updatedAt: new Date(),
        },
        { merge: true },
      );

      toast.success("Data layanan berhasil diperbarui!");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan data ke database");
    } finally {
      setSaving(false);
    }
  };

  // Staff Management functions
  const handleOpenAddStaf = () => {
    setEditingStaf(null);
    setStafFormData({ name: "", role: "", photo: "" });
    setIsStafModalOpen(true);
  };

  const handleOpenEditStaf = (item: StafItem) => {
    setEditingStaf(item);
    setStafFormData({
      name: item.name,
      role: item.role,
      photo: item.photo,
    });
    setIsStafModalOpen(true);
  };

  const handleSaveStaf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stafFormData.name.trim()) {
      toast.error("Nama staf wajib diisi");
      return;
    }

    if (editingStaf) {
      // Edit existing
      setStaf((prev) =>
        prev.map((s) =>
          s.id === editingStaf.id ? { ...s, ...stafFormData } : s,
        ),
      );
      toast.success("Biodata staf diperbarui");
    } else {
      // Add new
      const newStaf: StafItem = {
        id: Date.now().toString(),
        name: stafFormData.name.trim(),
        role: stafFormData.role.trim() || "Staf Pelaksana",
        photo:
          stafFormData.photo.trim() ||
          "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&q=80&w=250",
      };
      setStaf((prev) => [...prev, newStaf]);
      toast.success("Staf baru ditambahkan");
    }
    setIsStafModalOpen(false);
  };

  const handleDeleteStaf = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus staf ini?")) {
      setStaf((prev) => prev.filter((s) => s.id !== id));
      toast.success(
        "Staf terhapus dari daftar (klik 'Simpan Perubahan' untuk menerapkan)",
      );
    }
  };

  const tabs = [
    {
      id: "pendidikan-madrasah",
      name: "Pendidikan Madrasah",
      icon: GraduationCap,
    },
    { id: "bimas-islam", name: "Bimas Islam", icon: BookOpen },
    { id: "pondok-pesantren", name: "Pondok Pesantren", icon: Building2 },
    { id: "sertifikasi-halal", name: "Sertifikasi Halal", icon: Book },
    {
      id: "pendidikan-agama-islam",
      name: "Pendidikan Agama Islam (PAIS)",
      icon: Award,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-green-700" />
            Integrasi Layanan Utama
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Ubah tugas pokok, kepala seksi, syarat, dan tim staf pelaksana untuk
            setiap bidang layanan utama.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading || saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-95"
        >
          {saving ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Save size={16} />
          )}
          Simpan Semua Perubahan
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto gap-2">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "border-green-700 text-green-700 bg-green-50/50 rounded-t-xl"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <TabIcon size={16} />
              {tab.name}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
          <Loader2 className="animate-spin text-green-700" size={28} />
          <span>Memuat formulir layanan...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title / Judul Bidang */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Nama Bidang Layanan (Header)
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              />
            </div>

            {/* Custom inputs depending on type */}
            {activeTab === "sertifikasi-halal" ? (
              /* If Sertifikasi Halal, edit Syarat/Alur */
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Deskripsi Lengkap, Alur & Syarat Sertifikasi Halal
                  </label>
                  <span className="text-[10px] text-green-700 font-bold bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                    Mendukung HTML & Formatter
                  </span>
                </div>
                <div
                  className="border border-gray-200 rounded-xl overflow-hidden"
                  style={{ minHeight: "450px" }}
                >
                  <RichTextEditor value={syarat} onChange={setSyarat} />
                </div>
              </div>
            ) : (
              /* If Madrasah, Bimas, or Pesantren: edit Tugas & Fungsi */
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Tugas Pokok & Fungsi (HTML Editor)
                  </label>
                  <span className="text-[10px] text-green-700 font-bold bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                    Mendukung HTML & Formatter
                  </span>
                </div>
                <div
                  className="border border-gray-200 rounded-xl overflow-hidden"
                  style={{ minHeight: "400px" }}
                >
                  <RichTextEditor
                    value={tugasFungsi}
                    onChange={setTugasFungsi}
                  />
                </div>
              </div>
            )}

            {/* List of Staff: Only for Madrasah, Bimas, and Pesantren */}
            {activeTab !== "sertifikasi-halal" && (
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Daftar Staf Pelaksana
                    </label>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Kelola tim staf pelaksana yang akan tampil pada carousel
                      foto staf.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddStaf}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 rounded-lg text-xs font-bold transition-all"
                  >
                    <Plus size={14} />
                    Tambah Staf
                  </button>
                </div>

                {staf.length === 0 ? (
                  <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">
                    Belum ada staf yang terdaftar. Klik "Tambah Staf" untuk
                    mendaftarkan biodata staf baru.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {staf.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="p-3 border border-gray-100 bg-gray-50/50 rounded-xl flex items-center justify-between gap-3 hover:bg-white transition-all hover:shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-gray-200 bg-gray-100">
                            <img
                              src={item.photo}
                              alt={item.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&q=80&w=250";
                              }}
                            />
                          </div>
                          <div>
                            <h5 className="font-bold text-gray-900 text-xs line-clamp-1">
                              {item.name}
                            </h5>
                            <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">
                              {item.role}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditStaf(item)}
                            className="p-1 hover:bg-gray-100 text-gray-500 hover:text-green-700 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStaf(item.id)}
                            className="p-1 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Kepala Seksi (Kasi) - Skip for Sertifikasi Halal */}
          <div className="space-y-6">
            {activeTab !== "sertifikasi-halal" ? (
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2">
                  Profil Kepala Seksi (Kasi)
                </label>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                      <User size={12} /> Nama Lengkap Kasi
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: H. Syamsul, S.Ag."
                      value={kasiName}
                      onChange={(e) => setKasiName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    />
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                        <ImageIcon size={12} /> URL Foto Kepala Seksi / Pejabat
                      </label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={kasiPhoto}
                        onChange={(e) => setKasiPhoto(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                        &nbsp;
                      </label>
                      <button
                        type="button"
                        onClick={() => openPicker((url) => setKasiPhoto(url))}
                        className={`flex items-center justify-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-xl text-xs font-semibold cursor-pointer transition-colors w-full mt-2`}
                      >
                        <Upload size={14} />
                        <span>Pilih Foto dari Media</span>
                      </button>
                    </div>
                  </div>

                  <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/50 flex flex-col items-center text-center">
                    <p className="text-[10px] text-gray-400 mb-2">
                      Pratinjau Foto Kasi
                    </p>
                    <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-white shadow-sm bg-white">
                      <img
                        src={kasiPhoto}
                        alt="Kasi"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&q=80&w=300";
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 space-y-2">
                <Book size={24} className="text-amber-700" />
                <h5 className="font-bold text-xs">
                  Informasi Sertifikasi Halal:
                </h5>
                <p className="text-[11px] text-amber-800 leading-normal">
                  Sertifikasi Halal dikoordinasikan langsung di bawah Badan
                  Penyelenggara Jaminan Produk Halal (BPJPH) Kemenag RI. Detail
                  Kasi tidak dimunculkan karena program ini melayani secara
                  terpadu melalui satgas PTSP.
                </p>
              </div>
            )}

            {/* Quick Helper Panel */}
            <div className="bg-gray-50 border border-gray-200/50 rounded-2xl p-5 space-y-3">
              <h5 className="font-bold text-xs text-gray-700">
                Petunjuk Editor:
              </h5>
              <ul className="list-disc pl-4 text-[10px] text-gray-500 space-y-1.5 leading-relaxed">
                <li>
                  Gunakan editor teks TinyMCE di sebelah kiri untuk memformat
                  teks list, cetak tebal (bold), ataupun link pendaftaran.
                </li>
                <li>
                  Setelah mengubah nama seksi, tugas, kasi, maupun tim staf,
                  pastikan mengklik tombol{" "}
                  <strong className="text-green-700">
                    "Simpan Semua Perubahan"
                  </strong>{" "}
                  di pojok kanan atas.
                </li>
                <li>
                  Gunakan tautan gambar yang bersumber dari media repository
                  atau tautan Unsplash beresolusi tinggi.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Staff Add/Edit Modal */}
      {isStafModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                {editingStaf ? "Edit Biodata Staf" : "Tambah Staf Baru"}
              </h3>
              <button
                onClick={() => setIsStafModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveStaf} className="p-4 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <User size={12} /> Nama Lengkap & Gelar
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Akhmad Fauzi, S.Kom."
                  value={stafFormData.name}
                  onChange={(e) =>
                    setStafFormData({ ...stafFormData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Briefcase size={12} /> Peran / Jabatan Pelaksana
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pengelola SIMPATIKA"
                  value={stafFormData.role}
                  onChange={(e) =>
                    setStafFormData({ ...stafFormData, role: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <ImageIcon size={12} /> URL Foto Staf
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={stafFormData.photo}
                    onChange={(e) =>
                      setStafFormData({
                        ...stafFormData,
                        photo: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  />
                  <p className="text-[9px] text-gray-400 mt-0.5">
                    Biarkan kosong untuk foto default.
                  </p>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                    &nbsp;
                  </label>
                  <button
                    type="button"
                    onClick={() => openPicker((url) => setStafFormData({ ...stafFormData, photo: url }))}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-xl text-xs font-semibold cursor-pointer transition-colors w-full mt-2`}
                  >
                    <Upload size={14} />
                    <span>Pilih dari Media</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsStafModalOpen(false)}
                  className="px-3.5 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-green-700 text-white rounded-lg text-xs font-bold hover:bg-green-800 transition-all active:scale-95"
                >
                  Simpan Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
