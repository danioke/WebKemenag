const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Remove the first set of route handlers
code = code.replace(
  `  // PUT (update/set) a document by ID
  app.put("/api/db/:collection/:id", async (req, res) => updateHandler(req, res));
  app.post("/api/db/:collection/:id", async (req, res) => updateHandler(req, res));

  const updateHandler = async (req: any, res: any) => {`,
  `  // PUT (update/set) a document by ID
  const updateHandler = async (req: any, res: any) => {`
);

fs.writeFileSync('server.ts', code);
