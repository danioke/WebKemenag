const fs = require('fs');
const file = '/app/applet/src/components/MediaGallery.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /playing=\{isActive && isModalOpen && activePlayingIndex === index\}/g,
  "playing={isActive && isModalOpen}"
);

fs.writeFileSync(file, content);
console.log('patched playing');
