const fs = require('fs');
const file = '/app/applet/src/components/InfografisMarquee.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<img \n\s*src=\{item\.image \|\| item\.imageUrl\} /g,
  "<img \n                      src={item.image || item.imageUrl || undefined} "
);

fs.writeFileSync(file, content);
console.log('patched marquee');
