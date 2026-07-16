import { create } from 'zustand';

interface MediaPickerState {
  isOpen: boolean;
  callback: (url: string) => void;
  openPicker: (callback: (url: string) => void) => void;
  closePicker: () => void;
}

export const useMediaPickerStore = create<MediaPickerState>((set) => ({
  isOpen: false,
  callback: () => {},
  openPicker: (callback) => set({ isOpen: true, callback }),
  closePicker: () => set({ isOpen: false, callback: () => {} }),
}));
