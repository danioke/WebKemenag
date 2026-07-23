const fs = require('fs');
const file = '/app/applet/src/components/MediaGallery.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('getYouTubeThumbnail')) {
  content = content.replace(
    "import { Link } from 'react-router-dom';",
    "import { Link } from 'react-router-dom';\nimport { getYouTubeThumbnail } from '../lib/helpers';"
  );

  content = content.replace(
    /<img src=\{video\.thumbnail\} alt=\{video\.title\} /g,
    "<img src={video.thumbnail || getYouTubeThumbnail(video.videoUrl || '')} alt={video.title} "
  );
  
  content = content.replace(
    /<img src=\{video\.thumbnail\} className="opacity-50 object-contain w-full h-full" alt="" \/>/g,
    '<img src={video.thumbnail || getYouTubeThumbnail(video.videoUrl || "")} className="opacity-50 object-contain w-full h-full" alt="" />'
  );

  fs.writeFileSync(file, content);
  console.log('patched mediagallery');
}
