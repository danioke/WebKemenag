import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from '../lib/db';
import { db } from '../lib/db';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

export default function InfografisMarquee() {
  const [infographics, setInfographics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchInfographics = async () => {
      try {
        const q = query(collection(db, 'infographics'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setInfographics(data);
      } catch (error) {
        console.error("Failed to fetch infographics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInfographics();
  }, []);

  if (loading || infographics.length === 0) return null;

  // Duplicate items for continuous marquee effect if there are too few
  const displayItems = [...infographics, ...infographics, ...infographics, ...infographics].slice(0, Math.max(12, infographics.length * 2));

  return (
    <section className="bg-green-900 py-8 my-12 overflow-hidden border-y-4 border-amber-500 relative">
      <div className="absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-green-900 to-transparent z-10"></div>
      <div className="absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-green-900 to-transparent z-10"></div>
      
      <div className="max-w-7xl mx-auto px-4 mb-4 flex justify-between items-center relative z-20">
        <h3 className="text-white font-bold text-lg uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          Infografis Kegiatan
        </h3>
      </div>

      <div className="flex w-[200%] animate-marquee hover:[animation-play-state:paused]">
        {displayItems.map((item, idx) => (
          <div 
            key={`${item.id}-${idx}`}
            className="w-48 sm:w-64 shrink-0 mx-3 cursor-pointer group rounded-xl overflow-hidden shadow-lg border border-white/10 bg-black/20"
            onClick={() => setSelectedImage(item.imageUrl)}
          >
            <div className="aspect-[3/4] relative">
              <img 
                src={item.imageUrl} 
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <p className="text-white font-bold text-xs sm:text-sm leading-tight text-center">{item.title}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative h-[90vh] max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 p-2 bg-black/50 rounded-full"
              >
                <X size={24} />
              </button>
              <img src={selectedImage} alt="Infografis Preview" className="w-full h-full object-contain rounded-xl" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
