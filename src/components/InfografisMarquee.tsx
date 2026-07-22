import React, { useEffect, useState, useCallback } from 'react';
import { collection, query, orderBy, getDocs, limit } from '../lib/db';
import { db } from '../lib/db';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function InfografisMarquee() {
  const [infographics, setInfographics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [itemsPerView, setItemsPerView] = useState(4);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const fetchInfographics = async () => {
      try {
        const q = query(collection(db, 'infographics'), orderBy('createdAt', 'desc'), limit(12));
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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setItemsPerView(1);
      else if (window.innerWidth < 768) setItemsPerView(2);
      else if (window.innerWidth < 1024) setItemsPerView(3);
      else setItemsPerView(4);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalPages = Math.max(0, infographics.length - itemsPerView + 1);

  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev >= totalPages - 1 ? 0 : prev + 1));
  }, [totalPages]);

  const prevSlide = () => {
    setActiveIndex((prev) => (prev <= 0 ? totalPages - 1 : prev - 1));
  };

  useEffect(() => {
    if (infographics.length <= itemsPerView || isHovered || selectedImage) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [infographics.length, itemsPerView, isHovered, selectedImage, nextSlide]);

  if (loading || infographics.length === 0) return null;

  return (
    <section className="bg-green-900 py-16 my-12 relative border-y-4 border-amber-500">
      {/* Background Pattern/Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Dot Matrix Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.15]"
          style={{ 
            backgroundImage: 'radial-gradient(circle, #fbbf24 1.5px, transparent 1.5px)', 
            backgroundSize: '24px 24px' 
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-green-900/95 via-green-900/80 to-green-900/95"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 relative z-20">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-white font-bold text-2xl uppercase tracking-wider flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></span>
            Infografis Terbaru
          </h3>
          {/* Navigation Arrows for Desktop */}
          <div className="hidden sm:flex gap-2">
            <button 
              onClick={prevSlide}
              disabled={activeIndex === 0}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border border-white/20 ${activeIndex === 0 ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-white/10 hover:bg-amber-500 text-white'}`}
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={nextSlide}
              disabled={activeIndex >= totalPages - 1}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border border-white/20 ${activeIndex >= totalPages - 1 ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-white/10 hover:bg-amber-500 text-white'}`}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div 
          className="relative overflow-hidden group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${activeIndex * (100 / itemsPerView)}%)` }}
          >
            {infographics.map((item, idx) => (
              <div 
                key={item.id || idx} 
                className="w-full shrink-0 px-2"
                style={{ width: `${100 / itemsPerView}%` }}
              >
                <div 
                  className="bg-black/40 border border-white/10 rounded-xl overflow-hidden cursor-pointer group/item hover:border-amber-400/50 transition-colors h-full flex flex-col"
                  onClick={() => setSelectedImage(item.image || item.imageUrl)}
                >
                  <div className="aspect-[3/4] sm:aspect-[4/5] relative overflow-hidden">
                    <img 
                      src={item.image || item.imageUrl} 
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover/item:translate-y-0 transition-transform">
                      <p className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">Infografis</p>
                      <h4 className="text-white font-bold text-sm sm:text-base line-clamp-2">{item.title}</h4>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows for Mobile */}
          <button 
            onClick={prevSlide}
            className={`sm:hidden absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center -ml-2 border border-white/20 ${activeIndex === 0 ? 'bg-black/30 text-white/30' : 'bg-black/70 text-white'}`}
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={nextSlide}
            className={`sm:hidden absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center -mr-2 border border-white/20 ${activeIndex >= totalPages - 1 ? 'bg-black/30 text-white/30' : 'bg-black/70 text-white'}`}
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Owl Carousel Dots */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`transition-all duration-300 rounded-full ${
                  activeIndex === idx 
                    ? 'bg-amber-400 w-6 h-2' 
                    : 'bg-white/30 hover:bg-white/60 w-2 h-2'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md" onClick={() => setSelectedImage(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative h-[95vh] w-full max-w-5xl flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 sm:-top-10 sm:-right-10 text-white hover:text-amber-400 p-2 bg-white/10 hover:bg-white/20 transition-colors rounded-full z-50 backdrop-blur-sm"
              >
                <X size={24} />
              </button>
              <img src={selectedImage} alt="Infografis Preview" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-white/10" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
