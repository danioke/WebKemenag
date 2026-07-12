import React, { useState, useEffect } from 'react';
import { Menu, X, Facebook, Instagram, Youtube, Phone, Mail, MapPin, ChevronDown, ChevronRight, Award, FileText, Users, Navigation, BookOpen, ShieldCheck, Heart, GraduationCap, Building2, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, query, orderBy } from '../lib/db';
import { db } from '../lib/db';
import { useSettingsStore } from '../store/useSettingsStore';
import { useNavigate } from 'react-router-dom';

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

interface SubItem {
  name: string;
  id: string;
  icon?: any;
}

interface NavLink {
  name: string;
  href?: string;
  hasDropdown?: boolean;
  subItems?: SubItem[];
}

const staticNavLinks: NavLink[] = [
  { name: 'Beranda', href: '/' },
  { 
    name: 'Profil', 
    hasDropdown: true, 
    subItems: [
      { name: 'Visi dan Misi', id: 'visi-misi', icon: Award },
      { name: 'Tugas dan Fungsi', id: 'tugas-fungsi', icon: FileText },
      { name: 'Struktur Organisasi', id: 'struktur-organisasi', icon: Users },
      { name: 'Peta Lokasi', id: 'peta-lokasi', icon: Navigation }
    ]
  },
  { 
    name: 'Layanan', 
    hasDropdown: true, 
    subItems: [
      { name: 'Bimas Islam', id: 'layanan-bimas', icon: BookOpen },
      { name: 'Pendidikan Madrasah', id: 'layanan-madrasah', icon: GraduationCap },
      { name: 'Pondok Pesantren', id: 'layanan-pesantren', icon: Building2 },
      { name: 'Pendidikan Agama Islam', id: 'layanan-pai', icon: Heart },
      { name: 'Zakat dan Wakaf', id: 'layanan-zakat-wakaf', icon: ShieldCheck },
      { name: 'Layanan Kecamatan (KUA)', id: 'layanan-kecamatan', icon: MapPin }
    ]
  },
  { name: 'Berita', href: '#berita' },
  { 
    name: 'PPID', 
    hasDropdown: true,
    subItems: [
      { name: 'Informasi PPID', id: 'ppid-info', icon: ShieldCheck }
    ]
  },
  { name: 'Kontak', href: '#kontak' },
];

export default function Header() {
  const { logoUrl, contactInfo, socialMedia } = useSettingsStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Interactive Modal State
  const [selectedItem, setSelectedItem] = useState<{ title: string; subtitle: string; icon: any; content: React.ReactNode } | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [navLinks, setNavLinks] = useState<NavLink[]>(staticNavLinks);
  console.log('Rendering navLinks:', navLinks);

  useEffect(() => {
    const q = query(collection(db, 'navigation'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        if (snapshot && !snapshot.empty && snapshot.docs && snapshot.docs.length > 0) {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
          // Pastikan item tidak kosong
          if (items.length > 0 && items[0].name) {
            setNavLinks(items);
          } else {
            setNavLinks(staticNavLinks);
          }
        } else {
          setNavLinks(staticNavLinks);
        }
      } catch (err) {
        console.error("Error processing navigation snapshot", err);
        setNavLinks(staticNavLinks);
      }
    }, (error) => {
      console.error("Failed to fetch dynamic navigation", error);
      setNavLinks(staticNavLinks);
    });

    return () => unsubscribe();
  }, []);

  // Handler for opening the Info Modal with rich details
  const handleItemClick = (id: string, name: string) => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
    setMobileDropdownOpen(null);

    // Dynamic contents mapping
    let title = name;
    let subtitle = 'Kementerian Agama Kabupaten Ogan Komering Ilir';
    let icon = BookOpen;
    let content: React.ReactNode = null;

    // Find if there is a matching dynamic submenu item with custom content in Firestore
    const matchedSubItem = navLinks
      .flatMap(link => link.subItems || [])
      .find(sub => sub.id === id);

    if (matchedSubItem && (matchedSubItem as any).content) {
      icon = (typeof matchedSubItem.icon === 'string' ? iconMap[matchedSubItem.icon] : matchedSubItem.icon) || BookOpen;
      content = (
        <div 
          className="prose max-w-none text-gray-700 leading-relaxed text-sm"
          dangerouslySetInnerHTML={{ __html: (matchedSubItem as any).content }}
        />
      );
    } else if (id === 'visi-misi') {
      icon = Award;
      title = 'Visi & Misi';
      content = (
        <div className="space-y-6 text-gray-700 leading-relaxed text-sm">
          <div className="bg-green-50/50 p-5 rounded-2xl border border-green-100">
            <h4 className="font-bold text-green-900 text-base mb-2 uppercase tracking-wide">Visi Kemenag OKI</h4>
            <p className="italic text-gray-800">
              "Terwujudnya masyarakat Kabupaten Ogan Komering Ilir yang taat beragama, rukun, cerdas, dan mandiri serta sejahtera lahir batin dalam rangka mewujudkan Indonesia Maju yang berdaulat, mandiri, dan berkepribadian berlandaskan gotong royong."
            </p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-base mb-3 uppercase tracking-wide">Misi Kemenag OKI</h4>
            <ul className="space-y-3">
              {[
                "Meningkatkan kualitas kesalehan dan pemahaman ajaran agama di tengah masyarakat.",
                "Memperkuat kerukunan umat beragama, moderasi beragama, serta harmonisasi keragaman.",
                "Meningkatkan aksesibilitas dan kualitas layanan pendidikan agama serta keagamaan Islam, Kristen, Katolik, Hindu, Buddha, Khonghucu.",
                "Meningkatkan profesionalitas, akuntabilitas, transparansi, dan efektivitas tata kelola birokrasi pemerintahan di lingkungan Kemenag OKI."
              ].map((misi, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="w-6 h-6 shrink-0 bg-green-700 text-white rounded-full flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </span>
                  <span>{misi}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    } else if (id === 'tugas-fungsi') {
      icon = FileText;
      title = 'Tugas & Fungsi';
      content = (
        <div className="space-y-6 text-gray-700 leading-relaxed text-sm">
          <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100">
            <h4 className="font-bold text-amber-900 text-base mb-2 uppercase tracking-wide">Tugas Pokok</h4>
            <p>
              Kantor Kementerian Agama Kabupaten Ogan Komering Ilir memiliki tugas pokok melaksanakan urusan pemerintahan di bidang keagamaan dan keagamaan dalam wilayah Kabupaten OKI berdasarkan kebijakan Kepala Kantor Wilayah Kementerian Agama Provinsi Sumatera Selatan.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-base mb-3 uppercase tracking-wide">Fungsi Utama</h4>
            <ul className="space-y-3">
              {[
                "Perumusan visi, misi, sasaran, rencana operasional, dan program kerja Kantor Kementerian Agama Kabupaten OKI.",
                "Pelayanan, bimbingan, penyuluhan, dan pembinaan masyarakat Islam, Kristen, Katolik, Hindu, Buddha, serta Penyelenggaraan Haji dan Umrah.",
                "Pembinaan dan penyelenggaraan Pendidikan Madrasah (RA, MI, MTs, MA), Pendidikan Diniyah dan Pondok Pesantren, serta Pendidikan Agama Islam di sekolah umum.",
                "Pengawasan, evaluasi, dan penyusunan laporan akuntabilitas kinerja instansi keagamaan."
              ].map((func, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="text-green-700 shrink-0 font-bold">•</span>
                  <span>{func}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    } else if (id === 'struktur-organisasi') {
      icon = Users;
      title = 'Struktur Organisasi';
      content = (
        <div className="space-y-6 text-gray-700 leading-relaxed text-sm">
          <p className="text-gray-500 italic text-center mb-4">Daftar pimpinan dan pejabat struktural di Kantor Kementerian Agama Kabupaten Ogan Komering Ilir:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { role: 'Kepala Kantor', name: 'H. Syarip, S.Ag., M.Pd.I.' },
              { role: 'Kepala Sub Bagian Tata Usaha', name: 'H. Muazni, S.Ag., M.Pd.I.' },
              { role: 'Kasi Bimas Islam', name: 'H. Ismadi, S.Ag.' },
              { role: 'Kasi Pendidikan Madrasah', name: 'H. Syamsul Azhar, S.Ag.' },
              { role: 'Kasi Pendidikan Diniyah & Pondok Pesantren', name: 'Drs. H. Mutiara' },
              { role: 'Kasi Penyelenggaraan Haji & Umrah', name: 'H. Mutawalli, M.Pd.I.' },
              { role: 'Kasi Pendidikan Agama Islam', name: 'H. Junaidi, S.Ag.' },
              { role: 'Penyelenggara Zakat & Wakaf', name: 'Hj. Marlina, S.Ag.' }
            ].map((p, idx) => (
              <div key={idx} className="p-4 border border-gray-100 rounded-xl bg-gray-50 hover:border-green-100 transition-colors">
                <span className="text-xs font-mono uppercase text-green-700 tracking-wider block mb-1">{p.role}</span>
                <span className="font-bold text-gray-900 text-sm">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      );
    } else if (id === 'peta-lokasi') {
      icon = Navigation;
      title = 'Peta Lokasi Kantor';
      content = (
        <div className="space-y-6 text-gray-700 leading-relaxed text-sm">
          <p className="text-gray-600">
            Silakan kunjungi Kantor Kementerian Agama Kabupaten Ogan Komering Ilir di alamat berikut:
          </p>
          <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 text-sm space-y-2">
            <p className="font-bold text-green-900">Alamat Lengkap:</p>
            <p>{contactInfo.address}</p>
            <p><strong>Telepon:</strong> {contactInfo.phone}</p>
            <p><strong>Email resmi:</strong> {contactInfo.email}</p>
          </div>
          <div className="w-full h-64 rounded-xl border border-gray-200 overflow-hidden relative shadow-inner bg-gray-100 p-0">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3983.393457597155!2d104.8351059!3d-3.3761763!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e3b1c8f4b1e5f8b%3A0xcb4bb7d896a2db84!2sKantor%20Kementerian%20Agama%20Kab.%20OKI!5e0!3m2!1sen!2sid!4v1714493351984!5m2!1sen!2sid" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      );
    } else if (id === 'layanan-bimas') {
      icon = BookOpen;
      title = 'Layanan Bimas Islam';
      content = (
        <div className="space-y-4 text-gray-700 text-sm leading-relaxed">
          <p>Membidangi pendaftaran nikah dan bimbingan kepenghuluan, meliputi:</p>
          <ul className="space-y-2">
            <li><strong>SIMKAH Online:</strong> Pendaftaran nikah terintegrasi online melalui situs simkah4.kemenag.go.id.</li>
            <li><strong>Konsultasi Keluarga (BP4):</strong> Layanan mediasi, bimbingan keluarga harmonis, dan penyuluhan pranikah bagi calon pengantin.</li>
            <li><strong>Kemasjidan & Kiblat:</strong> Layanan kalibrasi arah kiblat, rekomendasi pendirian tempat ibadah, ID Masjid Nasional (SIMAS), serta pembinaan Majelis Taklim dan Penyuluh Agama.</li>
          </ul>
        </div>
      );
    } else if (id === 'layanan-madrasah') {
      icon = GraduationCap;
      title = 'Layanan Pendidikan Madrasah';
      content = (
        <div className="space-y-4 text-gray-700 text-sm leading-relaxed">
          <p>Mengelola urusan administrasi dan mutu pada satuan pendidikan Raudhatul Athfal (RA), Madrasah Ibtidaiyah (MI), Madrasah Tsanawiyah (MTs), dan Madrasah Aliyah (MA):</p>
          <ul className="space-y-2">
            <li><strong>SIMPATIKA & EMIS:</strong> Pembaruan data tenaga pendidik, tunjangan guru madrasah, dan status keaktifan mengajar secara berkala.</li>
            <li><strong>Dana BOS & TPG:</strong> Pendistribusian Bantuan Operasional Sekolah (BOS) dan pembayaran Tunjangan Profesi Guru (TPG) bersertifikasi.</li>
            <li><strong>Mutasi Siswa & Izin Operasional (IJOP):</strong> Pengurusan mutasi rapor siswa antar madrasah dan rekomendasi perpanjangan izin operasional lembaga pendidikan.</li>
          </ul>
        </div>
      );
    } else if (id === 'layanan-pesantren') {
      icon = Building2;
      title = 'Layanan Pondok Pesantren';
      content = (
        <div className="space-y-4 text-gray-700 text-sm leading-relaxed">
          <p>Pelayanan pembinaan, koordinasi, dan legalitas bagi institusi keagamaan Islam non-formal:</p>
          <ul className="space-y-2">
            <li><strong>Izin Operasional (IJOP):</strong> Pengurusan izin pendirian Pondok Pesantren, Madrasah Diniyah Takmiliyah (MDT), dan Lembaga Pendidikan Al-Qur'an (LPQ).</li>
            <li><strong>Program PIP & Beasiswa Santri:</strong> Validasi data santri berprestasi untuk program Indonesia Pintar dan bantuan infrastruktur pesantren.</li>
          </ul>
        </div>
      );
    } else if (id === 'layanan-pai') {
      icon = Heart;
      title = 'Layanan Pendidikan Agama Islam (PAI)';
      content = (
        <div className="space-y-4 text-gray-700 text-sm leading-relaxed">
          <p>Urusan pembinaan guru Agama Islam di sekolah umum (SD, SMP, SMA, SMK):</p>
          <ul className="space-y-2">
            <li><strong>Sertifikasi & TPG Non-PNS:</strong> Penyaluran tunjangan bagi guru agama Islam di bawah naungan Kemendikbudristek yang terdaftar di Kemenag.</li>
            <li><strong>Pembinaan Siswa & Rohis:</strong> Pelaksanaan pekan olahraga dan seni PAI (Pentas PAI) tingkat kabupaten serta pembinaan aktivitas keagamaan di sekolah.</li>
          </ul>
        </div>
      );
    } else if (id === 'layanan-zakat-wakaf') {
      icon = ShieldCheck;
      title = 'Layanan Zakat & Wakaf';
      content = (
        <div className="space-y-4 text-gray-700 text-sm leading-relaxed">
          <p>Fasilitasi pengelolaan zakat dan status legal aset tanah keagamaan:</p>
          <ul className="space-y-2">
            <li><strong>Sertifikasi Tanah Wakaf:</strong> Pendampingan pengurusan sertifikat tanah wakaf (bekerja sama dengan BPN OKI).</li>
            <li><strong>Pembinaan UPZ & Nazhir:</strong> Layanan sertifikasi kompetensi pengelola zakat (UPZ) dan pendaftaran kepengurusan nazhir tanah wakaf.</li>
          </ul>
        </div>
      );
    } else if (id === 'layanan-kecamatan') {
      icon = MapPin;
      title = 'Layanan Kecamatan (18 KUA OKI)';
      content = (
        <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
          <div className="bg-green-50 p-4 rounded-xl border border-green-100 mb-2">
            <h5 className="font-bold text-green-900 mb-1 text-xs">Kantor Urusan Agama (KUA) Kecamatan</h5>
            <p className="text-[11px] text-gray-600 leading-normal">
              Kementerian Agama Kabupaten Ogan Komering Ilir mengoordinasikan 18 Kantor Urusan Agama (KUA) Kecamatan untuk memberikan pelayanan pernikahan, bimbingan keluarga sakinah, kemasjidan, zakat, wakaf, dan kemaslahatan keagamaan lainnya di tingkat kecamatan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {[
              { nama: 'KUA Kecamatan Kayuagung', alamat: 'Jl. Letnan Muchtar Saleh, Kayuagung, OKI' },
              { nama: 'KUA Kecamatan Pedamaran', alamat: 'Jl. Raya Pedamaran, Kec. Pedamaran, OKI' },
              { nama: 'KUA Kecamatan Tanjung Lubuk', alamat: 'Jl. Lintas Timur, Kec. Tanjung Lubuk, OKI' },
              { nama: 'KUA Kecamatan SP Padang', alamat: 'Jl. Raya Sirah Pulau Padang, Kec. SP Padang, OKI' },
              { nama: 'KUA Kecamatan Jejawi', alamat: 'Jl. Raya Jejawi, Kec. Jejawi, OKI' },
              { nama: 'KUA Kecamatan Pampangan', alamat: 'Jl. Raya Pampangan, Kec. Pampangan, OKI' },
              { nama: 'KUA Kecamatan Lempuing', alamat: 'Jl. Lintas Timur, Tugumulyo, Kec. Lempuing, OKI' },
              { nama: 'KUA Kecamatan Lempuing Jaya', alamat: 'Jl. Lintas Timur, Lubuk Seberuk, Kec. Lempuing Jaya, OKI' },
              { nama: 'KUA Kecamatan Mesuji', alamat: 'Jl. Lintas Timur, Kec. Mesuji, OKI' },
              { nama: 'KUA Kecamatan Mesuji Makmur', alamat: 'Jl. Poros Mesuji Makmur, Kec. Mesuji Makmur, OKI' },
              { nama: 'KUA Kecamatan Mesuji Raya', alamat: 'Jl. Poros Mesuji Raya, Kec. Mesuji Raya, OKI' },
              { nama: 'KUA Kecamatan Tulung Selapan', alamat: 'Jl. Raya Tulung Selapan, Kec. Tulung Selapan, OKI' },
              { nama: 'KUA Kecamatan Cengal', alamat: 'Jl. Raya Cengal, Kec. Cengal, OKI' },
              { nama: 'KUA Kecamatan Sungai Menang', alamat: 'Jl. Raya Sungai Menang, Kec. Sungai Menang, OKI' },
              { nama: 'KUA Kecamatan Air Sugihan', alamat: 'Jl. Poros Air Sugihan, Kec. Air Sugihan, OKI' },
              { nama: 'KUA Kecamatan Pangkalan Lampam', alamat: 'Jl. Raya Pangkalan Lampam, Kec. Pangkalan Lampam, OKI' },
              { nama: 'KUA Kecamatan Teluk Gelam', alamat: 'Jl. Lintas Timur, Kec. Teluk Gelam, OKI' },
              { nama: 'KUA Kecamatan Pedamaran Timur', alamat: 'Jl. Poros Pedamaran Timur, Kec. Pedamaran Timur, OKI' }
            ].map((kua, index) => {
              const slug = kua.nama.toLowerCase().replace('kua kecamatan ', '').replace(/\s+/g, '');
              const url = `http://kua${slug}.kemenagoki.id/`;
              return (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-white hover:border-green-500 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-start gap-2.5 group cursor-pointer"
                >
                  <span className="w-5 h-5 shrink-0 bg-green-100 text-green-800 rounded-full flex items-center justify-center font-bold text-[10px] group-hover:bg-green-600 group-hover:text-white transition-colors">
                    {index + 1}
                  </span>
                  <div>
                    <h6 className="font-bold text-gray-900 text-xs group-hover:text-green-700 transition-colors flex items-center gap-1">
                      {kua.nama}
                      <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </h6>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{kua.alamat}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      );
    } else if (id === 'ppid-info') {
      icon = ShieldCheck;
      title = 'PPID Kemenag OKI';
      content = (
        <div className="space-y-4 text-gray-700 text-sm leading-relaxed">
          <p><strong>Pejabat Pengelola Informasi dan Dokumentasi (PPID)</strong></p>
          <p>Kami berkomitmen untuk menyediakan kemudahan dalam permohonan informasi publik sesuai dengan Undang-Undang No. 14 Tahun 2008 tentang Keterbukaan Informasi Publik.</p>
          <div className="bg-green-50 p-4 rounded-xl border border-green-100">
            <p className="font-bold text-green-900 mb-1">Mekanisme Permohonan:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Pemohon mengisi formulir permohonan informasi online / datang langsung.</li>
              <li>Membawa kartu identitas diri yang sah (KTP/SIM/Paspor).</li>
              <li>Petugas PPID memproses permohonan maksimal dalam waktu 10 hari kerja.</li>
            </ol>
          </div>
          <p className="text-xs text-gray-500 italic">* Layanan ini bebas biaya dalam rangka mewujudkan transparansi penuh.</p>
        </div>
      );
    } else if (id === 'layanan-ptsp') {
      icon = HelpCircle;
      title = 'Pelayanan Terpadu Satu Pintu (PTSP)';
      content = (
        <div className="space-y-4 text-gray-700 text-sm leading-relaxed">
          <div className="bg-green-800 text-white p-5 rounded-2xl mb-4">
            <h5 className="font-bold text-base mb-1">Layanan PTSP Kemenag OKI</h5>
            <p className="text-xs text-green-100">Inovasi pelayanan publik keagamaan yang terintegrasi, transparan, cepat, dan 100% bebas biaya.</p>
          </div>
          <p>Kami menyediakan lebih dari 40 jenis layanan administratif terintegrasi untuk masyarakat di Kabupaten OKI, diantaranya:</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium">
            <li className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-green-700" /> Rekomendasi Paspor Haji/Umrah</li>
            <li className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-green-700" /> Pendaftaran Rumah Ibadah (KIBLAT)</li>
            <li className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-green-700" /> Pengajuan Izin Penelitian</li>
            <li className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-green-700" /> Legalisir Ijazah Keagamaan</li>
            <li className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-green-700" /> Pengurusan Izin Operasional LPQ</li>
            <li className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-green-700" /> Rekomendasi Proposal Bantuan</li>
          </ul>
        </div>
      );
    }

    setSelectedItem({ title, subtitle, icon, content });
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href?: string) => {
    if (!href) return;
    
    if (href === '#berita') {
      e.preventDefault();
      navigate('/berita');
      setMobileMenuOpen(false);
      return;
    }
    
    if (href === '#kontak') {
      e.preventDefault();
      handleItemClick('peta-lokasi', 'Peta Lokasi Kantor');
      setMobileMenuOpen(false);
      return;
    }

    // Smooth scrolling to section if hashtag is provided
    if (href.startsWith('#')) {
      e.preventDefault();
      setMobileMenuOpen(false);
      const targetElement = document.querySelector(href);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (href.startsWith('/')) {
      e.preventDefault();
      navigate(href);
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      <header className="fixed w-full top-0 z-50">
        {/* Top Bar */}
        <div className="bg-green-800 text-white text-xs py-2 hidden md:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div className="flex space-x-6">
              <span className="flex items-center gap-1.5"><MapPin size={14} /> {contactInfo.address}</span>
              <span className="flex items-center gap-1.5"><Phone size={14} /> {contactInfo.phone}</span>
              <span className="flex items-center gap-1.5"><Mail size={14} /> {contactInfo.email}</span>
            </div>
            <div className="flex space-x-4 font-medium">
              {socialMedia.facebook && (
                <a href={socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-green-200 transition-colors flex items-center gap-1.5" aria-label="Facebook">
                  <Facebook size={14} /> Facebook
                </a>
              )}
              {socialMedia.instagram && (
                <a href={socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-green-200 transition-colors flex items-center gap-1.5" aria-label="Instagram">
                  <Instagram size={14} /> Instagram
                </a>
              )}
              {socialMedia.youtube && (
                <a href={socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-green-200 transition-colors flex items-center gap-1.5" aria-label="YouTube">
                  <Youtube size={14} /> YouTube
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Main Navbar */}
        <nav className={`transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-3' : 'bg-white/95 backdrop-blur-sm py-4 border-b border-gray-100'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <img 
                  src={logoUrl} 
                  alt="Logo Kementerian Agama" 
                  className="w-11 h-11 object-contain shrink-0 filter drop-shadow-sm hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
                <div className="flex flex-col">
                  <span className="font-extrabold text-gray-900 leading-none text-sm md:text-base tracking-tight uppercase">Kementerian Agama</span>
                  <span className="text-[9px] md:text-xs text-green-700 font-bold tracking-widest uppercase">Kabupaten Ogan Komering Ilir</span>
                </div>
              </div>

              {/* Desktop Nav */}
              <div className="hidden md:flex items-center space-x-1">
                {navLinks.map((link, idx) => (
                  <div 
                    key={idx} 
                    className="relative group px-3 py-2 cursor-pointer"
                    onMouseEnter={() => link.hasDropdown && setActiveDropdown(link.name)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    {link.hasDropdown ? (
                      <>
                        <div className="flex items-center gap-1 text-gray-700 font-medium hover:text-green-700 transition-colors text-sm">
                          {link.name}
                          <ChevronDown size={14} className={`text-gray-400 group-hover:text-green-700 transition-transform ${activeDropdown === link.name ? 'rotate-180' : ''}`} />
                        </div>

                        {/* Interactive Dropdown Box */}
                        <AnimatePresence>
                          {activeDropdown === link.name && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              transition={{ duration: 0.15 }}
                              className="absolute left-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-50"
                            >
                              {link.subItems?.map((sub, sidx) => {
                                const SubIcon = (typeof sub.icon === 'string' ? iconMap[sub.icon] : sub.icon) || BookOpen;
                                return (
                                  <button
                                    key={sidx}
                                    onClick={() => handleItemClick(sub.id, sub.name)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                                  >
                                    <SubIcon size={16} className="text-green-700 shrink-0" />
                                    <span>{sub.name}</span>
                                  </button>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <a 
                        href={link.href} 
                        onClick={(e) => handleLinkClick(e, link.href)}
                        className="text-gray-700 font-medium hover:text-green-700 transition-colors text-sm"
                      >
                        {link.name}
                      </a>
                    )}
                  </div>
                ))}
                <button 
                  onClick={() => handleItemClick('layanan-ptsp', 'Layanan PTSP')}
                  className="ml-4 px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white text-sm font-medium rounded-lg transition-all shadow-sm shadow-green-700/20 cursor-pointer"
                >
                  Layanan PTSP
                </button>
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <button 
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 text-gray-600 hover:text-green-700"
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Nav - Slide Drawer with Bounce Effect */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
              />
              
              {/* Slide Out Menu */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 180, 
                  damping: 15 
                }}
                className="fixed top-0 right-0 h-screen w-80 max-w-[85vw] bg-white shadow-2xl z-50 md:hidden flex flex-col border-l border-gray-100"
              >
                {/* Header inside Menu */}
                <div className="p-5 border-b border-green-100 flex items-center justify-between bg-green-50/50">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={logoUrl} 
                      alt="Logo Kemenag" 
                      className="w-10 h-10 object-contain shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col">
                      <span className="font-extrabold text-gray-950 text-sm tracking-tight uppercase leading-none">KEMENTERIAN AGAMA</span>
                      <span className="text-[10px] text-green-700 font-bold tracking-wider uppercase mt-1">Kabupaten Ogan Komering Ilir</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 hover:bg-green-100 rounded-full transition-colors text-green-800"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Nav Links Container */}
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
                  {navLinks.map((link, idx) => (
                    <div key={idx} className="block">
                      {link.hasDropdown ? (
                        <div className="bg-gray-50/50 rounded-xl border border-gray-100 overflow-hidden">
                          <button
                            onClick={() => setMobileDropdownOpen(mobileDropdownOpen === link.name ? null : link.name)}
                            className="w-full flex items-center justify-between px-4 py-3 text-base font-semibold text-gray-800 hover:bg-green-50 hover:text-green-700 transition-colors"
                          >
                            <span>{link.name}</span>
                            <ChevronDown size={18} className={`text-gray-400 transition-transform ${mobileDropdownOpen === link.name ? 'rotate-180 text-green-700' : ''}`} />
                          </button>
                          
                          {/* Mobile Collapsible Subitems */}
                          <AnimatePresence>
                            {mobileDropdownOpen === link.name && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="px-2 pb-2 space-y-0.5 bg-white border-t border-gray-50"
                              >
                                {link.subItems?.map((sub, sidx) => {
                                  const SubIcon = (typeof sub.icon === 'string' ? iconMap[sub.icon] : sub.icon) || BookOpen;
                                  return (
                                    <button
                                      key={sidx}
                                      onClick={() => handleItemClick(sub.id, sub.name)}
                                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors font-medium"
                                    >
                                      <SubIcon size={16} className="text-green-700" />
                                      <span>{sub.name}</span>
                                    </button>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <a 
                          href={link.href} 
                          onClick={(e) => handleLinkClick(e, link.href)}
                          className="block px-4 py-3 text-base font-semibold text-gray-800 hover:bg-green-50 hover:text-green-700 rounded-xl transition-colors"
                        >
                          {link.name}
                        </a>
                      )}
                    </div>
                  ))}
                </div>

                {/* Bottom Action Button */}
                <div className="p-5 border-t border-gray-100 bg-gray-50">
                  <button 
                    onClick={() => handleItemClick('layanan-ptsp', 'Layanan PTSP')}
                    className="w-full flex justify-center py-3.5 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl shadow-md hover:shadow-lg shadow-green-700/10 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Layanan PTSP
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      {/* Interactive Information Pop-up Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Dialog Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-gray-100 z-10"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-green-800 to-green-700 text-white p-6 flex items-start justify-between">
                <div className="flex gap-4 items-center">
                  <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl shrink-0">
                    <selectedItem.icon size={24} className="text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-wide">{selectedItem.title}</h3>
                    <p className="text-xs text-green-100 font-medium">{selectedItem.subtitle}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-green-100 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto">
                {selectedItem.content}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-5 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
