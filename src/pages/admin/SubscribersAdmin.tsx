import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, query } from '../../lib/db';
import { db } from '../../lib/db';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Mail, Search, RefreshCw, X, Send, Eye, FileText, CheckCircle2, AlertCircle, XCircle, Server } from 'lucide-react';
import { showAlert, showToast } from '../../lib/swal';

interface Subscriber {
  id: string;
  email: string;
  createdAt: string;
}

interface SentLog {
  id: string;
  subscriberEmail: string;
  newsTitle: string;
  subject: string;
  htmlBody: string;
  sentAt: string;
  status: string;
}

export default function SubscribersAdmin() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [sentLogs, setSentLogs] = useState<SentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subscriber | null>(null);
  const [selectedLog, setSelectedLog] = useState<SentLog | null>(null);

  // Form states
  const [editEmail, setEditEmail] = useState('');
  const [manualSubject, setManualSubject] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Pagination
  const [subPage, setSubPage] = useState(1);
  const [logPage, setLogPage] = useState(1);
  const itemsPerPage = 8;

  const fetchSubscribers = async () => {
    try {
      const q = query(collection(db, 'newsletter_subscribers'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Subscriber));
      setSubscribers(docs);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil data pelanggan');
    }
  };

  const fetchSentLogs = async () => {
    try {
      const q = query(collection(db, 'newsletter_sent_logs'), orderBy('sentAt', 'desc'));
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as SentLog));
      setSentLogs(docs);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchSubscribers(), fetchSentLogs()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditOpen = (sub: Subscriber) => {
    setSelectedSub(sub);
    setEditEmail(sub.email);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub || !editEmail.trim()) return;

    try {
      await updateDoc(doc(db, 'newsletter_subscribers', selectedSub.id), {
        email: editEmail.trim()
      });
      showToast.success('Alamat email pelanggan berhasil diperbarui');
      setIsEditModalOpen(false);
      fetchSubscribers();
    } catch (err) {
      console.error(err);
      showToast.error('Gagal memperbarui email');
    }
  };

  const handleDeleteSub = async (id: string) => {
    const confirmed = await showAlert.confirm(
      'Hapus Pelanggan?',
      'Apakah Anda yakin ingin menghapus pelanggan ini dari daftar buletin?'
    );
    if (confirmed) {
      try {
        await deleteDoc(doc(db, 'newsletter_subscribers', id));
        showToast.success('Pelanggan berhasil dihapus');
        fetchSubscribers();
      } catch (err) {
        console.error(err);
        showToast.error('Gagal menghapus pelanggan');
      }
    }
  };

  const handleDeleteLog = async (id: string) => {
    const confirmed = await showAlert.confirm(
      'Hapus Riwayat?',
      'Apakah Anda yakin ingin menghapus catatan riwayat pengiriman ini?'
    );
    if (confirmed) {
      try {
        await deleteDoc(doc(db, 'newsletter_sent_logs', id));
        showToast.success('Riwayat berhasil dihapus');
        fetchSentLogs();
      } catch (err) {
        console.error(err);
        showToast.error('Gagal menghapus riwayat');
      }
    }
  };

  const handleClearLogs = async () => {
    const confirmed = await showAlert.confirm(
      'Bersihkan SEMUA Riwayat?',
      'Apakah Anda yakin ingin menghapus SEMUA catatan riwayat pengiriman buletin? Tindakan ini tidak dapat dibatalkan.'
    );
    if (confirmed) {
      try {
        // 1. Delete all logs via client db helper
        if (sentLogs.length > 0) {
          await Promise.all(sentLogs.map(log => deleteDoc(doc(db, 'newsletter_sent_logs', log.id))));
        }
        // 2. Call server clear route
        await fetch('/api/db/newsletter_sent_logs/clear', { method: 'POST' });
        
        // 3. Reset local storage fallback
        if (typeof window !== 'undefined') {
          localStorage.setItem('mock_db_newsletter_sent_logs', JSON.stringify([]));
        }

        setSentLogs([]);
        showAlert.success('Berhasil Dibersihkan!', 'Semua riwayat pengiriman buletin telah dihapus.');
        fetchSentLogs();
      } catch (err) {
        console.error(err);
        showAlert.error('Gagal!', 'Terjadi kesalahan saat membersihkan riwayat.');
      }
    }
  };

  const handleManualSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSubject || !manualTitle || !manualContent) {
      showToast.error('Form Belum Lengkap', 'Subjek, Judul, dan Konten berita wajib diisi!');
      return;
    }

    if (subscribers.length === 0) {
      showAlert.warning('Tidak Ada Pelanggan', 'Belum ada pelanggan yang terdaftar untuk dikirimi buletin.');
      return;
    }

    setIsSending(true);
    showToast.info('Mengirimkan Buletin...', 'Sedang memproses pengiriman ke seluruh pelanggan.');

    try {
      const response = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: manualSubject,
          title: manualTitle,
          content: manualContent,
          subscribers: subscribers
        })
      });

      const resData = await response.json().catch(() => ({}));

      if (!response.ok || !resData.success) {
        const errorMsg = resData.error || resData.details || 'Gagal koneksi server SMTP';
        
        if (errorMsg.includes('535') || errorMsg.includes('authentication failed') || errorMsg.includes('Invalid login')) {
          showAlert.error(
            'Gagal Otentikasi SMTP (535)',
            'Gagal Login SMTP: Username atau Password email SMTP pada file .env server tidak cocok. Harap periksa variabel SMTP_USER, SMTP_PASS, dan SMTP_HOST di file .env server Node.js Anda.'
          );
        } else {
          showAlert.error('Gagal Mengirim Buletin', `Detail Error: ${errorMsg}`);
        }
        fetchSentLogs();
        return;
      }

      showAlert.success(
        'Pengiriman Berhasil!',
        `Buletin telah berhasil dikirimkan ke ${resData.count || subscribers.length} pelanggan.`
      );
      setIsManualModalOpen(false);
      setManualSubject('');
      setManualTitle('');
      setManualContent('');
      fetchSentLogs();
    } catch (err: any) {
      console.error(err);
      showAlert.error('Pengiriman Gagal', 'Gagal mengirimkan buletin. Pastikan server Node.js dan konfigurasi SMTP di file .env sudah benar.');
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenPreview = (log: SentLog) => {
    setSelectedLog(log);
    setIsPreviewModalOpen(true);
  };

  const filteredSubs = subscribers.filter(s => s.email.toLowerCase().includes(search.toLowerCase()));

  // Sub Pagination Calculations
  const totalSubPages = Math.ceil(filteredSubs.length / itemsPerPage);
  const subIndexStart = (subPage - 1) * itemsPerPage;
  const currentSubs = filteredSubs.slice(subIndexStart, subIndexStart + itemsPerPage);

  // Log Pagination Calculations
  const totalLogPages = Math.ceil(sentLogs.length / itemsPerPage);
  const logIndexStart = (logPage - 1) * itemsPerPage;
  const currentLogs = sentLogs.slice(logIndexStart, logIndexStart + itemsPerPage);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pelanggan & Buletin Berita</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola daftar pelanggan, kirim buletin manual, serta tinjau riwayat email berita otomatis.
          </p>
        </div>
        <button
          onClick={() => setIsManualModalOpen(true)}
          className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-95"
        >
          <Send size={16} /> Kirim Buletin Manual
        </button>
      </div>

      {/* Info Banner Konfigurasi SMTP Nodemailer */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start gap-4">
        <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl shrink-0">
          <Server size={22} />
        </div>
        <div className="flex-1 text-xs sm:text-sm text-amber-900 leading-relaxed">
          <p className="font-bold text-amber-950 flex items-center gap-1.5 text-sm mb-1">
            <AlertCircle size={16} className="text-amber-700" /> Status Pengiriman Email (Nodemailer)
          </p>
          <p>
            Modul <strong>Nodemailer</strong> sudah terpasang dan siap digunakan di backend server. Jika pengiriman buletin masih berstatus <strong>Gagal</strong>, pastikan variabel lingkungan (environment variables) SMTP di file <code>.env</code> hosting/server Anda sudah diisi dengan kredensial server email yang valid:
          </p>
          <div className="mt-2.5 bg-amber-100/60 p-2.5 rounded-xl font-mono text-[11px] text-amber-950 space-y-1 overflow-x-auto border border-amber-200">
            <div>SMTP_HOST=smtp.gmail.com <span className="text-amber-700 font-sans italic">(atau mail.kemenagoki.id)</span></div>
            <div>SMTP_PORT=587 <span className="text-amber-700 font-sans italic">(atau 465 untuk SSL)</span></div>
            <div>SMTP_USER=humas@kemenagoki.id</div>
            <div>SMTP_PASS=kunci_password_app_anda</div>
            <div>SMTP_FROM="Humas Kemenag OKI" &lt;humas@kemenagoki.id&gt;</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Subscribers Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-1 flex flex-col h-fit">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <Mail size={18} className="text-green-600" />
              Daftar Pelanggan ({filteredSubs.length})
            </h2>
            <button 
              onClick={fetchSubscribers}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Cari email pelanggan..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSubPage(1); }}
              className="w-full bg-gray-50 border border-gray-200 text-sm text-gray-900 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white transition-all"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          </div>

          {loading ? (
            <div className="text-center py-10 text-gray-400 text-sm">Memuat pelanggan...</div>
          ) : currentSubs.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm bg-gray-50 rounded-xl">
              Belum ada pelanggan terdaftar.
            </div>
          ) : (
            <div className="space-y-3">
              {currentSubs.map((sub) => (
                <div key={sub.id} className="flex justify-between items-center p-3 border border-gray-50 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="font-medium text-gray-800 text-sm truncate">{sub.email}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleEditOpen(sub)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit email"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteSub(sub.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus pelanggan"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Sub Pagination */}
              {totalSubPages > 1 && (
                <div className="flex justify-between items-center pt-4 border-t border-gray-100 text-xs text-gray-500">
                  <button
                    disabled={subPage === 1}
                    onClick={() => setSubPage(subPage - 1)}
                    className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  >
                    Prev
                  </button>
                  <span>Halaman {subPage} dari {totalSubPages}</span>
                  <button
                    disabled={subPage === totalSubPages}
                    onClick={() => setSubPage(subPage + 1)}
                    className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Newsletter Sent History Logs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <FileText size={18} className="text-amber-500" />
              Riwayat Pengiriman Buletin
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={fetchSentLogs}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                title="Refresh logs"
              >
                <RefreshCw size={14} />
              </button>
              {sentLogs.length > 0 && (
                <button 
                  onClick={handleClearLogs}
                  className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                  title="Bersihkan Semua Riwayat"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-400 text-sm">Memuat riwayat pengiriman...</div>
          ) : sentLogs.length === 0 ? (
            <div className="text-center py-20 text-gray-400 text-sm bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              Belum ada riwayat email buletin yang dikirim.
              <p className="text-xs text-gray-400 mt-1">Email dikirim secara otomatis saat ada Berita Baru atau via tombol manual.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 rounded-xl">
                  <tr>
                    <th scope="col" className="px-4 py-3">Penerima</th>
                    <th scope="col" className="px-4 py-3">Berita / Subjek</th>
                    <th scope="col" className="px-4 py-3">Tanggal Kirim</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentLogs.map((log) => (
                    <tr key={log.id} className="bg-white hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-gray-900 max-w-[150px] truncate">
                        {log.subscriberEmail}
                      </td>
                      <td className="px-4 py-3.5 max-w-[200px] truncate">
                        <span className="font-semibold text-gray-800 block truncate">{log.newsTitle}</span>
                        <span className="text-[11px] text-gray-400 block truncate">{log.subject}</span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-500">
                        {log.sentAt ? new Date(log.sentAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {String(log.status || '').toLowerCase().includes('gagal') ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-red-50 text-red-700 px-2 py-0.5 rounded-full border border-red-100 max-w-[180px] truncate" title={log.status}>
                            <XCircle size={11} className="shrink-0" />
                            <span className="truncate">{log.status}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">
                            <CheckCircle2 size={11} className="shrink-0" />
                            {log.status || 'Terkirim'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenPreview(log)}
                            className="inline-flex items-center gap-1 text-xs text-green-700 hover:text-green-800 font-semibold cursor-pointer"
                            title="Pratinjau Email"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Hapus Riwayat"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Log Pagination */}
              {totalLogPages > 1 && (
                <div className="flex justify-between items-center pt-4 border-t border-gray-100 text-xs text-gray-500 mt-4">
                  <button
                    disabled={logPage === 1}
                    onClick={() => setLogPage(logPage - 1)}
                    className="px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  >
                    Sebelumnya
                  </button>
                  <span>Halaman {logPage} dari {totalLogPages}</span>
                  <button
                    disabled={logPage === totalLogPages}
                    onClick={() => setLogPage(logPage + 1)}
                    className="px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  >
                    Selanjutnya
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Subscriber Email Modal */}
      {isEditModalOpen && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
            <div className="bg-green-800 text-white p-5 flex justify-between items-center">
              <h3 className="font-bold text-lg">Edit Pelanggan</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-white/80 hover:text-white p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Alamat Email</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all"
                  placeholder="name@email.com"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Bulletin Broadcast Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden relative flex flex-col max-h-[90vh]">
            <div className="bg-green-800 text-white p-5 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-lg">Kirim Buletin Manual</h3>
                <p className="text-xs text-green-100 mt-0.5">Kirim pengumuman atau berita khusus langsung ke email {subscribers.length} pelanggan.</p>
              </div>
              <button onClick={() => setIsManualModalOpen(false)} className="text-white/80 hover:text-white p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleManualSend} className="p-6 space-y-4 overflow-y-auto flex-grow">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Subjek Email</label>
                <input
                  type="text"
                  required
                  value={manualSubject}
                  onChange={(e) => setManualSubject(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all"
                  placeholder="Contoh: Info Penting / Pengumuman Kegiatan Kemenag OKI"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Judul Buletin (Header)</label>
                <input
                  type="text"
                  required
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all"
                  placeholder="Contoh: Pelaksanaan Layanan Terpadu Satu Pintu Akhir Pekan"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Konten Berita (HTML/Teks Lengkap)</label>
                <textarea
                  required
                  rows={8}
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all font-sans"
                  placeholder="Tuliskan berita lengkap di sini..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium"
                  disabled={isSending}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="inline-flex items-center gap-1.5 px-6 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="animate-spin" size={14} />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Kirim Buletin
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HTML Email Campaign Preview Modal */}
      {isPreviewModalOpen && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative flex flex-col max-h-[85vh]">
            <div className="bg-gray-900 text-white p-5 flex justify-between items-center shrink-0 border-b border-gray-800">
              <div>
                <h3 className="font-bold text-base">Pratinjau Email Buletin</h3>
                <p className="text-xs text-gray-400 mt-0.5">Dikirim ke: {selectedLog.subscriberEmail}</p>
              </div>
              <button onClick={() => setIsPreviewModalOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>
            
            <div className="bg-gray-100 p-4 border-b border-gray-200 text-xs text-gray-600 shrink-0 space-y-1">
              <p><strong>Dari:</strong> Kemenag OKI Buletin &lt;no-reply@kemenagoki.go.id&gt;</p>
              <p><strong>Subjek:</strong> {selectedLog.subject}</p>
              <p><strong>Tanggal:</strong> {new Date(selectedLog.sentAt).toLocaleString('id-ID')}</p>
            </div>

            <div className="flex-grow overflow-y-auto bg-gray-50 p-6 flex justify-center">
              <div 
                className="bg-white shadow border border-gray-200 rounded-xl w-full max-w-[600px] overflow-hidden"
                dangerouslySetInnerHTML={{ __html: selectedLog.htmlBody }}
              />
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 text-right shrink-0">
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
