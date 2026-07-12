const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// The end of updateHandler
code = code.replace(
  `      res.status(500).json({ error: err.message });
    } finally {
      release();
    }
  });

  // DELETE a document by ID`,
  `      res.status(500).json({ error: err.message });
    } finally {
      release();
    }
  };

  // DELETE a document by ID`
);

// The end of deleteDbHandler
code = code.replace(
  `      res.status(500).json({ error: err.message });
    } finally {
      release();
    }
  });

  // POST local authentication login`,
  `      res.status(500).json({ error: err.message });
    } finally {
      release();
    }
  };

  // POST local authentication login`
);

fs.writeFileSync('server.ts', code);
