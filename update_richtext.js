const fs = require('fs');
let content = fs.readFileSync('src/components/RichTextEditor.tsx', 'utf8');

const newImageHandler = `  const { openPicker } = useMediaPickerStore();
  const imageHandler = () => {
    openPicker((url) => {
      const quill = quillRef.current?.getEditor();
      if (quill) {
        const range = quill.getSelection(true);
        quill.insertEmbed(range?.index || 0, 'image', url);
        quill.setSelection((range?.index || 0) + 1);
      }
    });
  };`;

content = content.replace(/const imageHandler = \(\) => \{[\s\S]*?\};\n  \};\n/, newImageHandler + '\n');
fs.writeFileSync('src/components/RichTextEditor.tsx', content);
