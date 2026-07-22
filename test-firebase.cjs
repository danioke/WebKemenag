const fs = require('fs');

let header = fs.readFileSync('src/lib/firebase.ts', 'utf8');
const snippet = header.substring(header.indexOf('export async function getDocs'), header.indexOf('export async function addDoc'));
console.log(snippet);
