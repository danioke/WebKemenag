const fs = require('fs');
let header = fs.readFileSync('src/components/Header.tsx', 'utf8');
if (!header.includes("console.log('Rendering navLinks:', navLinks);")) {
  header = header.replace('const [navLinks, setNavLinks] = useState<NavLink[]>(staticNavLinks);', 'const [navLinks, setNavLinks] = useState<NavLink[]>(staticNavLinks);\n  console.log(\'Rendering navLinks:\', navLinks);');
  fs.writeFileSync('src/components/Header.tsx', header);
}
