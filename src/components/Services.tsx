import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Book, Heart, GraduationCap, Building2, BookOpen, Award, ArrowRight } from 'lucide-react';

export default function Services() {
  const navigate = useNavigate();
  const services: {
    title: string;
    description: string;
    icon: any;
    color: string;
    borderColor: string;
    path: string;
    isExternal?: boolean;
  }[] = [
    {
      title: "Sertifikasi Halal",
      description: "Layanan pendaftaran dan informasi proses sertifikasi halal BPJPH.",
      icon: Book,
      color: "bg-emerald-50 text-emerald-700",
      borderColor: "group-hover:border-emerald-200",
      path: "/layanan/sertifikasi-halal"
    },
    {
      title: "Urusan Agama Islam",
      description: "Layanan KUA, pendaftaran nikah, rujuk, dan konsultasi keluarga.",
      icon: Heart,
      color: "bg-rose-50 text-rose-700",
      borderColor: "group-hover:border-rose-200",
      path: "/layanan/urusan-agama-islam"
    },
    {
      title: "Pendidikan Madrasah",
      description: "Data RA, MI, MTs, MA, serta layanan administrasi pendidikan.",
      icon: GraduationCap,
      color: "bg-blue-50 text-blue-700",
      borderColor: "group-hover:border-blue-200",
      path: "/layanan/pendidikan-madrasah"
    },
    {
      title: "Pondok Pesantren",
      description: "Layanan perizinan dan informasi pendidikan diniyah dan ponpes.",
      icon: Building2,
      color: "bg-amber-50 text-amber-700",
      borderColor: "group-hover:border-amber-200",
      path: "/layanan/pondok-pesantren"
    },
    {
      title: "Bimas Islam",
      description: "Penyuluhan agama, zakat, wakaf, dan pembinaan syariah.",
      icon: BookOpen,
      color: "bg-purple-50 text-purple-700",
      borderColor: "group-hover:border-purple-200",
      path: "/layanan/bimas-islam"
    },
    {
      title: "Pendidikan Agama Islam (PAIS)",
      description: "Data SIAGA, TPG Guru Agama Islam, serta layanan administrasi keagamaan sekolah.",
      icon: Award,
      color: "bg-emerald-50 text-emerald-700",
      borderColor: "group-hover:border-emerald-200",
      path: "/layanan/pendidikan-agama-islam"
    }
  ];

  const handleServiceClick = (service: typeof services[0]) => {
    if (service.isExternal) {
      window.open(service.path, '_blank', 'noopener,noreferrer');
    } else {
      navigate(service.path);
    }
  };

  return (
    <section className="pt-6 pb-10 sm:pt-10 sm:pb-20 bg-gray-50 relative" id="layanan">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-16">
          <h2 className="text-green-700 font-semibold tracking-wide uppercase text-sm mb-2">Layanan Utama</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Akses Layanan Kementerian Agama</h3>
          <p className="text-gray-600 text-lg">
            Kami menyediakan berbagai layanan publik untuk mempermudah urusan keagamaan dan pendidikan di Kabupaten Ogan Komering Ilir.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              onClick={() => handleServiceClick(service)}
              className={`group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 transition-all ${service.borderColor} cursor-pointer flex flex-col h-full relative overflow-hidden hover:-translate-y-1`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent group-hover:opacity-0 transition-opacity duration-500 z-0 pointer-events-none"></div>
              <div className={`absolute inset-0 ${service.color.split(' ')[0].replace('50', '100')}/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0 pointer-events-none`}></div>
              <div className="absolute -right-12 -top-12 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-500 group-hover:scale-110 pointer-events-none">
                <service.icon size={160} strokeWidth={1} />
              </div>
              <div className="relative z-10 flex flex-col h-full">
                <div className={`w-14 h-14 ${service.color} rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                  <service.icon size={28} strokeWidth={1.5} />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h4>
                <p className="text-gray-600 leading-relaxed flex-grow">
                  {service.description}
                </p>
                <div className="mt-6 flex items-center text-sm font-semibold text-green-700 group-hover:text-green-800">
                  Selengkapnya <ArrowRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
