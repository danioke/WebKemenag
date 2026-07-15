import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  logoUrl: string;
  faviconUrl: string;
  ogImageUrl: string;
  siteName: string;
  metaDescription: string;
  socialMedia: {
    facebook: string;
    instagram: string;
    youtube: string;
  };
  contactInfo: {
    address: string;
    phone: string;
    email: string;
  };
  sholatTtdNama?: string;
  sholatTtdNip?: string;
  sholatTtdJabatan?: string;
  updateSettings: (newSettings: Partial<Omit<SettingsState, 'updateSettings' | 'fetchSettings'>>) => Promise<void>;
  fetchSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      logoUrl: 'https://kuatelukgelam.kemenagoki.id/assets/img/logo.png',
      faviconUrl: '',
      ogImageUrl: '',
      siteName: 'Kementerian Agama OKI',
      metaDescription: 'Website Resmi Kementerian Agama Kabupaten OKI',
      socialMedia: {
        facebook: 'https://facebook.com/KemenagOKI',
        instagram: 'https://instagram.com/kemenag.oki',
        youtube: 'https://youtube.com/c/KemenagOKI',
      },
      contactInfo: {
        address: 'Jl. Letnan Mukhtar Saleh No. 063 Kayuagung, Kabupaten OKI',
        phone: '(0714) 321xxx',
        email: 'kaboki@kemenag.go.id',
      },
      sholatTtdNama: '',
      sholatTtdNip: '',
      sholatTtdJabatan: '',
      fetchSettings: async () => {
        try {
          const response = await fetch('/api/db/settings');
          if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
              set((state) => ({ ...state, ...data[0] }));
            }
          }
        } catch (error) {
          console.error("Failed to fetch settings from DB", error);
        }
      },
      updateSettings: async (newSettings) => {
        set((state) => ({ ...state, ...newSettings }));
        
        // Save to DB
        try {
          const currentSettings = get();
          const { updateSettings, fetchSettings, ...settingsData } = currentSettings;
          
          await fetch('/api/db/settings/main', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settingsData)
          });
        } catch (error) {
          console.error("Failed to save settings to DB", error);
        }
      },
    }),
    {
      name: 'kemenag-settings',
    }
  )
);
