const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

const parseDataHelper = `
  function parseDBData(dataRaw) {
    if (typeof dataRaw === 'string') {
      try {
        return JSON.parse(dataRaw);
      } catch (e) {
        return {};
      }
    }
    return dataRaw;
  }
`;

if (!server.includes('parseDBData')) {
  server = server.replace('async function readCollection', parseDataHelper + '\n  async function readCollection');
}

server = server.replace(
  'return (rows as any[]).map(r => r.data);',
  'return (rows as any[]).map(r => parseDBData(r.data));'
);

const oldPutExistingData = `        if (Array.isArray(rows) && rows.length > 0) {
          existingData = (rows as any[])[0].data;
        }`;
const newPutExistingData = `        if (Array.isArray(rows) && rows.length > 0) {
          existingData = parseDBData((rows as any[])[0].data);
        }`;
        
if (server.includes(oldPutExistingData)) {
  server = server.replace(oldPutExistingData, newPutExistingData);
}

fs.writeFileSync('server.ts', server);
console.log("Patched server.ts successfully");
