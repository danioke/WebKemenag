const fs = require('fs');
const file = '/app/applet/src/pages/GaleriVideo.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('getYouTubeThumbnail')) {
  content = content.replace(
    "import { Helmet } from 'react-helmet-async';",
    "import { Helmet } from 'react-helmet-async';\nimport { getYouTubeThumbnail } from '../lib/helpers';"
  );

  content = content.replace(
    `                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                    
                    {/* Placeholder for video thumbnail, since we don't have explicit thumbnails */}
                    <div className="z-20 w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600/90 transition-all duration-300">
                      <Play className="text-white ml-1" size={28} fill="currentColor" />
                    </div>`,
    `                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                    
                    {(video.thumbnail || getYouTubeThumbnail(video.videoUrl)) && (
                      <img 
                        src={video.thumbnail || getYouTubeThumbnail(video.videoUrl)} 
                        alt={video.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    
                    {/* Play Button Overlay */}
                    <div className="z-20 w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 group-hover:bg-red-600/90 transition-all duration-300">
                      <Play className="text-white ml-1" size={28} fill="currentColor" />
                    </div>`
  );
  
  fs.writeFileSync(file, content);
  console.log('patched galeri video');
}
