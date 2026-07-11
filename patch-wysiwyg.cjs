const fs = require('fs');

function patchFile(filepath) {
  if (!fs.existsSync(filepath)) return;
  let code = fs.readFileSync(filepath, 'utf8');
  
  if (code.includes('react-simple-wysiwyg')) {
    code = code.replace(/import DefaultEditor from 'react-simple-wysiwyg';/g, "import ReactQuill from 'react-quill-new';\nimport 'react-quill-new/dist/quill.snow.css';");
    
    // Replace <DefaultEditor value={x} onChange={(e) => setX(e.target.value)} />
    // with <ReactQuill theme="snow" value={x} onChange={setX} />
    code = code.replace(/<DefaultEditor\s+value=\{([^}]+)\}\s+onChange=\{\(e\) => ([^(]+)\(e\.target\.value\)\}\s*\/>/g, '<ReactQuill theme="snow" value={$1} onChange={$2} />');
    
    fs.writeFileSync(filepath, code);
    console.log("Patched " + filepath);
  }
}

patchFile('src/pages/admin/LayananAdmin.tsx');
patchFile('src/pages/admin/NavigationAdmin.tsx');
