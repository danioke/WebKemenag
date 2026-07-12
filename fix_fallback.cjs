const fs = require('fs');
let code = fs.readFileSync('src/lib/db.ts', 'utf8');

// I will just let the fallback be as is for now except I need to make sure the POST method is handled carefully.
// Let's rewrite the db fallback block!
const fallbackRegex = /if \(url\.includes\('\/api\/db\/'\)\) \{[\s\S]*?\/\/ Default generic JSON response for anything else/g;

code = code.replace(fallbackRegex, `if (url.includes('/api/db/')) {
            const pathPart = url.split('/api/db/')[1];
            const parts = pathPart.split('?')[0].split('/');
            const collectionName = parts[0];
            const docId = parts[1];
            const isDelete = parts[2] === 'delete';
            
            const method = init?.method || 'GET';
            
            if (method === 'GET') {
              if (docId) {
                const localItems = getLocalCollection(collectionName);
                const found = localItems.find((item: any) => item.id === docId);
                if (found) {
                  return new Response(JSON.stringify(found), { status: 200, headers: { 'Content-Type': 'application/json' } });
                } else {
                  return new Response(JSON.stringify({ error: "Dokumen tidak ditemukan" }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                }
              } else {
                const localItems = getLocalCollection(collectionName);
                return new Response(JSON.stringify(localItems), { status: 200, headers: { 'Content-Type': 'application/json' } });
              }
            } else if (method === 'POST') {
              if (isDelete && docId) {
                let localItems = getLocalCollection(collectionName);
                localItems = localItems.filter((i: any) => i.id !== docId);
                saveLocalCollection(collectionName, localItems);
                return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
              } else if (docId) {
                // Update
                const body = init?.body ? JSON.parse(init.body as string) : {};
                const localItems = getLocalCollection(collectionName);
                const index = localItems.findIndex((i: any) => i.id === docId);
                if (index !== -1) {
                  localItems[index] = { ...localItems[index], ...body, id: docId };
                } else {
                  localItems.push({ ...body, id: docId });
                }
                saveLocalCollection(collectionName, localItems);
                return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
              } else {
                // Create
                const body = init?.body ? JSON.parse(init.body as string) : {};
                const localItems = getLocalCollection(collectionName);
                const id = body.id || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                const newItem = { ...body, id, createdAt: body.createdAt || new Date().toISOString() };
                localItems.push(newItem);
                saveLocalCollection(collectionName, localItems);
                return new Response(JSON.stringify({ id }), { status: 200, headers: { 'Content-Type': 'application/json' } });
              }
            }
          }
          
          // Default generic JSON response for anything else`);

fs.writeFileSync('src/lib/db.ts', code);
