const fs = require('fs');
const file = '/app/applet/src/pages/admin/VideoAdmin.tsx';
let content = fs.readFileSync(file, 'utf8');

// fix the double thumbnail in updateDoc
content = content.replace(
`        await updateDoc(docRef, {
          title: formData.title,
          videoUrl: formData.videoUrl,
          thumbnail: getYouTubeThumbnail(formData.videoUrl),
          duration: formData.duration || '',
          thumbnail: getYouTubeThumbnail(formData.videoUrl),
        });`,
`        await updateDoc(docRef, {
          title: formData.title,
          videoUrl: formData.videoUrl,
          thumbnail: getYouTubeThumbnail(formData.videoUrl),
          duration: formData.duration || '',
        });`
);

// fix the missing thumbnail in addDoc
content = content.replace(
`        await addDoc(collection(db, 'videos'), {
          title: formData.title,
          videoUrl: formData.videoUrl,
          duration: formData.duration || '',
          createdAt: serverTimestamp()
        });`,
`        await addDoc(collection(db, 'videos'), {
          title: formData.title,
          videoUrl: formData.videoUrl,
          thumbnail: getYouTubeThumbnail(formData.videoUrl),
          duration: formData.duration || '',
          createdAt: serverTimestamp()
        });`
);

fs.writeFileSync(file, content);
console.log('fixed patch');
