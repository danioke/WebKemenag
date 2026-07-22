const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Update type handling
code = code.replace(
  /if \(type === "image"\) \{/g,
  'if (type === "og_image") {\n        targetCategories = ["foto", "foto_pejabat", "foto_staf", "video", "pdf", "dokumen"];\n      } else if (type === "image") {'
);

// Update DB filtering for og_image
code = code.replace(
  /        \/\/ Skip OG images to avoid showing them in the dashboard\n        if \(f\.isOg || \(f\.id && f\.id\.includes\("-og\."\)\)\) \{\n          return;\n        \}/g,
  `        // Filter OG images based on type
        const isOg = f.isOg || (f.id && f.id.includes("-og."));
        if (type === "og_image" && !isOg) {
          return;
        } else if (type !== "og_image" && isOg) {
          return;
        }`
);

// Update Local filtering for og_image
code = code.replace(
  /              \/\/ Skip OG images from local file listings\n              if \(filename\.includes\("-og\."\)\) return;/g,
  `              // Filter OG images from local file listings
              const isOg = filename.includes("-og.");
              if (type === "og_image" && !isOg) return;
              else if (type !== "og_image" && isOg) return;`
);

fs.writeFileSync('server.ts', code);
