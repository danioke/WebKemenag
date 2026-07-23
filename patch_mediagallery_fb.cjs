const fs = require('fs');
const file = '/app/applet/src/components/MediaGallery.tsx';
let content = fs.readFileSync(file, 'utf8');

const fbCode = `                          // Facebook Embed
                          if (url.includes('facebook.com') || url.includes('fb.watch') || url.includes('fb.gg')) {
                            const embedSrc = url.includes('facebook.com/plugins/video.php')
                              ? url
                              : \`https://www.facebook.com/plugins/video.php?href=\${encodeURIComponent(url)}&show_text=false&autoplay=\${isActive && isModalOpen ? 'true' : 'false'}\`;
                            return (
                              <div className="w-full h-full max-w-[800px] max-h-[85vh] aspect-video flex items-center justify-center p-2">
                                <iframe 
                                  src={embedSrc}
                                  className="w-full h-full border-0 pointer-events-auto rounded-xl shadow-2xl bg-black"
                                  allowFullScreen
                                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                                />
                              </div>
                            );
                          }

`;

if (!content.includes('Facebook Embed')) {
  content = content.replace('// Generic Player (Youtube, etc)', fbCode + '                          // Generic Player (Youtube, etc)');
  fs.writeFileSync(file, content);
  console.log('patched MediaGallery with Facebook embed');
}
