const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/FotoAdmin.tsx', 'utf8');

code = code.replace(/<\/button>\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>/, '</button>\n        </div>\n      </div>');

fs.writeFileSync('src/pages/admin/FotoAdmin.tsx', code);
