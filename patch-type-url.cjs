const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/pages/admin/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // For social media inputs in SettingsAdmin, keep type="url"
  if (file.includes('SettingsAdmin.tsx')) {
    // We only replace for Logo and Favicon which might be local paths
    // Actually, social media could be anything, let's just make it type="text" everywhere except if it specifically asks for https://
    content = content.replace(/type="url"/g, 'type="text"');
  } else {
    // For other files, replace all type="url" with type="text"
    content = content.replace(/type="url"/g, 'type="text"');
  }
  
  fs.writeFileSync(file, content, 'utf8');
  console.log(`Patched ${file}`);
});
