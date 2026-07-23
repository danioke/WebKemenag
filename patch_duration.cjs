const fs = require('fs');
const file = '/app/applet/src/components/MediaGallery.tsx';
let content = fs.readFileSync(file, 'utf8');

// add dynamic durations state
if (!content.includes('dynamicDurations')) {
  content = content.replace(
    "const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});",
    "const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});\n  const [dynamicDurations, setDynamicDurations] = useState<Record<string, string>>({});"
  );
  
  content = content.replace(
    /Durasi: \{\(item as VideoData\)\.duration\}/g,
    "Durasi: {dynamicDurations[item.id] || (item as VideoData).duration}"
  );
  
  content = content.replace(
    /muted=\{isMuted\}/g,
    "muted={isMuted}\n                                onDuration={(dur) => {\n                                  const mins = Math.floor(dur / 60);\n                                  const secs = Math.floor(dur % 60);\n                                  const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;\n                                  setDynamicDurations(prev => ({ ...prev, [video.id]: formatted }));\n                                }}"
  );
  
  fs.writeFileSync(file, content);
  console.log('patched duration');
}
