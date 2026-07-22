const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/FotoAdmin.tsx', 'utf8');

// Remove handleSyncMedia
code = code.replace(/const handleSyncMedia = async \(\) => \{[\s\S]*?\}\s*;\s*/g, '');

// Remove duplicate buttons block I injected
code = code.replace(/<div className="flex gap-2">\s*<button\s*onClick=\{handleSyncMedia\}[\s\S]*?<button\s*onClick=\{openAddModal\}[\s\S]*?<\/button>\s*<\/div>/g, '<button\n            onClick={openAddModal}\n            className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"\n          >\n            <Plus size={16} /> Tambah Data\n          </button>\n        </div>');

fs.writeFileSync('src/pages/admin/FotoAdmin.tsx', code);
