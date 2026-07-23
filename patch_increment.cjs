const fs = require('fs');
const file = '/app/applet/src/components/MediaGallery.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove increment import
content = content.replace(
  "import { collection, getDocs, query, orderBy, doc, updateDoc, increment } from '../lib/db';",
  "import { collection, getDocs, query, orderBy, doc, updateDoc } from '../lib/db';"
);

content = content.replace(
  /views: increment\(1\)/g,
  "views: (item.views || 0) + 1"
);

content = content.replace(
  /likes: increment\(isLiked \? -1 : 1\)/g,
  "likes: (likeCounts[id] || 0) + (isLiked ? -1 : 1)"
);

fs.writeFileSync(file, content);
console.log('patched increment');
