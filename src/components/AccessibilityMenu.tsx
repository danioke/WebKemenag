import React, { useState, useEffect } from 'react';
import { Accessibility, Type, Contrast, Monitor, Link2, X, RotateCcw, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    fontSize: 100, // percentage
    highContrast: false,
    grayscale: false,
    highlightLinks: false,
  });

  useEffect(() => {
    // Apply Font Size
    document.documentElement.style.fontSize = `${settings.fontSize}%`;

    // Apply High Contrast & Grayscale via classes or filter
    const html = document.documentElement;
    if (settings.highContrast) {
      html.classList.add('a11y-high-contrast');
    } else {
      html.classList.remove('a11y-high-contrast');
    }

    if (settings.grayscale) {
      html.classList.add('a11y-grayscale');
    } else {
      html.classList.remove('a11y-grayscale');
    }

    if (settings.highlightLinks) {
      html.classList.add('a11y-highlight-links');
    } else {
      html.classList.remove('a11y-highlight-links');
    }

  }, [settings]);

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const increaseFontSize = () => {
    setSettings(prev => ({ ...prev, fontSize: Math.min(prev.fontSize + 10, 130) }));
  };

  const decreaseFontSize = () => {
    setSettings(prev => ({ ...prev, fontSize: Math.max(prev.fontSize - 10, 90) }));
  };

  const resetSettings = () => {
    setSettings({
      fontSize: 100,
      highContrast: false,
      grayscale: false,
      highlightLinks: false,
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 mb-4 w-72 origin-bottom-right"
          >
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Accessibility size={18} className="text-green-700" />
                Aksesibilitas
              </h3>
              <button 
                onClick={resetSettings}
                className="text-xs text-gray-500 hover:text-green-700 flex items-center gap-1 transition-colors"
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>

            <div className="space-y-4">
              {/* Text Size */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Ukuran Teks</p>
                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl">
                  <button onClick={decreaseFontSize} disabled={settings.fontSize <= 90} className="flex-1 flex justify-center p-2 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-50 transition-all text-gray-700">
                    <Type size={14} />
                  </button>
                  <span className="text-xs font-bold w-12 text-center text-gray-700">{settings.fontSize}%</span>
                  <button onClick={increaseFontSize} disabled={settings.fontSize >= 130} className="flex-1 flex justify-center p-2 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-50 transition-all text-gray-700">
                    <Type size={18} />
                  </button>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Tampilan</p>
                
                <button 
                  onClick={() => toggleSetting('highContrast')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${settings.highContrast ? 'bg-green-50 border-green-200 text-green-800' : 'border-gray-100 hover:border-green-200 hover:bg-gray-50 text-gray-700'}`}
                >
                  <span className="flex items-center gap-3 text-sm font-medium">
                    <Contrast size={16} className={settings.highContrast ? 'text-green-600' : 'text-gray-400'} />
                    Kontras Tinggi
                  </span>
                  <div className={`w-8 h-4 rounded-full transition-colors relative ${settings.highContrast ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${settings.highContrast ? 'left-4.5' : 'left-0.5'}`} style={{ left: settings.highContrast ? 'calc(100% - 14px)' : '2px' }}></div>
                  </div>
                </button>

                <button 
                  onClick={() => toggleSetting('grayscale')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${settings.grayscale ? 'bg-green-50 border-green-200 text-green-800' : 'border-gray-100 hover:border-green-200 hover:bg-gray-50 text-gray-700'}`}
                >
                  <span className="flex items-center gap-3 text-sm font-medium">
                    <Monitor size={16} className={settings.grayscale ? 'text-green-600' : 'text-gray-400'} />
                    Skala Abu-abu
                  </span>
                  <div className={`w-8 h-4 rounded-full transition-colors relative ${settings.grayscale ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${settings.grayscale ? 'left-4.5' : 'left-0.5'}`} style={{ left: settings.grayscale ? 'calc(100% - 14px)' : '2px' }}></div>
                  </div>
                </button>

                <button 
                  onClick={() => toggleSetting('highlightLinks')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${settings.highlightLinks ? 'bg-green-50 border-green-200 text-green-800' : 'border-gray-100 hover:border-green-200 hover:bg-gray-50 text-gray-700'}`}
                >
                  <span className="flex items-center gap-3 text-sm font-medium">
                    <Link2 size={16} className={settings.highlightLinks ? 'text-green-600' : 'text-gray-400'} />
                    Sorot Tautan
                  </span>
                  <div className={`w-8 h-4 rounded-full transition-colors relative ${settings.highlightLinks ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${settings.highlightLinks ? 'left-4.5' : 'left-0.5'}`} style={{ left: settings.highlightLinks ? 'calc(100% - 14px)' : '2px' }}></div>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-green-700 hover:bg-green-800 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-green-700/30"
        aria-label="Menu Aksesibilitas"
      >
        {isOpen ? <X size={24} /> : <Accessibility size={24} />}
      </button>
    </div>
  );
}
