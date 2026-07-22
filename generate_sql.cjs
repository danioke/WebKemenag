const fs = require('fs');
const path = require('path');

const dbDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dbDir)) {
  console.log("No data directory found.");
  process.exit(0);
}

let sql = `
CREATE TABLE IF NOT EXISTS collections (
  id VARCHAR(255) NOT NULL,
  collection_name VARCHAR(255) NOT NULL,
  data JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (collection_name, id)
);\n\n`;

const files = fs.readdirSync(dbDir).filter(f => f.endsWith('.json'));

for (const file of files) {
  const collectionName = file.replace('.json', '');
  const filePath = path.join(dbDir, file);
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (Array.isArray(data)) {
      for (const item of data) {
        const id = item.id || Math.random().toString(36).substring(2, 15);
        const dataJson = JSON.stringify(item).replace(/'/g, "''"); // escape single quotes
        sql += `INSERT IGNORE INTO collections (id, collection_name, data) VALUES ('${id}', '${collectionName}', '${dataJson}');\n`;
      }
    }
  } catch (err) {
    console.error(`Error processing ${file}:`, err);
  }
}

fs.writeFileSync('database.sql', sql);
console.log("Generated database.sql");
