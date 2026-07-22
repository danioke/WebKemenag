const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/MediaAdmin.tsx', 'utf8');

code = code.replace(
  /\) : \(\n\s*<div className="grid grid-cols-2/,
  ') : (\n            <>\n              <div className="grid grid-cols-2'
);

code = code.replace(
  /            \}\)\n          \)\}/,
  '            )}\n            </>\n          )}'
);

fs.writeFileSync('src/pages/admin/MediaAdmin.tsx', code);
