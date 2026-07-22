const fs = require('fs');
let code = fs.readFileSync('src/lib/db.ts', 'utf8');

code = code.replace(
  "fetch(`/api/db/${collectionPath}/${id}/delete`, {\n      method: 'POST',\n      headers: {\n        'Content-Type': 'application/json'",
  "fetch(`/api/db/${collectionPath}/${id}`, {\n      method: 'POST',\n      headers: {\n        'Content-Type': 'application/json'"
);

fs.writeFileSync('src/lib/db.ts', code);
