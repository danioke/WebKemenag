const fs = require('fs');
const file = '/app/applet/src/components/MediaGallery.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<Player \n\s*url=\{url\}\n\s*width="100%"\n\s*height="100%"/g,
  '<Player \n                                url={url}\n                                width="100%"\n                                height="100%"\n                                style={{ position: "absolute", top: 0, left: 0 }}'
);

fs.writeFileSync(file, content);
console.log('patched player style');
