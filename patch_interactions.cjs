const fs = require('fs');
const file = '/app/applet/src/components/MediaGallery.tsx';
let content = fs.readFileSync(file, 'utf8');

// Imports
content = content.replace(
  "import { collection, getDocs, query, orderBy } from '../lib/db';",
  "import { collection, getDocs, query, orderBy, doc, updateDoc, increment } from '../lib/db';"
);

// State
if (!content.includes('viewCounts')) {
  content = content.replace(
    "const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});",
    "const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});\n  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});\n  const [showComments, setShowComments] = useState(false);\n  const [comments, setComments] = useState<Record<string, any[]>>({});\n  const [newComment, setNewComment] = useState('');"
  );
  
  // Data fetch
  content = content.replace(
    "const initialLikes: Record<string, number> = {};",
    "const initialLikes: Record<string, number> = {};\n        const initialViews: Record<string, number> = {};"
  );
  
  content = content.replace(
    /initialLikes\[p\.id\] = Math\.floor\(Math\.random\(\) \* 200\) \+ 50;/g,
    "initialLikes[p.id] = (p as any).likes || Math.floor(Math.random() * 200) + 50;\n          initialViews[p.id] = (p as any).views || Math.floor(Math.random() * 1000) + 200;"
  );
  
  content = content.replace(
    /initialLikes\[v\.id\] = Math\.floor\(Math\.random\(\) \* 500\) \+ 120;/g,
    "initialLikes[v.id] = (v as any).likes || Math.floor(Math.random() * 500) + 120;\n          initialViews[v.id] = (v as any).views || Math.floor(Math.random() * 2000) + 300;"
  );
  
  content = content.replace(
    "setLikeCounts(initialLikes);",
    "setLikeCounts(initialLikes);\n        setViewCounts(initialViews);"
  );
  
  // openModal views increment
  content = content.replace(
    "setModalActiveIndex(index);",
    "setModalActiveIndex(index);\n    \n    // Increment Views\n    const item = (activeTab === 'foto' ? photos : videos)[index];\n    if (item) {\n      setViewCounts(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));\n      updateDoc(doc(db, activeTab === 'foto' ? 'photos' : 'videos', item.id), {\n        views: increment(1)\n      }).catch(console.error);\n    }"
  );
  
  // toggleLike likes update
  content = content.replace(
    "setLikedItems(prev => ({ ...prev, [id]: !isLiked }));",
    "setLikedItems(prev => ({ ...prev, [id]: !isLiked }));\n    \n    // Update DB\n    updateDoc(doc(db, activeTab === 'foto' ? 'photos' : 'videos', id), {\n      likes: increment(isLiked ? -1 : 1)\n    }).catch(console.error);"
  );
  
  fs.writeFileSync(file, content);
  console.log('patched interactions state');
}
