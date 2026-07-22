const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/MediaAdmin.tsx', 'utf8');

code = code.replace('            )}\n          )}\n        </div>', '            )}\n            </>\n          )}\n        </div>');

fs.writeFileSync('src/pages/admin/MediaAdmin.tsx', code);
