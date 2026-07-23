import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Save, Image as ImageIcon, Globe, Facebook, Instagram, Youtube, MapPin, Phone, Mail, Check, User, Upload, Radio } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import MediaPickerModal from '../../components/MediaPickerModal';

export default function SettingsAdmin() {
  const { 
    logoUrl, faviconUrl, ogImageUrl, logoKemenagUrl, logoDmiUrl, siteName, metaDescription, socialMedia, contactInfo, sholatTtdNama, sholatTtdNip, sholatTtdJabatan, sholatTtdImage, sholatCapImage, liveStreaming, updateSettings, fetchSettings 
  } = useSettingsStore();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerCallback, setPickerCallback] = useState<(url: string) => void>(() => () => {});

  const openPicker = (callback: (url: string) => void) => {
    setPickerCallback(() => callback);
    setPickerOpen(true);
  };

  const [formData, setFormData] = useState({
    logoUrl,
    faviconUrl,
    ogImageUrl,
    logoKemenagUrl: logoKemenagUrl || '/uploads/foto_staf/fav-1784035270535-947609399.png',
    logoDmiUrl: logoDmiUrl || '/uploads/foto/DMI-1784172402626-586526853.png',
    siteName,
    metaDescription,
    socialMedia: { ...socialMedia },
    contactInfo: { ...contactInfo },
    sholatTtdNama: sholatTtdNama || '',
    sholatTtdNip: sholatTtdNip || '',
    sholatTtdJabatan: sholatTtdJabatan || '',
    sholatTtdImage: sholatTtdImage || '',
    sholatCapImage: sholatCapImage || '',
    liveStreaming: { 
      isLive: liveStreaming?.isLive || false,
      youtubeUrl: liveStreaming?.youtubeUrl || '@kemenagokitv5177/live',
      title: liveStreaming?.title || 'Kemenag OKI Live',
    }
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings().then(() => {
      // Data will be updated in store, need to resync form
      const store = useSettingsStore.getState();
      setFormData({
        logoUrl: store.logoUrl,
        faviconUrl: store.faviconUrl,
        ogImageUrl: store.ogImageUrl,
        logoKemenagUrl: store.logoKemenagUrl || 'https://kuatelukgelam.kemenagoki.id/assets/img/logo.png',
        logoDmiUrl: store.logoDmiUrl || 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Logo_Dewan_Masjid_Indonesia_%28DMI%29.png',
        siteName: store.siteName,
        metaDescription: store.metaDescription,
        socialMedia: { ...store.socialMedia },
        contactInfo: { ...store.contactInfo },
        sholatTtdNama: store.sholatTtdNama || '',
        sholatTtdNip: store.sholatTtdNip || '',
        sholatTtdJabatan: store.sholatTtdJabatan || '',
        sholatTtdImage: store.sholatTtdImage || '',
        sholatCapImage: store.sholatCapImage || '',
        liveStreaming: { 
          isLive: store.liveStreaming?.isLive || false,
          youtubeUrl: store.liveStreaming?.youtubeUrl || 'https://youtube.com/@kemenagokitv5177/live',
          title: store.liveStreaming?.title || 'Kemenag OKI Live',
        }
      });
    });
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      await updateSettings(formData);
      toast.success('Pengaturan berhasil disimpan');
      
      // Update document title and favicon
      document.title = formData.siteName;
      if (formData.faviconUrl) {
        const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = formData.faviconUrl;
        document.getElementsByTagName('head')[0].appendChild(link);
      }
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Pengaturan Website</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identitas Website */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Globe className="text-green-700" size={20} />
            <h3 className="font-bold text-gray-800">Identitas Website</h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Website (Judul)</label>
              <input
                type="text"
                value={formData.siteName}
                onChange={(e) => setFormData({...formData, siteName: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Website (Meta Description)</label>
              <textarea
                value={formData.metaDescription}
                onChange={(e) => setFormData({...formData, metaDescription: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none h-24"
              />
            </div>
          </div>
        </div>

        {/* Logo & Favicon */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <ImageIcon className="text-green-700" size={20} />
            <h3 className="font-bold text-gray-800">Logo & Ikon</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Logo Utama</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                    placeholder="https://.../logo.png"
                  />
                  <button
                    type="button"
                    onClick={() => openPicker((url) => setFormData({...formData, logoUrl: url}))}
                    className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2 font-medium"
                  >
                    <Upload size={16} />
                    Pilih Media
                  </button>
                </div>
                <p className="text-xs text-gray-500">Anda dapat menyalin URL dari menu Media Library setelah mengunggah logo.</p>
              </div>
              <div className="w-32 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center p-2">
                {formData.logoUrl ? (
                  <img src={formData.logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                ) : (
                  <span className="text-xs text-gray-400">Logo Preview</span>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Favicon (Ikon Tab Browser)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={formData.faviconUrl}
                    onChange={(e) => setFormData({...formData, faviconUrl: e.target.value})}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                    placeholder="https://.../favicon.ico"
                  />
                  <button
                    type="button"
                    onClick={() => openPicker((url) => setFormData({...formData, faviconUrl: url}))}
                    className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2 font-medium"
                  >
                    <Upload size={16} />
                    Pilih Media
                  </button>
                </div>
              </div>
              <div className="w-32 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center p-2">
                {formData.faviconUrl ? (
                  <img src={formData.faviconUrl} alt="Favicon Preview" className="max-w-full max-h-full object-contain" />
                ) : (
                  <span className="text-xs text-gray-400">Favicon Preview</span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">URL OG:Image (Gambar Default untuk Share Sosial Media)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={formData.ogImageUrl || ''}
                    onChange={(e) => setFormData({...formData, ogImageUrl: e.target.value})}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                    placeholder="https://.../og-image.jpg"
                  />
                  <button
                    type="button"
                    onClick={() => openPicker((url) => setFormData({...formData, ogImageUrl: url}))}
                    className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2 font-medium"
                  >
                    <Upload size={16} />
                    Pilih Media
                  </button>
                </div>
                <p className="text-xs text-gray-500">Gambar yang muncul ketika link website dibagikan (WhatsApp, FB, dll).</p>
              </div>
              <div className="w-32 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center p-2 overflow-hidden">
                {formData.ogImageUrl ? (
                  <img src={formData.ogImageUrl} alt="OG Image Preview" className="max-w-full max-h-full object-cover" />
                ) : (
                  <span className="text-xs text-center text-gray-400">OG Preview</span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Logo Kemenag (Jadwal Sholat)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={formData.logoKemenagUrl || ''}
                    onChange={(e) => setFormData({...formData, logoKemenagUrl: e.target.value})}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                    placeholder="https://.../logo-kemenag.png"
                  />
                  <button
                    type="button"
                    onClick={() => openPicker((url) => setFormData({...formData, logoKemenagUrl: url}))}
                    className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2 font-medium"
                  >
                    <Upload size={16} />
                    Pilih Media
                  </button>
                </div>
              </div>
              <div className="w-32 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center p-2 overflow-hidden">
                {formData.logoKemenagUrl ? (
                  <img src={formData.logoKemenagUrl} alt="Logo Kemenag" className="max-w-full max-h-full object-cover" />
                ) : (
                  <span className="text-xs text-center text-gray-400">Logo</span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Logo DMI (Jadwal Sholat)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={formData.logoDmiUrl || ''}
                    onChange={(e) => setFormData({...formData, logoDmiUrl: e.target.value})}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                    placeholder="https://.../logo-dmi.png"
                  />
                  <button
                    type="button"
                    onClick={() => openPicker((url) => setFormData({...formData, logoDmiUrl: url}))}
                    className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2 font-medium"
                  >
                    <Upload size={16} />
                    Pilih Media
                  </button>
                </div>
              </div>
              <div className="w-32 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center p-2 overflow-hidden">
                {formData.logoDmiUrl ? (
                  <img src={formData.logoDmiUrl} alt="Logo DMI" className="max-w-full max-h-full object-cover" />
                ) : (
                  <span className="text-xs text-center text-gray-400">Logo</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Kontak & Informasi */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Phone className="text-green-700" size={20} />
            <h3 className="font-bold text-gray-800">Kontak & Informasi</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <MapPin className="text-gray-400 w-5 h-5 shrink-0" />
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Alamat Kantor</label>
                <input
                  type="text"
                  value={formData.contactInfo.address}
                  onChange={(e) => setFormData({...formData, contactInfo: {...formData.contactInfo, address: e.target.value}})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="text-gray-400 w-5 h-5 shrink-0" />
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Nomor Telepon</label>
                <input
                  type="text"
                  value={formData.contactInfo.phone}
                  onChange={(e) => setFormData({...formData, contactInfo: {...formData.contactInfo, phone: e.target.value}})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="text-gray-400 w-5 h-5 shrink-0" />
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Email Publik</label>
                <input
                  type="email"
                  value={formData.contactInfo.email}
                  onChange={(e) => setFormData({...formData, contactInfo: {...formData.contactInfo, email: e.target.value}})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Media Sosial */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Facebook className="text-green-700" size={20} />
            <h3 className="font-bold text-gray-800">Media Sosial</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Facebook className="text-blue-600 w-5 h-5 shrink-0" />
              <input
                type="text"
                value={formData.socialMedia.facebook}
                onChange={(e) => setFormData({...formData, socialMedia: {...formData.socialMedia, facebook: e.target.value}})}
                placeholder="URL Facebook"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <Instagram className="text-pink-600 w-5 h-5 shrink-0" />
              <input
                type="text"
                value={formData.socialMedia.instagram}
                onChange={(e) => setFormData({...formData, socialMedia: {...formData.socialMedia, instagram: e.target.value}})}
                placeholder="URL Instagram"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <Youtube className="text-red-600 w-5 h-5 shrink-0" />
              <input
                type="text"
                value={formData.socialMedia.youtube}
                onChange={(e) => setFormData({...formData, socialMedia: {...formData.socialMedia, youtube: e.target.value}})}
                placeholder="URL YouTube"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Tanda Tangan & Cap Stempel Jadwal Sholat */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <User className="text-green-700" size={20} />
            <h3 className="font-bold text-gray-800">Tanda Tangan & Cap Stempel Jadwal Sholat</h3>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan Penandatangan (contoh: Kepala Kantor)</label>
              <input
                type="text"
                value={formData.sholatTtdJabatan}
                onChange={(e) => setFormData({...formData, sholatTtdJabatan: e.target.value})}
                placeholder="Kepala Kantor"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap & Gelar</label>
              <input
                type="text"
                value={formData.sholatTtdNama}
                onChange={(e) => setFormData({...formData, sholatTtdNama: e.target.value})}
                placeholder="H. Syarifin S.Ag., M.Pd.I"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NIP (Nomor Induk Pegawai)</label>
              <input
                type="text"
                value={formData.sholatTtdNip}
                onChange={(e) => setFormData({...formData, sholatTtdNip: e.target.value})}
                placeholder="197001151997031005"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>

            {/* Gambar Tanda Tangan */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Tanda Tangan Digital</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={formData.sholatTtdImage || ''}
                      onChange={(e) => setFormData({...formData, sholatTtdImage: e.target.value})}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                      placeholder="https://.../tanda-tangan.png"
                    />
                    <button
                      type="button"
                      onClick={() => openPicker((url) => setFormData({...formData, sholatTtdImage: url}))}
                      className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <Upload size={16} />
                      Pilih Media
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">Unggah file transparan PNG tanda tangan agar terlihat rapi pada PDF.</p>
                </div>
                <div className="w-36 h-20 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center p-2 overflow-hidden">
                  {formData.sholatTtdImage ? (
                    <img src={formData.sholatTtdImage} alt="Tanda Tangan Preview" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <span className="text-xs text-center text-gray-400">Preview TTD</span>
                  )}
                </div>
              </div>
            </div>

            {/* Gambar Stempel / Cap */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Stempel / Cap Resmi</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={formData.sholatCapImage || ''}
                      onChange={(e) => setFormData({...formData, sholatCapImage: e.target.value})}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                      placeholder="https://.../stempel-cap.png"
                    />
                    <button
                      type="button"
                      onClick={() => openPicker((url) => setFormData({...formData, sholatCapImage: url}))}
                      className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <Upload size={16} />
                      Pilih Media
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">Unggah file stempel/cap instansi (rekomendasi PNG transparan).</p>
                </div>
                <div className="w-36 h-20 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center p-2 overflow-hidden">
                  {formData.sholatCapImage ? (
                    <img src={formData.sholatCapImage} alt="Stempel Cap Preview" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <span className="text-xs text-center text-gray-400">Preview Cap</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Streaming */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Radio className="text-red-600" size={20} />
            <h3 className="font-bold text-gray-800">Live Streaming</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isLive"
                checked={formData.liveStreaming.isLive}
                onChange={(e) => setFormData({...formData, liveStreaming: {...formData.liveStreaming, isLive: e.target.checked}})}
                className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label htmlFor="isLive" className="block text-sm font-medium text-gray-700">Tampilkan Tombol Live Streaming di Header</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Judul Live Streaming</label>
              <input
                type="text"
                value={formData.liveStreaming.title}
                onChange={(e) => setFormData({...formData, liveStreaming: {...formData.liveStreaming, title: e.target.value}})}
                placeholder="Misal: Live Kajian Rutin..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL YouTube Live</label>
              <input
                type="text"
                value={formData.liveStreaming.youtubeUrl}
                onChange={(e) => setFormData({...formData, liveStreaming: {...formData.liveStreaming, youtubeUrl: e.target.value}})}
                placeholder="https://youtube.com/@kemenag_oki/live"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 pb-12">
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
            Simpan Pengaturan
          </button>
        </div>
      </form>

      {pickerOpen && (
        <MediaPickerModal 
          onSelect={(url) => {
            pickerCallback(url);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
