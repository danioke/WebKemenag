const fs = require('fs');
const file = '/app/applet/src/pages/admin/VideoAdmin.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /playing=\{false\}/g,
  "playing={true} muted={true}"
);

fs.writeFileSync(file, content);
console.log('patched admin player');
