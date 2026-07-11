const { execSync } = require('child_process');
const fs = require('fs');

let header = fs.readFileSync('src/components/Header.tsx', 'utf8');
console.log(header.substring(0, 100));
