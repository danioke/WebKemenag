import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, query, writeBatch } from '../../lib/db';
import { db, auth } from '../../lib/db';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Save, MoveUp, MoveDown, RefreshCw, X, Award, FileText, Users, Navigation, BookOpen, ShieldCheck, Heart, GraduationCap, Building2, HelpCircle, MapPin, Mail, Phone, PlusCircle } from 'lucide-react';
import RichTextEditor from '../../components/RichTextEditor';

// Define the Icon map
const iconMap: Record<string, any> = {
  Award,
  FileText,
  Users,
  Navigation,
  BookOpen,
  ShieldCheck,
  Heart,
  GraduationCap,
  Building2,
  HelpCircle,
  MapPin,
  Mail,
  Phone
};

const ICON_OPTIONS = [
  { name: 'Award (Visi & Misi)', value: 'Award' },
  { name: 'FileText (Tugas & Fungsi)', value: 'FileText' },
  { name: 'Users (Struktur)', value: 'Users' },
  { name: 'Navigation (Peta Lokasi)', value: 'Navigation' },
  { name: 'BookOpen (Bimas Islam)', value: 'BookOpen' },
  { name: 'GraduationCap (Madrasah)', value: 'GraduationCap' },
  { name: 'Building2 (Pesantren)', value: 'Building2' },
  { name: 'Heart (Pendidikan Agama)', value: 'Heart' },
  { name: 'ShieldCheck (Zakat/PPID)', value: 'ShieldCheck' },
  { name: 'HelpCircle (PTSP/Bantuan)', value: 'HelpCircle' },
  { name: 'MapPin (Lokasi)', value: 'MapPin' },
  { name: 'Mail (Email)', value: 'Mail' },
  { name: 'Phone (Telepon)', value: 'Phone' }
];

interface SubItem {
  name: string;
  id: string;
  icon: string;
  order: number;
  content?: string;
}

interface NavLink {
  id: string;
  name: string;
  href?: string;
  hasDropdown: boolean;
  order: number;
  subItems?: SubItem[];
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function NavigationAdmin() {
  const [data, setData] = useState<NavLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMainModalOpen, setIsMainModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [selectedMainItem, setSelectedMainItem] = useState<NavLink | null>(null);

  // Form State for Main Nav Item
  const [mainForm, setMainForm] = useState({
    id: '',
    name: '',
    href: '',
    hasDropdown: false,
    order: 1
  });
  const [isEditingMain, setIsEditingMain] = useState(false);

  // Form State for Submenu Nav Item
  const [subForm, setSubForm] = useState({
    name: '',
    id: '',
    icon: 'BookOpen',
    order: 1,
    content: ''
  });
  const [isEditingSub, setIsEditingSub] = useState(false);
  const [editingSubIndex, setEditingSubIndex] = useState<number | null>(null);

  // Reusable iframe-safe modal confirmation state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const fetchData = async () => {
    setLoading(true);
    const pathForList = 'navigation';
    try {
      const q = query(collection(db, pathForList), orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);
      let docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NavLink));
      
      if (docs.length === 0 || !docs[0].name) {
        console.log("Navigation collection is empty or invalid. Auto-seeding default menu and rich data...");
        await runSilentSeed();
        const refetchSnapshot = await getDocs(q);
        docs = refetchSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NavLink));
      }
      
      setData(docs);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, pathForList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getDefaultsList = () => [
    {
      name: 'Beranda',
      href: '/',
      hasDropdown: false,
      order: 1,
      subItems: []
    },
    {
      name: 'Profil',
      hasDropdown: true,
      order: 2,
      subItems: [
        {
          name: 'Visi dan Misi',
          id: 'visi-misi',
          icon: 'Award',
          order: 1,
          content: `<div class="space-y-6 text-gray-700 leading-relaxed text-sm">
  <div class="bg-green-50/50 p-5 rounded-2xl border border-green-100">
    <h4 class="font-bold text-green-900 text-base mb-2 uppercase tracking-wide">Visi Kemenag OKI</h4>
    <p class="italic text-gray-800">
      "Terwujudnya masyarakat Kabupaten Ogan Komering Ilir yang taat beragama, rukun, cerdas, dan mandiri serta sejahtera lahir batin dalam rangka mewujudkan Indonesia Maju yang berdaulat, mandiri, dan berkepribadian berlandaskan gotong royong."
    </p>
  </div>
  <div>
    <h4 class="font-bold text-gray-900 text-base mb-3 uppercase tracking-wide">Misi Kemenag OKI</h4>
    <ul class="space-y-3">
      <li class="flex gap-3">
        <span class="w-6 h-6 shrink-0 bg-green-700 text-white rounded-full flex items-center justify-center font-bold text-xs">1</span>
        <span>Meningkatkan kualitas kesalehan dan pemahaman ajaran agama di tengah masyarakat.</span>
      </li>
      <li class="flex gap-3">
        <span class="w-6 h-6 shrink-0 bg-green-700 text-white rounded-full flex items-center justify-center font-bold text-xs">2</span>
        <span>Memperkuat kerukunan umat beragama, moderasi beragama, serta harmonisasi keragaman.</span>
      </li>
      <li class="flex gap-3">
        <span class="w-6 h-6 shrink-0 bg-green-700 text-white rounded-full flex items-center justify-center font-bold text-xs">3</span>
        <span>Meningkatkan aksesibilitas dan kualitas layanan pendidikan agama serta keagamaan Islam, Kristen, Katolik, Hindu, Buddha, Khonghucu.</span>
      </li>
      <li class="flex gap-3">
        <span class="w-6 h-6 shrink-0 bg-green-700 text-white rounded-full flex items-center justify-center font-bold text-xs">4</span>
        <span>Meningkatkan profesionalitas, akuntabilitas, transparansi, dan efektivitas tata kelola birokrasi pemerintahan di lingkungan Kemenag OKI.</span>
      </li>
    </ul>
  </div>
</div>`
        },
        {
          name: 'Tugas dan Fungsi',
          id: 'tugas-fungsi',
          icon: 'FileText',
          order: 2,
          content: `<div class="space-y-6 text-gray-700 leading-relaxed text-sm">
  <div class="bg-amber-50/50 p-5 rounded-2xl border border-amber-100">
    <h4 class="font-bold text-amber-900 text-base mb-2 uppercase tracking-wide">Tugas Pokok</h4>
    <p>
      Kantor Kementerian Agama Kabupaten Ogan Komering Ilir memiliki tugas pokok melaksanakan urusan pemerintahan di bidang keagamaan dan keagamaan dalam wilayah Kabupaten OKI berdasarkan kebijakan Kepala Kantor Wilayah Kementerian Agama Provinsi Sumatera Selatan.
    </p>
  </div>
  <div>
    <h4 class="font-bold text-gray-900 text-base mb-3 uppercase tracking-wide">Fungsi Utama</h4>
    <ul class="space-y-3">
      <li class="flex gap-3"><span class="text-green-700 shrink-0 font-bold">•</span><span>Perumusan visi, misi, sasaran, rencana operasional, dan program kerja Kantor Kementerian Agama Kabupaten OKI.</span></li>
      <li class="flex gap-3"><span class="text-green-700 shrink-0 font-bold">•</span><span>Pelayanan, bimbingan, penyuluhan, dan pembinaan masyarakat Islam, Kristen, Katolik, Hindu, Buddha, serta Penyelenggaraan Haji dan Umrah.</span></li>
      <li class="flex gap-3"><span class="text-green-700 shrink-0 font-bold">•</span><span>Pembinaan dan penyelenggaraan Pendidikan Madrasah (RA, MI, MTs, MA), Pendidikan Diniyah dan Pondok Pesantren, serta Pendidikan Agama Islam di sekolah umum.</span></li>
      <li class="flex gap-3"><span class="text-green-700 shrink-0 font-bold">•</span><span>Pengawasan, evaluasi, dan penyusunan laporan akuntabilitas kinerja instansi keagamaan.</span></li>
    </ul>
  </div>
</div>`
        },
        {
          name: 'Struktur Organisasi',
          id: 'struktur-organisasi',
          icon: 'Users',
          order: 3,
          content: `<div class="space-y-6 text-gray-700 leading-relaxed text-sm">
  <p class="text-gray-500 italic text-center mb-4">Daftar pimpinan dan pejabat struktural di Kantor Kementerian Agama Kabupaten Ogan Komering Ilir:</p>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div class="p-4 border border-gray-100 rounded-xl bg-gray-50 hover:border-green-100 transition-colors">
      <span class="text-xs font-mono uppercase text-green-700 tracking-wider block mb-1">Kepala Kantor</span>
      <span class="font-bold text-gray-900 text-sm">H. Syarip, S.Ag., M.Pd.I.</span>
    </div>
    <div class="p-4 border border-gray-100 rounded-xl bg-gray-50 hover:border-green-100 transition-colors">
      <span class="text-xs font-mono uppercase text-green-700 tracking-wider block mb-1">Kepala Sub Bagian Tata Usaha</span>
      <span class="font-bold text-gray-900 text-sm">H. Muazni, S.Ag., M.Pd.I.</span>
    </div>
    <div class="p-4 border border-gray-100 rounded-xl bg-gray-50 hover:border-green-100 transition-colors">
      <span class="text-xs font-mono uppercase text-green-700 tracking-wider block mb-1">Kasi Bimas Islam</span>
      <span class="font-bold text-gray-900 text-sm">H. Ismadi, S.Ag.</span>
    </div>
    <div class="p-4 border border-gray-100 rounded-xl bg-gray-50 hover:border-green-100 transition-colors">
      <span class="text-xs font-mono uppercase text-green-700 tracking-wider block mb-1">Kasi Pendidikan Madrasah</span>
      <span class="font-bold text-gray-900 text-sm">H. Syamsul Azhar, S.Ag.</span>
    </div>
    <div class="p-4 border border-gray-100 rounded-xl bg-gray-50 hover:border-green-100 transition-colors">
      <span class="text-xs font-mono uppercase text-green-700 tracking-wider block mb-1">Kasi Pendidikan Diniyah & Pondok Pesantren</span>
      <span class="font-bold text-gray-900 text-sm">Drs. H. Mutiara</span>
    </div>
    <div class="p-4 border border-gray-100 rounded-xl bg-gray-50 hover:border-green-100 transition-colors">
      <span class="text-xs font-mono uppercase text-green-700 tracking-wider block mb-1">Kasi Penyelenggaraan Haji & Umrah</span>
      <span class="font-bold text-gray-900 text-sm">H. Mutawalli, M.Pd.I.</span>
    </div>
    <div class="p-4 border border-gray-100 rounded-xl bg-gray-50 hover:border-green-100 transition-colors">
      <span class="text-xs font-mono uppercase text-green-700 tracking-wider block mb-1">Kasi Pendidikan Agama Islam</span>
      <span class="font-bold text-gray-900 text-sm">H. Junaidi, S.Ag.</span>
    </div>
    <div class="p-4 border border-gray-100 rounded-xl bg-gray-50 hover:border-green-100 transition-colors">
      <span class="text-xs font-mono uppercase text-green-700 tracking-wider block mb-1">Penyelenggara Zakat & Wakaf</span>
      <span class="font-bold text-gray-900 text-sm">Hj. Marlina, S.Ag.</span>
    </div>
  </div>
</div>`
        },
        {
          name: 'Peta Lokasi',
          id: 'peta-lokasi',
          icon: 'Navigation',
          order: 4,
          content: `<div class="space-y-6 text-gray-700 leading-relaxed text-sm">
  <p class="text-gray-600">
    Silakan kunjungi Kantor Kementerian Agama Kabupaten Ogan Komering Ilir di alamat berikut:
  </p>
  <div class="bg-green-50/50 p-4 rounded-xl border border-green-100 text-sm space-y-2">
    <p class="font-bold text-green-900">Alamat Lengkap:</p>
    <p>Jl. Letnan Muchtar Saleh No. 1, Kelurahan Sidakersa, Kecamatan Kayuagung, Kabupaten Ogan Komering Ilir, Sumatera Selatan, Kode Pos 30613.</p>
    <p><strong>Telepon:</strong> (0711) 322123</p>
    <p><strong>Email resmi:</strong> kaboki@kemenag.go.id</p>
  </div>
  <div class="w-full h-64 rounded-xl border border-gray-200 overflow-hidden relative shadow-inner bg-gray-100 flex flex-col justify-center items-center p-4 text-center">
    <span class="font-bold text-gray-800 text-sm">Kayuagung, OKI</span>
    <span class="text-xs text-gray-400 mt-1 max-w-xs">Peta Lokasi Kantor Terintegrasi Wilayah Kabupaten OKI</span>
    <div class="absolute inset-0 bg-green-900/5 hover:bg-transparent transition-colors cursor-pointer flex items-end p-2 justify-center">
      <span class="text-[10px] bg-white px-2 py-1 rounded shadow text-gray-600 font-mono">Latitude: -3.3965, Longitude: 104.8398</span>
    </div>
  </div>
</div>`
        }
      ]
    },
    {
      name: 'Layanan',
      hasDropdown: true,
      order: 3,
      subItems: [
        {
          name: 'Bimas Islam',
          id: 'layanan-bimas',
          icon: 'BookOpen',
          order: 1,
          content: `<div class="space-y-4 text-gray-700 text-sm leading-relaxed">
  <p>Membidangi pendaftaran nikah dan bimbingan kepenghuluan, meliputi:</p>
  <ul class="space-y-2">
    <li><strong>SIMKAH Online:</strong> Pendaftaran nikah terintegrasi online melalui situs simkah4.kemenag.go.id.</li>
    <li><strong>Konsultasi Keluarga (BP4):</strong> Layanan mediasi, bimbingan keluarga harmonis, dan penyuluhan pranikah bagi calon pengantin.</li>
    <li><strong>Kemasjidan & Kiblat:</strong> Layanan kalibrasi arah kiblat, rekomendasi pendirian tempat ibadah, ID Masjid Nasional (SIMAS), serta pembinaan Majelis Taklim dan Penyuluh Agama.</li>
  </ul>
</div>`
        },
        {
          name: 'Pendidikan Madrasah',
          id: 'layanan-madrasah',
          icon: 'GraduationCap',
          order: 2,
          content: `<div class="space-y-4 text-gray-700 text-sm leading-relaxed">
  <p>Mengelola urusan administrasi dan mutu pada satuan pendidikan Raudhatul Athfal (RA), Madrasah Ibtidaiyah (MI), Madrasah Tsanawiyah (MTs), dan Madrasah Aliyah (MA):</p>
  <ul class="space-y-2">
    <li><strong>SIMPATIKA & EMIS:</strong> Pembaruan data tenaga pendidik, tunjangan guru madrasah, dan status keaktifan mengajar secara berkala.</li>
    <li><strong>Dana BOS & TPG:</strong> Pendistribusian Bantuan Operasional Sekolah (BOS) dan pembayaran Tunjangan Profesi Guru (TPG) bersertifikasi.</li>
    <li><strong>Mutasi Siswa & Izin Operasional (IJOP):</strong> Pengurusan mutasi rapor siswa antar madrasah dan rekomendasi perpanjangan izin operasional lembaga pendidikan.</li>
  </ul>
</div>`
        },
        {
          name: 'Pondok Pesantren',
          id: 'layanan-pesantren',
          icon: 'Building2',
          order: 3,
          content: `<div class="space-y-4 text-gray-700 text-sm leading-relaxed">
  <p>Pelayanan pembinaan, koordinasi, dan legalitas bagi institusi keagamaan Islam non-formal:</p>
  <ul class="space-y-2">
    <li><strong>Izin Operasional (IJOP):</strong> Pengurusan izin pendirian Pondok Pesantren, Madrasah Diniyah Takmiliyah (MDT), dan Lembaga Pendidikan Al-Qur'an (LPQ).</li>
    <li><strong>Program PIP & Beasiswa Santri:</strong> Validasi data santri berprestasi untuk program Indonesia Pintar dan bantuan infrastruktur pesantren.</li>
  </ul>
</div>`
        },
        {
          name: 'Pendidikan Agama Islam',
          id: 'layanan-pai',
          icon: 'Heart',
          order: 4,
          content: `<div class="space-y-4 text-gray-700 text-sm leading-relaxed">
  <p>Urusan pembinaan guru Agama Islam di sekolah umum (SD, SMP, SMA, SMK):</p>
  <ul class="space-y-2">
    <li><strong>Sertifikasi & TPG Non-PNS:</strong> Penyaluran tunjangan bagi guru agama Islam di bawah naungan Kemendikbudristek yang terdaftar di Kemenag.</li>
    <li><strong>Pembinaan Siswa & Rohis:</strong> Pelaksanaan pekan olahraga dan seni PAI (Pentas PAI) tingkat kabupaten serta pembinaan aktivitas keagamaan di sekolah.</li>
  </ul>
</div>`
        },
        {
          name: 'Zakat dan Wakaf',
          id: 'layanan-zakat-wakaf',
          icon: 'ShieldCheck',
          order: 5,
          content: `<div class="space-y-4 text-gray-700 text-sm leading-relaxed">
  <p>Fasilitasi pengelolaan zakat dan status legal aset tanah keagamaan:</p>
  <ul class="space-y-2">
    <li><strong>Sertifikasi Tanah Wakaf:</strong> Pendampingan pengurusan sertifikat tanah wakaf (bekerja sama dengan BPN OKI).</li>
    <li><strong>Pembinaan UPZ & Nazhir:</strong> Layanan sertifikasi kompetensi pengelola zakat (UPZ) dan pendaftaran kepengurusan nazhir tanah wakaf.</li>
  </ul>
</div>`
        },
        {
          name: 'Layanan Kecamatan (KUA)',
          id: 'layanan-kecamatan',
          icon: 'MapPin',
          order: 6,
          content: `<div class="space-y-6 text-gray-700 text-sm leading-relaxed">
  <div class="bg-green-50/70 p-4 rounded-xl border border-green-100 mb-4">
    <h5 class="font-bold text-green-900 mb-1">Kantor Urusan Agama (KUA) Kecamatan</h5>
    <p class="text-xs text-gray-600">
      Kementerian Agama Kabupaten Ogan Komering Ilir mengoordinasikan 18 Kantor Urusan Agama (KUA) Kecamatan untuk memberikan pelayanan pernikahan, rujuk, bimbingan keagamaan, kemasjidan, zakat, wakaf, dan kemaslahatan keluarga sakinah di tingkat kecamatan.
    </p>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
    <a href="http://kuakayuagung.kemenagoki.id/" target="_blank" rel="noopener noreferrer" class="p-3 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:border-green-500 transition-all flex items-start gap-2 group">
      <span class="w-5 h-5 shrink-0 bg-green-700 text-white rounded-full flex items-center justify-center font-bold text-[10px] group-hover:bg-green-600 transition-colors">1</span>
      <div>
        <h6 class="font-bold text-gray-900 text-xs group-hover:text-green-700 transition-colors">KUA Kecamatan Kayuagung</h6>
        <p class="text-[10px] text-gray-500 mt-0.5">Jl. Letnan Muchtar Saleh, Kayuagung, OKI</p>
      </div>
    </a>
    <a href="http://kuapedamaran.kemenagoki.id/" target="_blank" rel="noopener noreferrer" class="p-3 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:border-green-500 transition-all flex items-start gap-2 group">
      <span class="w-5 h-5 shrink-0 bg-green-700 text-white rounded-full flex items-center justify-center font-bold text-[10px] group-hover:bg-green-600 transition-colors">2</span>
      <div>
        <h6 class="font-bold text-gray-900 text-xs group-hover:text-green-700 transition-colors">KUA Kecamatan Pedamaran</h6>
        <p class="text-[10px] text-gray-500 mt-0.5">Jl. Raya Pedamaran, Kec. Pedamaran, OKI</p>
      </div>
    </a>
    <a href="http://kuatanjunglubuk.kemenagoki.id/" target="_blank" rel="noopener noreferrer" class="p-3 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:border-green-500 transition-all flex items-start gap-2 group">
      <span class="w-5 h-5 shrink-0 bg-green-700 text-white rounded-full flex items-center justify-center font-bold text-[10px] group-hover:bg-green-600 transition-colors">3</span>
      <div>
        <h6 class="font-bold text-gray-900 text-xs group-hover:text-green-700 transition-colors">KUA Kecamatan Tanjung Lubuk</h6>
        <p class="text-[10px] text-gray-500 mt-0.5">Jl. Lintas Timur, Kec. Tanjung Lubuk, OKI</p>
      </div>
    </a>
    <a href="http://kuasppadang.kemenagoki.id/" target="_blank" rel="noopener noreferrer" class="p-3 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:border-green-500 transition-all flex items-start gap-2 group">
      <span class="w-5 h-5 shrink-0 bg-green-700 text-white rounded-full flex items-center justify-center font-bold text-[10px] group-hover:bg-green-600 transition-colors">4</span>
      <div>
        <h6 class="font-bold text-gray-900 text-xs group-hover:text-green-700 transition-colors">KUA Kecamatan SP Padang</h6>
        <p class="text-[10px] text-gray-500 mt-0.5">Jl. Raya Sirah Pulau Padang, Kec. SP Padang, OKI</p>
      </div>
    </a>
    <a href="http://kuajejawi.kemenagoki.id/" target="_blank" rel="noopener noreferrer" class="p-3 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:border-green-500 transition-all flex items-start gap-2 group">
      <span class="w-5 h-5 shrink-0 bg-green-700 text-white rounded-full flex items-center justify-center font-bold text-[10px] group-hover:bg-green-600 transition-colors">5</span>
      <div>
        <h6 class="font-bold text-gray-900 text-xs group-hover:text-green-700 transition-colors">KUA Kecamatan Jejawi</h6>
        <p class="text-[10px] text-gray-500 mt-0.5">Jl. Raya Jejawi, Kec. Jejawi, OKI</p>
      </div>
    </a>
    <a href="http://kuapampangan.kemenagoki.id/" target="_blank" rel="noopener noreferrer" class="p-3 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:border-green-500 transition-all flex items-start gap-2 group">
      <span class="w-5 h-5 shrink-0 bg-green-700 text-white rounded-full flex items-center justify-center font-bold text-[10px] group-hover:bg-green-600 transition-colors">6</span>
      <div>
        <h6 class="font-bold text-gray-900 text-xs group-hover:text-green-700 transition-colors">KUA Kecamatan Pampangan</h6>
        <p class="text-[10px] text-gray-500 mt-0.5">Jl. Raya Pampangan, Kec. Pampangan, OKI</p>
      </div>
    </a>
    <a href="http://kualempuing.kemenagoki.id/" target="_blank" rel="noopener noreferrer" class="p-3 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:border-green-500 transition-all flex items-start gap-2 group">
      <span class="w-5 h-5 shrink-0 bg-green-700 text-white rounded-full flex items-center justify-center font-bold text-[10px] group-hover:bg-green-600 transition-colors">7</span>
      <div>
        <h6 class="font-bold text-gray-900 text-xs group-hover:text-green-700 transition-colors">KUA Kecamatan Lempuing</h6>
        <p class="text-[10px] text-gray-500 mt-0.5">Jl. Lintas Timur, Tugumulyo, Kec. Lempuing, OKI</p>
      </div>
    </a>
    <a href="http://kualempuingjaya.kemenagoki.id/" target="_blank" rel="noopener noreferrer" class="p-3 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:border-green-500 transition-all flex items-start gap-2 group">
      <span class="w-5 h-5 shrink-0 bg-green-700 text-white rounded-full flex items-center justify-center font-bold text-[10px] group-hover:bg-green-600 transition-colors">8</span>
      <div>
        <h6 class="font-bold text-gray-900 text-xs group-hover:text-green-700 transition-colors">KUA Kecamatan Lempuing Jaya</h6>
        <p class="text-[10px] text-gray-500 mt-0.5">Jl. Lintas Timur, Lubuk Seberuk, Kec. Lempuing Jaya, OKI</p>
      </div>
    </a>
    <a href="http://kuamesuji.kemenagoki.id/" target="_blank" rel="noopener noreferrer" class="p-3 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:border-green-500 transition-all flex items-start gap-2 group">
      <span class="w-5 h-5 shrink-0 bg-green-700 text-white rounded-full flex items-center justify-center font-bold text-[10px] group-hover:bg-green-600 transition-colors">9</span>
      <div>
        <h6 class="font-bold text-gray-900 text-xs group-hover:text-green-700 transition-colors">KUA Kecamatan Mesuji</h6>
        <p class="text-[10px] text-gray-500 mt-0.5">Jl. Lintas Timur, Kec. Mesuji, OKI</p>
      </div>
    </a>
    <a href="http://kuamesujimakmur.kemenagoki.id/" target="_blank" rel="noopener noreferrer" class="p-3 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:border-green-500 transition-all flex items-start gap-2 group">
      <span class="w-5 h-5 shrink-0 bg-green-700 text-white rounded-full flex items-center justify-center font-bold text-[10px] group-hover:bg-green-600 transition-colors">10</span>
      <div>
        <h6 class="font-bold text-gray-900 text-xs group-hover:text-green-700 transition-colors">KUA Kecamatan Mesuji Makmur</h6>
        <p class="text-[10px] text-gray-500 mt-0.5">Jl. Poros Mesuji Makmur, Kec. Mesuji Makmur, OKI</p>
      </div>
    </a>
    <a href="http://kuamesujiraya.kemenagoki.id/" target="_blank" rel="noopener noreferrer" class="p-3 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:border-green-500 transition-all flex items-start gap-2 group">
      <span class="w-5 h-5 shrink-0 bg-green-700 text-white rounded-full flex items-center justify-center font-bold text-[10px] group-hover:bg-green-600 transition-colors">11</span>
      <div>
        <h6 class="font-bold text-gray-900 text-xs group-hover:text-green-700 transition-colors">KUA Kecamatan Mesuji Raya</h6>
        <p class="text-[10px] text-gray-500 mt-0.5">Jl. Poros Mesuji Raya, Kec. Mesuji Raya, OKI</p>
      </div>
    </a>
    <a href="http://kuatulungselapan.kemenagoki.id/" target="_blank" rel="noopener noreferrer" class="p-3 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:border-green-500 transition-all flex items-start gap-2 group">
      <span class="w-5 h-5 shrink-0 bg-green-700 text-white rounded-full flex items-center justify-center font-bold text-[10px] group-hover:bg-green-600 transition-colors">12</span>
      <div>
        <h6 class="font-bold text-gray-900 text-xs group-hover:text-green-700 transition-colors">KUA Kecamatan Tulung Selapan</h6>
        <p class="text-[10px] text-gray-500 mt-0.5">Jl. Raya Tulung Selapan, Kec. Tulung Selapan, OKI</p>
      </div>
    </a>
    <a href="http://kuacengal.kemenagoki.id/" target="_blank" rel="noopener noreferrer" class="p-3 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:border-green-500 transition-all flex items-start gap-2 group">
      <span class="w-5 h-5 shrink-0 bg-green-700 text-white rounded-full flex items-center justify-center font-bold text-[10px] group-hover:bg-green-600 transition-colors">13</span>
      <div>
        <h6 class="font-bold text-gray-900 text-xs group-hover:text-green-700 transition-colors">KUA Kecamatan Cengal</h6>
        <p class="text-[10px] text-gray-500 mt-0.5">Jl. Raya Cengal, Kec. Cengal, OKI</p>
      </div>
    </a>
    <a href="http://kuasungaimenang.kemenagoki.id/" target="_blank" rel="noopener noreferrer" class="p-3 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:border-green-500 transition-all flex items-start gap-2 group">
      <span class="w-5 h-5 shrink-0 bg-green-700 text-white rounded-full flex items-center justify-center font-bold text-[10px] group-hover:bg-green-600 transition-colors">14</span>
      <div>
        <h6 class="font-bold text-gray-900 text-xs group-hover:text-green-700 transition-colors">KUA Kecamatan Sungai Menang</h6>
        <p class="text-[10px] text-gray-500 mt-0.5">Jl. Raya Sungai Menang, Kec. Sungai Menang, OKI</p>
      </div>
    </a>
    <a href="http://kuaairsugihan.kemenagoki.id/" target="_blank" rel="noopener noreferrer" class="p-3 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:border-green-500 transition-all flex items-start gap-2 group">
      <span class="w-5 h-5 shrink-0 bg-green-700 text-white rounded-full flex items-center justify-center font-bold text-[10px] group-hover:bg-green-600 transition-colors">15</span>
      <div>
        <h6 class="font-bold text-gray-900 text-xs group-hover:text-green-700 transition-colors">KUA Kecamatan Air Sugihan</h6>
        <p class="text-[10px] text-gray-500 mt-0.5">Jl. Poros Air Sugihan, Kec. Air Sugihan, OKI</p>
      </div>
    </a>
    <a href="http://kuapangkalanlampam.kemenagoki.id/" target="_blank" rel="noopener noreferrer" class="p-3 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:border-green-500 transition-all flex items-start gap-2 group">
      <span class="w-5 h-5 shrink-0 bg-green-700 text-white rounded-full flex items-center justify-center font-bold text-[10px] group-hover:bg-green-600 transition-colors">16</span>
      <div>
        <h6 class="font-bold text-gray-900 text-xs group-hover:text-green-700 transition-colors">KUA Kecamatan Pangkalan Lampam</h6>
        <p class="text-[10px] text-gray-500 mt-0.5">Jl. Raya Pangkalan Lampam, Kec. Pangkalan Lampam, OKI</p>
      </div>
    </a>
    <a href="http://kuatelukgelam.kemenagoki.id/" target="_blank" rel="noopener noreferrer" class="p-3 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:border-green-500 transition-all flex items-start gap-2 group">
      <span class="w-5 h-5 shrink-0 bg-green-700 text-white rounded-full flex items-center justify-center font-bold text-[10px] group-hover:bg-green-600 transition-colors">17</span>
      <div>
        <h6 class="font-bold text-gray-900 text-xs group-hover:text-green-700 transition-colors">KUA Kecamatan Teluk Gelam</h6>
        <p class="text-[10px] text-gray-500 mt-0.5">Jl. Lintas Timur, Kec. Teluk Gelam, OKI</p>
      </div>
    </a>
    <a href="http://kuapedamarantimur.kemenagoki.id/" target="_blank" rel="noopener noreferrer" class="p-3 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:border-green-500 transition-all flex items-start gap-2 group">
      <span class="w-5 h-5 shrink-0 bg-green-700 text-white rounded-full flex items-center justify-center font-bold text-[10px] group-hover:bg-green-600 transition-colors">18</span>
      <div>
        <h6 class="font-bold text-gray-900 text-xs group-hover:text-green-700 transition-colors">KUA Kecamatan Pedamaran Timur</h6>
        <p class="text-[10px] text-gray-500 mt-0.5">Jl. Poros Pedamaran Timur, Kec. Pedamaran Timur, OKI</p>
      </div>
    </a>
  </div>
</div>`
        }
      ]
    },
    {
      name: 'Berita',
      href: '#berita',
      hasDropdown: false,
      order: 4,
      subItems: []
    },
    {
      name: 'PPID',
      hasDropdown: true,
      order: 5,
      subItems: [
        {
          name: 'Informasi PPID',
          id: 'ppid-info',
          icon: 'ShieldCheck',
          order: 1,
          content: `<div class="space-y-4 text-gray-700 text-sm leading-relaxed">
  <p><strong>Pejabat Pengelola Informasi dan Dokumentasi (PPID)</strong></p>
  <p>Kami berkomitmen untuk menyediakan kemudahan dalam permohonan informasi publik sesuai dengan Undang-Undang No. 14 Tahun 2008 tentang Keterbukaan Informasi Publik.</p>
  <div class="bg-green-50 p-4 rounded-xl border border-green-100">
    <p class="font-bold text-green-900 mb-1">Mekanisme Permohonan:</p>
    <ol class="list-decimal pl-4 space-y-1">
      <li>Pemohon mengisi formulir permohonan informasi online / datang langsung.</li>
      <li>Membawa kartu identitas diri yang sah (KTP/SIM/Paspor).</li>
      <li>Petugas PPID memproses permohonan maksimal dalam waktu 10 hari kerja.</li>
    </ol>
  </div>
  <p class="text-xs text-gray-500 italic">* Layanan ini bebas biaya dalam rangka mewujudkan transparansi penuh.</p>
</div>`
        }
      ]
    },
    {
      name: 'Kontak',
      href: '#kontak',
      hasDropdown: false,
      order: 6,
      subItems: []
    }
  ];

  const runSilentSeed = async () => {
    try {
      const defaults = getDefaultsList();
      for (const item of defaults) {
        await addDoc(collection(db, 'navigation'), item);
      }
    } catch (e) {
      console.error("Failed silent seeding of navigation defaults", e);
    }
  };

  // Seeding default initial menu helper
  const seedDefaultNavigation = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Atur Ulang Navigasi',
      message: 'Apakah Anda yakin ingin mengatur ulang navigasi ke setelan bawaan? Seluruh perubahan kustom akan hilang.',
      onConfirm: async () => {
        setLoading(true);
        try {
          // 1. Delete all existing navigation
          const q = query(collection(db, 'navigation'));
          const snapshot = await getDocs(q);
          const deletePromises = snapshot.docs.map(docSnapshot => deleteDoc(doc(db, 'navigation', docSnapshot.id)));
          await Promise.all(deletePromises);

          // 2. Add defaults
          const defaults = getDefaultsList();
          for (const item of defaults) {
            await addDoc(collection(db, 'navigation'), item);
          }

          toast.success('Navigasi berhasil diatur ulang ke setelan bawaan');
          fetchData();
        } catch (error) {
          toast.error('Gagal mengatur ulang navigasi');
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Main Nav item handlers
  const handleMainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainForm.name) {
      toast.error('Nama Navigasi wajib diisi');
      return;
    }

    try {
      const dataPayload = {
        name: mainForm.name,
        href: mainForm.hasDropdown ? '' : mainForm.href,
        hasDropdown: mainForm.hasDropdown,
        order: Number(mainForm.order),
        subItems: isEditingMain ? (data.find(d => d.id === mainForm.id)?.subItems || []) : []
      };

      if (isEditingMain) {
        const docRef = doc(db, 'navigation', mainForm.id);
        await updateDoc(docRef, dataPayload);
        toast.success('Navigasi Utama berhasil diperbarui');
      } else {
        await addDoc(collection(db, 'navigation'), {
          ...dataPayload,
          createdAt: serverTimestamp()
        });
        toast.success('Navigasi Utama berhasil ditambahkan');
      }

      setIsMainModalOpen(false);
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'navigation');
      toast.error('Gagal menyimpan navigasi');
    }
  };

  const handleEditMain = (item: NavLink) => {
    setMainForm({
      id: item.id,
      name: item.name,
      href: item.href || '',
      hasDropdown: item.hasDropdown,
      order: item.order
    });
    setIsEditingMain(true);
    setIsMainModalOpen(true);
  };

  const handleDeleteMain = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Menu Navigasi',
      message: 'Hapus menu navigasi ini? Seluruh sub-menu di dalamnya juga akan terhapus.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'navigation', id));
          toast.success('Menu navigasi berhasil dihapus');
          fetchData();
        } catch (error) {
          toast.error('Gagal menghapus menu navigasi');
        }
      }
    });
  };

  const openAddMainModal = () => {
    setMainForm({
      id: '',
      name: '',
      href: '',
      hasDropdown: false,
      order: data.length > 0 ? Math.max(...data.map(d => d.order)) + 1 : 1
    });
    setIsEditingMain(false);
    setIsMainModalOpen(true);
  };

  // Move ordering helpers
  const handleMoveOrder = async (item: NavLink, direction: 'up' | 'down') => {
    const currentIndex = data.findIndex(d => d.id === item.id);
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === data.length - 1) return;

    const swapTarget = direction === 'up' ? data[currentIndex - 1] : data[currentIndex + 1];

    try {
      const docRef1 = doc(db, 'navigation', item.id);
      const docRef2 = doc(db, 'navigation', swapTarget.id);

      await updateDoc(docRef1, { order: swapTarget.order });
      await updateDoc(docRef2, { order: item.order });

      toast.success('Urutan berhasil diperbarui');
      fetchData();
    } catch (error) {
      toast.error('Gagal memperbarui urutan');
    }
  };

  // Submenu handlers
  const openAddSubModal = (parent: NavLink) => {
    setSelectedMainItem(parent);
    setSubForm({
      name: '',
      id: '',
      icon: 'BookOpen',
      order: parent.subItems && parent.subItems.length > 0 ? Math.max(...parent.subItems.map(s => s.order)) + 1 : 1,
      content: ''
    });
    setIsEditingSub(false);
    setEditingSubIndex(null);
    setIsSubModalOpen(true);
  };

  const handleEditSub = (parent: NavLink, subItem: SubItem, index: number) => {
    setSelectedMainItem(parent);
    setSubForm({
      name: subItem.name,
      id: subItem.id,
      icon: subItem.icon || 'BookOpen',
      order: subItem.order,
      content: subItem.content || ''
    });
    setIsEditingSub(true);
    setEditingSubIndex(index);
    setIsSubModalOpen(true);
  };

  const handleSubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subForm.name || !subForm.id) {
      toast.error('Nama Sub-Menu dan ID (Slug) wajib diisi');
      return;
    }

    if (!selectedMainItem) return;

    try {
      const currentSubItems = [...(selectedMainItem.subItems || [])];

      const newSubItem: SubItem = {
        name: subForm.name,
        id: subForm.id,
        icon: subForm.icon,
        order: Number(subForm.order),
        content: subForm.content
      };

      if (isEditingSub && editingSubIndex !== null) {
        currentSubItems[editingSubIndex] = newSubItem;
      } else {
        currentSubItems.push(newSubItem);
      }

      // Sort by order
      currentSubItems.sort((a, b) => a.order - b.order);

      const docRef = doc(db, 'navigation', selectedMainItem.id);
      await updateDoc(docRef, { subItems: currentSubItems });

      toast.success('Sub-Menu berhasil disimpan');
      setIsSubModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Gagal menyimpan sub-menu');
    }
  };

  const handleDeleteSub = (parent: NavLink, index: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Sub-Menu',
      message: 'Hapus sub-menu ini?',
      onConfirm: async () => {
        try {
          const currentSubItems = [...(parent.subItems || [])];
          currentSubItems.splice(index, 1);

          const docRef = doc(db, 'navigation', parent.id);
          await updateDoc(docRef, { subItems: currentSubItems });

          toast.success('Sub-menu berhasil dihapus');
          fetchData();
        } catch (error) {
          toast.error('Gagal menghapus sub-menu');
        }
      }
    });
  };

  if (loading && data.length === 0) {
    return (
      <div className="flex items-center gap-2 text-gray-500 py-10 justify-center">
        <RefreshCw className="animate-spin text-green-700" />
        <span>Memuat data navigasi...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Menu Navigasi</h1>
          <p className="text-sm text-gray-500 mt-1">Atur urutan, menu utama, submenu, dan isi konten modal detail secara dinamis.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={seedDefaultNavigation}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <RefreshCw size={16} /> Setelan Bawaan (Reset)
          </button>
          <button
            onClick={openAddMainModal}
            className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <Plus size={16} /> Tambah Menu Utama
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {data.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <Navigation className="mx-auto text-gray-400 mb-3" size={48} />
            <h3 className="font-bold text-gray-800 text-base">Belum Ada Menu Navigasi</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">Silakan klik "Setelan Bawaan" untuk memuat struktur awal, atau "Tambah Menu Utama" untuk membuat baru.</p>
          </div>
        ) : (
          data.map((item, idx) => {
            return (
              <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:border-green-100 transition-all">
                {/* Main Header Row */}
                <div className="px-6 py-4 flex items-center justify-between flex-wrap gap-4 bg-gray-50/50 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-md font-bold">
                      Order: {item.order}
                    </div>
                    <span className="font-bold text-gray-800 text-base">{item.name}</span>
                    {item.href && (
                      <span className="text-xs bg-blue-50 text-blue-700 font-mono px-2 py-0.5 rounded border border-blue-100">
                        {item.href}
                      </span>
                    )}
                    {item.hasDropdown && (
                      <span className="text-xs bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded border border-purple-100 flex items-center gap-1">
                        Dropdown ({item.subItems?.length || 0})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/* Ordering control */}
                    <button
                      onClick={() => handleMoveOrder(item, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30 transition-colors"
                      title="Pindahkan Ke Atas"
                    >
                      <MoveUp size={16} />
                    </button>
                    <button
                      onClick={() => handleMoveOrder(item, 'down')}
                      disabled={idx === data.length - 1}
                      className="p-1.5 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30 transition-colors"
                      title="Pindahkan Ke Bawah"
                    >
                      <MoveDown size={16} />
                    </button>

                    <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>

                    {/* Edit/Delete */}
                    <button
                      onClick={() => handleEditMain(item)}
                      className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMain(item.id)}
                      className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} /> Hapus
                    </button>
                  </div>
                </div>

                {/* Dropdown / SubItems Area */}
                {item.hasDropdown && (
                  <div className="p-5 bg-white space-y-3">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Sub-Menu / Dropdown Items</h4>
                      <button
                        onClick={() => openAddSubModal(item)}
                        className="flex items-center gap-1 text-xs font-semibold text-green-700 hover:text-green-800"
                      >
                        <PlusCircle size={14} /> Tambah Sub-Menu
                      </button>
                    </div>

                    {!item.subItems || item.subItems.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">Belum ada sub-menu. Klik "Tambah Sub-Menu" di kanan atas.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {item.subItems.map((sub, sidx) => {
                          const SubIcon = iconMap[sub.icon] || BookOpen;
                          return (
                            <div key={sidx} className="p-3.5 border border-gray-100 rounded-xl bg-gray-50/50 flex flex-col justify-between hover:border-green-100 transition-colors">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="p-1.5 bg-green-50 text-green-700 rounded-md">
                                    <SubIcon size={16} />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-gray-800 text-sm">{sub.name}</span>
                                    <span className="text-[10px] text-gray-400 font-mono">Slug: {sub.id} (Order: {sub.order})</span>
                                  </div>
                                </div>
                                {sub.content && (
                                  <div className="text-[11px] text-gray-500 line-clamp-2 bg-white border border-gray-100 p-2 rounded mb-3">
                                    Konten detail modal aktif
                                  </div>
                                )}
                              </div>
                              <div className="flex justify-end gap-2 border-t border-gray-100 pt-2 mt-2">
                                <button
                                  onClick={() => handleEditSub(item, sub, sidx)}
                                  className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                                >
                                  <Edit size={12} /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteSub(item, sidx)}
                                  className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-0.5"
                                >
                                  <Trash2 size={12} /> Hapus
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Main Nav Edit/Create Modal */}
      {isMainModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 shrink-0">
              <h3 className="text-lg font-bold text-gray-900">{isEditingMain ? 'Edit Menu Utama' : 'Tambah Menu Utama'}</h3>
              <button onClick={() => setIsMainModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleMainSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Navigasi</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Profil, Berita"
                  value={mainForm.name}
                  onChange={(e) => setMainForm({ ...mainForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="hasDropdown"
                  checked={mainForm.hasDropdown}
                  onChange={(e) => setMainForm({ ...mainForm, hasDropdown: e.target.checked })}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="hasDropdown" className="text-sm font-medium text-gray-700 select-none">
                  Memiliki Dropdown (Sub-menu)
                </label>
              </div>

              {!mainForm.hasDropdown && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link URL / Anchor</label>
                  <input
                    type="text"
                    placeholder="Contoh: / , #berita , #kontak"
                    value={mainForm.href}
                    onChange={(e) => setMainForm({ ...mainForm, href: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Urutan (Order)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={mainForm.order}
                  onChange={(e) => setMainForm({ ...mainForm, order: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsMainModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-md text-sm font-medium transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-menu Edit/Create Modal */}
      {isSubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 shrink-0">
              <h3 className="text-lg font-bold text-gray-900">
                {isEditingSub ? `Edit Sub-Menu di ${selectedMainItem?.name}` : `Tambah Sub-Menu di ${selectedMainItem?.name}`}
              </h3>
              <button onClick={() => setIsSubModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <form id="sub-menu-form" onSubmit={handleSubSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Sub-Menu</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Visi dan Misi"
                      value={subForm.name}
                      onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Unik / Slug (ID Modal)</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: visi-misi"
                      value={subForm.id}
                      onChange={(e) => setSubForm({ ...subForm, id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Icon</label>
                    <select
                      value={subForm.icon}
                      onChange={(e) => setSubForm({ ...subForm, icon: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    >
                      {ICON_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Urutan (Order)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={subForm.order}
                      onChange={(e) => setSubForm({ ...subForm, order: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Isi Konten Detail (Modal Popup HTML)</label>
                  <p className="text-xs text-gray-400 mb-1.5">Tulis penjelasan detail yang akan muncul dalam popup modal ketika sub-menu diklik oleh publik.</p>
                  <div className="bg-white border border-gray-200 rounded-md overflow-hidden min-h-[180px]">
                    <RichTextEditor
                      value={subForm.content}
                      onChange={(val) => setSubForm({ ...subForm, content: val })}
                      minHeight="180px"
                    />
                  </div>
                </div>
              </form>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsSubModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                form="sub-menu-form"
                className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-md text-sm font-medium transition-colors"
              >
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
            <h3 className="text-lg font-bold text-gray-900 mb-2">{confirmModal.title}</h3>
            <p className="text-sm text-gray-600 mb-6">{confirmModal.message}</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
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
