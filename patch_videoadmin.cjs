const fs = require('fs');
const file = '/app/applet/src/pages/admin/VideoAdmin.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('getYouTubeThumbnail')) {
  content = content.replace(
    "import { Plus, Edit, Trash2, X, Video, Settings2, RefreshCw, Smartphone, Globe, Youtube, Key } from 'lucide-react';",
    "import { Plus, Edit, Trash2, X, Video, Settings2, RefreshCw, Smartphone, Globe, Youtube, Key } from 'lucide-react';\nimport { getYouTubeThumbnail } from '../../lib/helpers';"
  );

  content = content.replace(
    "          videoUrl: formData.videoUrl,",
    "          videoUrl: formData.videoUrl,\n          thumbnail: getYouTubeThumbnail(formData.videoUrl),"
  );
  
  content = content.replace(
    "          duration: formData.duration || '',",
    "          duration: formData.duration || '',\n          thumbnail: getYouTubeThumbnail(formData.videoUrl),"
  );
  
  fs.writeFileSync(file, content);
  console.log('patched');
}
