import React, { useEffect, useState, useRef } from 'react';
import { collection, query, orderBy, getDocs } from '../lib/db';
import { db } from '../lib/db';
import { AnimatePresence, motion } from 'motion/react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function InfografisMarquee() {
  const [infographics, setInfographics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // initial check

    // Auto play
    const interval = setInterval(() => {
      if (!container) return;
      if (container.scrollLeft >= container.scrollWidth - container.clientWidth - 10) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: 300, behavior: 'smooth' });
      }
    }, 4000);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, [infographics]);

  if (loading || infographics.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="bg-green-900 py-8 my-12 relative border-y-4 border-amber-500 group">
      <div className="absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-green-900 to-transparent z-10 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-green-900 to-transparent z-10 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 mb-6 flex justify-between items-center relative z-20">
        <h3 className="text-white font-bold text-lg uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          Infografis
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="p-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed rounded-full text-white backdrop-blur transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="p-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed rounded-full text-white backdrop-blur transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="relative z-20">
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-4 px-4 pb-4 snap-x snap-mandatory hide-scrollbar relative"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {infographics.map((item, idx) => (
            <div 
              key={item.id}
              className="w-48 sm:w-64 shrink-0 snap-start cursor-pointer group/item rounded-xl overflow-hidden shadow-lg border border-white/10 bg-black/20"
              onClick={() => setSelectedImage(item.image || item.imageUrl)}
            >
              <div className="aspect-[3/4] relative">
                <img 
                  src={item.image || item.imageUrl} 
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <p className="text-white font-bold text-xs sm:text-sm leading-tight text-center">{item.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />

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
