import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, FileText, Search, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface CarouselItem {
  image: string;
  category: string;
  title: string;
}

const carouselItems: CarouselItem[] = [
  {
    image: "https://images.unsplash.com/photo-1604085572504-a392ddf0d86a?auto=format&fit=crop&q=80",
    category: "Galeri OKI",
    title: "Masjid Agung Sholihin Kayuagung"
  },
  {
    image: "https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&q=80",
    category: "Fasilitas",
    title: "Pelayanan Terpadu Satu Pintu (PTSP) Kemenag OKI"
  },
  {
    image: "https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&q=80",
    category: "Kegiatan",
    title: "Pembinaan Kerukunan Umat Beragama Kab. OKI"
  },
  {
    image: "https://images.unsplash.com/photo-1585036156171-384164a8c675?auto=format&fit=crop&q=80",
    category: "Pendidikan",
    title: "Pembinaan Siswa Madrasah Berprestasi"
  }
];

export default function Hero() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [banners, setBanners] = useState<any[]>([]);

  // Fetch dynamic banners from Firestore in real-time
  useEffect(() => {
    const q = query(collection(db, 'banners'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBanners(items);
      } else {
        setBanners([]);
      }
    }, (error) => {
      console.error("Failed to fetch dynamic banners for hero", error);
    });

    return () => unsubscribe();
  }, []);

  // Merge Firestore banners with static fallback items
  const activeItems = banners.length > 0 ? banners.map(b => ({
    image: b.image || b.imageUrl || 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&q=80',
    category: 'Banner Kemenag',
    title: b.title
  })) : carouselItems;

  const currentItem = activeItems[activeIndex] || activeItems[0] || carouselItems[0];

  // Auto-slide effect
  useEffect(() => {
    if (activeItems.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % activeItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeItems.length]);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % activeItems.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + activeItems.length) % activeItems.length);
  };

  return (
    <div className="relative bg-green-900 pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Background Pattern/Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-green-900 via-green-900/95 to-green-800/80"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-white"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-6 backdrop-blur-sm text-green-50">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              Portal Resmi Kementerian Agama OKI
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 tracking-tight">
              Ikhlas Beramal untuk <span className="text-amber-400">Umat</span>
            </h1>
            
            <p className="text-lg md:text-xl text-green-100 mb-8 max-w-xl leading-relaxed">
              Mewujudkan masyarakat Kabupaten Ogan Komering Ilir yang taat beragama, rukun, cerdas, dan sejahtera lahir batin.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#" className="inline-flex justify-center items-center gap-2 px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold rounded-xl shadow-lg transition-all hover:-translate-y-0.5">
                <FileText size={18} />
                Layanan Online PTSP
              </a>
              <a href="#" className="inline-flex justify-center items-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl backdrop-blur-sm transition-all">
                Jelajahi Profil
                <ArrowRight size={18} />
              </a>
            </div>

            {/* Quick Search */}
            <div className="mt-10 max-w-md">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Cari informasi layanan, berita..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-green-200/70 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white/20 backdrop-blur-sm transition-all"
                />
                <Search className="absolute left-4 top-3.5 text-green-200/70" size={20} />
              </div>
            </div>
          </motion.div>

          {/* Carousel Section */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:block relative group/carousel"
          >
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative bg-black">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-full h-full relative"
                >
                  <img 
                    src={currentItem.image} 
                    alt={currentItem.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Background overlay gradient: darken both top and bottom for great text readability */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80"></div>
                  
                  {/* Content Overlay - Placed at the top so it is never covered by the floating badge */}
                  <div className="absolute top-6 left-6 right-16 z-10">
                    <motion.p 
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-amber-400 text-xs font-bold tracking-widest uppercase mb-1"
                    >
                      {currentItem.category}
                    </motion.p>
                    <motion.h3 
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-white font-extrabold text-xl leading-snug"
                    >
                      {currentItem.title}
                    </motion.h3>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Slider Arrows */}
              {activeItems.length > 1 && (
                <>
                  <button 
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 border border-white/10 text-white rounded-full flex items-center justify-center backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100 transition-opacity z-20"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button 
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 border border-white/10 text-white rounded-full flex items-center justify-center backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100 transition-opacity z-20"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              {/* Carousel Indicators */}
              {activeItems.length > 1 && (
                <div className="absolute bottom-6 right-6 flex gap-1.5 z-20">
                  {activeItems.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        activeIndex === idx ? 'bg-amber-400 w-5' : 'bg-white/45 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Floating Badges */}
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl flex items-center gap-4 z-20 border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-700">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Pelayanan Harian</p>
                <p className="text-xl font-bold text-gray-900">100+ Warga</p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
