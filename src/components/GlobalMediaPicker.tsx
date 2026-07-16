import React from 'react';
import MediaPickerModal from './MediaPickerModal';
import { useMediaPickerStore } from '../store/useMediaPickerStore';

export default function GlobalMediaPicker() {
  const { isOpen, callback, closePicker } = useMediaPickerStore();

  if (!isOpen) return null;

  return (
    <MediaPickerModal 
      onSelect={(url) => {
        callback(url);
        closePicker();
      }}
      onClose={closePicker}
    />
  );
}
