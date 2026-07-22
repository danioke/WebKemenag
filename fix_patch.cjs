const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/FotoAdmin.tsx', 'utf8');

// replace the duplicate isSyncing declaration that was probably there
code = code.replace(/const \[isSyncing, setIsSyncing\] = useState\(false\);\n\s*const \[syncLogs, setSyncLogs\] = useState<string\[\]>\(\[\]\);/g, 'const [syncLogs, setSyncLogs] = useState<string[]>([]);');

fs.writeFileSync('src/pages/admin/FotoAdmin.tsx', code);
