const fs = require('fs');

let header = fs.readFileSync('src/components/Header.tsx', 'utf8');

const oldSnapshot = `    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setNavLinks(items);
      } else {
        setNavLinks(staticNavLinks);
      }
    }, (error) => {
      console.error("Failed to fetch dynamic navigation", error);
    });`;

const newSnapshot = `    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        if (snapshot && !snapshot.empty && snapshot.docs && snapshot.docs.length > 0) {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
          // Pastikan item tidak kosong
          if (items.length > 0 && items[0].name) {
            setNavLinks(items);
          } else {
            setNavLinks(staticNavLinks);
          }
        } else {
          setNavLinks(staticNavLinks);
        }
      } catch (err) {
        console.error("Error processing navigation snapshot", err);
        setNavLinks(staticNavLinks);
      }
    }, (error) => {
      console.error("Failed to fetch dynamic navigation", error);
      setNavLinks(staticNavLinks);
    });`;

if (header.includes(oldSnapshot)) {
  header = header.replace(oldSnapshot, newSnapshot);
  fs.writeFileSync('src/components/Header.tsx', header);
  console.log("Patched Header.tsx successfully");
} else {
  console.log("Could not find old snapshot code in Header.tsx");
}
