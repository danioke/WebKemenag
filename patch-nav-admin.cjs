const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/NavigationAdmin.tsx', 'utf8');

const oldFetch = `      if (querySnapshot.empty) {
        setItems(getDefaultsList() as any);
      } else {
        const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NavLink));
        setItems(docs);
      }`;

const newFetch = `      if (querySnapshot.empty || !querySnapshot.docs || querySnapshot.docs.length === 0) {
        setItems(getDefaultsList() as any);
      } else {
        const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NavLink));
        if (docs.length > 0 && docs[0].name) {
          setItems(docs);
        } else {
          setItems(getDefaultsList() as any);
        }
      }`;

if (content.includes(oldFetch)) {
  content = content.replace(oldFetch, newFetch);
  fs.writeFileSync('src/pages/admin/NavigationAdmin.tsx', content);
  console.log("Patched NavigationAdmin.tsx successfully");
} else {
  console.log("Could not find old fetch in NavigationAdmin.tsx");
}
