const fs = require('fs');
const file = '/app/applet/src/pages/VideoDetail.tsx';
let content = fs.readFileSync(file, 'utf8');

const fbCode = `    // Facebook Video Embed
    if (url.includes('facebook.com') || url.includes('fb.watch') || url.includes('fb.gg')) {
      const embedSrc = url.includes('facebook.com/plugins/video.php')
        ? url
        : \`https://www.facebook.com/plugins/video.php?href=\${encodeURIComponent(url)}&show_text=false&autoplay=true\`;
      return (
        <div className="w-full aspect-video rounded-xl overflow-hidden shadow-lg bg-black flex items-center justify-center">
          <iframe 
            src={embedSrc}
            className="w-full h-full border-0"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          />
        </div>
      );
    }

`;

if (!content.includes('Facebook Video Embed')) {
  content = content.replace('// Default (YouTube, direct MP4, etc)', fbCode + '    // Default (YouTube, direct MP4, etc)');
  fs.writeFileSync(file, content);
  console.log('patched VideoDetail with Facebook embed');
}
