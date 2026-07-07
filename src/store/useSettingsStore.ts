import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  logoUrl: string;
  faviconUrl: string;
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
  updateSettings: (newSettings: Partial<Omit<SettingsState, 'updateSettings'>>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      logoUrl: 'https://kuatelukgelam.kemenagoki.id/assets/img/logo.png',
      faviconUrl: '',
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
      updateSettings: (newSettings) => set((state) => ({ ...state, ...newSettings })),
    }),
    {
      name: 'kemenag-settings',
    }
  )
);
