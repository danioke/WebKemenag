const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

server = server.replace(
  `  app.put("/api/db/:collection/:id", async (req, res) => {`,
  `  const updateDbHandler = async (req: any, res: any) => {`
);

server = server.replace(
  `  app.delete("/api/db/:collection/:id", async (req, res) => {`,
  `  // Route definitions using POST to bypass strict hosting web servers that block PUT/DELETE
  app.put("/api/db/:collection/:id", updateDbHandler);
  app.post("/api/db/:collection/:id", updateDbHandler);

  const deleteDbHandler = async (req: any, res: any) => {`
);

server = server.replace(
  `  app.post("/api/auth/login", (req, res) => {`,
  `  app.delete("/api/db/:collection/:id", deleteDbHandler);
  app.post("/api/db/:collection/:id/delete", deleteDbHandler);

  app.post("/api/auth/login", (req, res) => {`
);

// We need to fix the closing brackets of updateDbHandler and deleteDbHandler
server = server.replace(
  `      res.status(500).json({ error: "Failed to update document" });\n    }\n  });`,
  `      res.status(500).json({ error: "Failed to update document" });\n    }\n  };`
);

server = server.replace(
  `      res.status(500).json({ error: "Failed to delete document" });\n    }\n  });`,
  `      res.status(500).json({ error: "Failed to delete document" });\n    }\n  };`
);

fs.writeFileSync('server.ts', server, 'utf8');
console.log('Routes patched!');
