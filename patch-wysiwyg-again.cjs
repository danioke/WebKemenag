const fs = require('fs');

function patchFile(filepath) {
  if (!fs.existsSync(filepath)) return;
  let code = fs.readFileSync(filepath, 'utf8');
  
  // Clean up previous patch
  code = code.replace(/import ReactQuill from 'react-quill-new';\nimport 'react-quill-new\/dist\/quill.snow.css';/g, "import RichTextEditor from '../../components/RichTextEditor';");
  
  // Replace <ReactQuill theme="snow" value={...} onChange={...} />
  // with <RichTextEditor value={...} onChange={...} />
  code = code.replace(/<ReactQuill theme="snow" value=\{([^}]+)\} onChange=\{([^}]+)\} \/>/g, '<RichTextEditor value={$1} onChange={$2} />');
  
  fs.writeFileSync(filepath, code);
  console.log("Patched again " + filepath);
}

patchFile('src/pages/admin/LayananAdmin.tsx');
patchFile('src/pages/admin/NavigationAdmin.tsx');
