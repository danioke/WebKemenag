const fs = require('fs');
const file = '/app/applet/src/components/BannerCarousel.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /src=\{banner\.image \|\| banner\.imageUrl\}/g,
  "src={banner.image || banner.imageUrl || undefined}"
);

fs.writeFileSync(file, content);
console.log('patched banner');
