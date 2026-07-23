const fs = require('fs');
const file = '/app/applet/src/components/MediaGallery.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<img src=\{video\.thumbnail \|\| getYouTubeThumbnail\(video\.videoUrl \|\| ''\)\} /g,
  "<img src={video.thumbnail || getYouTubeThumbnail(video.videoUrl || '') || undefined} "
);

content = content.replace(
  /<img src=\{video\.thumbnail \|\| getYouTubeThumbnail\(video\.videoUrl \|\| ""\)\} className="opacity-50 /g,
  '<img src={video.thumbnail || getYouTubeThumbnail(video.videoUrl || "") || undefined} className="opacity-50 '
);

fs.writeFileSync(file, content);

const file2 = '/app/applet/src/pages/GaleriVideo.tsx';
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace(
  /src=\{video\.thumbnail \|\| getYouTubeThumbnail\(video\.videoUrl\)\}/g,
  "src={video.thumbnail || getYouTubeThumbnail(video.videoUrl) || undefined}"
);
fs.writeFileSync(file2, content2);

console.log('patched');
