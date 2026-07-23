const fs = require('fs');

const file = '/app/applet/src/components/NewsSection.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/src=\{news\[0\]\.image\}/g, "src={news[0].image || undefined}");
content = content.replace(/src=\{item\.image\}/g, "src={item.image || undefined}");
fs.writeFileSync(file, content);

const file2 = '/app/applet/src/pages/BeritaDetail.tsx';
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace(/src=\{berita\.image\}/g, "src={berita.image || undefined}");
fs.writeFileSync(file2, content2);

const file3 = '/app/applet/src/pages/GaleriFoto.tsx';
let content3 = fs.readFileSync(file3, 'utf8');
content3 = content3.replace(/src=\{photo\.image\}/g, "src={photo.image || undefined}");
fs.writeFileSync(file3, content3);

console.log('patched images');
