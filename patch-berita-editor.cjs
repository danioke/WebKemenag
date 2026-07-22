const fs = require('fs');

let code = fs.readFileSync('src/pages/admin/BeritaAdmin.tsx', 'utf8');

// Replace imports
code = code.replace(/import ReactQuill from 'react-quill-new';\nimport 'react-quill-new\/dist\/quill.snow.css';/, "import RichTextEditor from '../../components/RichTextEditor';");

// Remove quillRef
code = code.replace(/\s*const quillRef = useRef<any>\(null\);\s*/, '\n');

// Remove imageHandler
code = code.replace(/\s*const imageHandler = \(\) => \{[\s\S]*?\};\s*};\s*/, '\n');

// Remove modules
code = code.replace(/\s*const modules = useMemo\(\(\) => \(\{[\s\S]*?\}\), \[\]\);\s*/, '\n');

// Replace ReactQuill in JSX
const quillRegex = /<ReactQuill[\s\S]*?value=\{formData\.excerpt\}[\s\S]*?onChange=\{\(content\) => setFormData\(\{ \.\.\.formData, excerpt: content \}\)\}[\s\S]*?\/>/;
code = code.replace(quillRegex, '<RichTextEditor value={formData.excerpt} onChange={(content) => setFormData({ ...formData, excerpt: content })} minHeight="350px" />');

// Remove formats
code = code.replace(/\s*const formats = \[\s*[\s\S]*?\];\s*/, '\n');

fs.writeFileSync('src/pages/admin/BeritaAdmin.tsx', code);
console.log("Patched BeritaAdmin.tsx");
