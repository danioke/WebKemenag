const fs = require('fs');
const file = '/app/applet/src/components/MediaGallery.tsx';
let content = fs.readFileSync(file, 'utf8');

// add activePlayingIndex state
if (!content.includes('activePlayingIndex')) {
  content = content.replace(
    "const [modalActiveIndex, setModalActiveIndex] = useState(0);",
    "const [modalActiveIndex, setModalActiveIndex] = useState(0);\n  const [activePlayingIndex, setActivePlayingIndex] = useState(0);\n\n  useEffect(() => {\n    const timer = setTimeout(() => setActivePlayingIndex(modalActiveIndex), 300);\n    return () => clearTimeout(timer);\n  }, [modalActiveIndex]);"
  );
  
  content = content.replace(
    /playing=\{isActive && isModalOpen\}/g,
    "playing={isActive && isModalOpen && activePlayingIndex === index}"
  );
  
  fs.writeFileSync(file, content);
  console.log('patched play state');
}
