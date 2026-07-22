const fs = require('fs');
const file = '/app/applet/src/components/InfografisMarquee.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
`      {/* Background Pattern/Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-green-900 via-green-900/95 to-green-800/80"></div>
      </div>`,
`      {/* Background Pattern/Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Dot Matrix Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.15]"
          style={{ 
            backgroundImage: 'radial-gradient(circle, #fbbf24 1.5px, transparent 1.5px)', 
            backgroundSize: '24px 24px' 
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-green-900/95 via-green-900/80 to-green-900/95"></div>
      </div>`
);
fs.writeFileSync(file, content);
console.log('patched');
