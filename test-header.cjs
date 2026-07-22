const fs = require('fs');

let header = fs.readFileSync('src/components/Header.tsx', 'utf8');
const snapshotSnippet = header.match(/const unsubscribe = onSnapshot([\s\S]*?)return \(\) => unsubscribe\(\);/)[0];
console.log(snapshotSnippet);
