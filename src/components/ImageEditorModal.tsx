import React, { useState, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onSave: (blob: Blob) => Promise<void>;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

export default function ImageEditorModal({ isOpen, onClose, imageUrl, onSave }: ImageEditorModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(16 / 9);
  const imgRef = useRef<HTMLImageElement>(null);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  };

  const handleSave = async () => {
    if (!completedCrop || !imgRef.current) {
      toast.error('Silakan crop gambar terlebih dahulu');
      return;
    }

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );

    setSaving(true);
    canvas.toBlob(async (blob) => {
      if (blob) {
        await onSave(blob);
        onClose();
      } else {
        toast.error('Gagal memproses gambar');
      }
      setSaving(false);
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">Edit Gambar (Crop)</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 bg-gray-900 flex-1 overflow-auto flex items-center justify-center">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
            className="max-h-full max-w-full"
          >
            <img
              ref={imgRef}
              src={imageUrl}
              onLoad={onImageLoad}
              alt="Crop preview"
              className="max-h-[60vh] object-contain"
              crossOrigin="anonymous"
            />
          </ReactCrop>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => { setAspect(16 / 9); setCrop(imgRef.current ? centerAspectCrop(imgRef.current.width, imgRef.current.height, 16/9) : undefined); }}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg ${aspect === 16/9 ? 'bg-green-700 text-white' : 'bg-white border border-gray-300'}`}
            >
              16:9
            </button>
            <button
              onClick={() => { setAspect(4 / 3); setCrop(imgRef.current ? centerAspectCrop(imgRef.current.width, imgRef.current.height, 4/3) : undefined); }}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg ${aspect === 4/3 ? 'bg-green-700 text-white' : 'bg-white border border-gray-300'}`}
            >
              4:3
            </button>
            <button
              onClick={() => { setAspect(1); setCrop(imgRef.current ? centerAspectCrop(imgRef.current.width, imgRef.current.height, 1) : undefined); }}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg ${aspect === 1 ? 'bg-green-700 text-white' : 'bg-white border border-gray-300'}`}
            >
              1:1
            </button>
            <button
              onClick={() => { setAspect(undefined); setCrop(undefined); }}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg ${aspect === undefined ? 'bg-green-700 text-white' : 'bg-white border border-gray-300'}`}
            >
              Bebas
            </button>
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg">
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-5 py-2 rounded-lg font-bold transition-colors disabled:opacity-70"
            >
              {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
              Simpan Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
