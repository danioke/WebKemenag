const fs = require('fs');
const file = '/app/applet/src/pages/admin/VideoAdmin.tsx';
let content = fs.readFileSync(file, 'utf8');

const fbCode = `    // Facebook
    if (url.includes('facebook.com') || url.includes('fb.watch') || url.includes('fb.gg')) {
      const embedSrc = url.includes('facebook.com/plugins/video.php')
        ? url
        : \`https://www.facebook.com/plugins/video.php?href=\${encodeURIComponent(url)}&show_text=false&autoplay=false\`;
      return (
        <iframe 
          src={embedSrc}
          className="w-full h-full border-0 pointer-events-none"
          allowFullScreen
        />
      );
    }

`;

if (!content.includes('// Facebook')) {
  content = content.replace("    return (\n      <div className=\"w-full h-full pointer-events-none bg-black\">", fbCode + "    return (\n      <div className=\"w-full h-full pointer-events-none bg-black\">");
  fs.writeFileSync(file, content);
  console.log('patched VideoAdmin with Facebook embed');
}
