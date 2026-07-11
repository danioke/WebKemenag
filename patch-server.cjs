const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

const oldPost = `  app.post('/api/db/:collection', async (req, res) => {
    try {
      const data = await readCollection(req.params.collection);
      const newItem = req.body;
      newItem.id = newItem.id || Math.random().toString(36).substring(2, 15);
      data.push(newItem);
      await writeCollection(req.params.collection, data);
      res.json({ id: newItem.id, message: 'Item added' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });`;

const newPost = `  app.post('/api/db/:collection', async (req, res) => {
    try {
      const collection = req.params.collection;
      const newItem = req.body;
      newItem.id = newItem.id || Math.random().toString(36).substring(2, 15);
      
      if (useMySQL && pool) {
        await pool.query(
          'INSERT INTO collections (id, collection_name, data) VALUES (?, ?, ?)',
          [newItem.id, collection, JSON.stringify(newItem)]
        );
      } else {
        const data = await readCollection(collection);
        data.push(newItem);
        await writeCollection(collection, data);
      }
      res.json({ id: newItem.id, message: 'Item added' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });`;

if (server.includes(oldPost)) {
  server = server.replace(oldPost, newPost);
  fs.writeFileSync('server.ts', server);
  console.log("Patched server.ts successfully");
} else {
  console.log("Could not find old app.post in server.ts");
}
