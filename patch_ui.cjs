const fs = require('fs');
const file = '/app/applet/src/components/MediaGallery.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update comments button
content = content.replace(
  "onClick={() => toast.success('Fitur interaksi komentar khusus anggota diaktifkan.')}",
  "onClick={() => setShowComments(!showComments)}"
);

// Add views to overlay
content = content.replace(
  /<h4 className="text-sm font-bold text-gray-100 max-w-xl line-clamp-2 md:text-base leading-snug">\n\s*\{item\.title\}\n\s*<\/h4>/g,
  `<h4 className="text-sm font-bold text-gray-100 max-w-xl line-clamp-2 md:text-base leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-xs text-gray-300 mt-1">{viewCounts[item.id] || 0} tayangan</p>`
);

// Add comments sliding panel
const commentsPanel = `
          {/* Comments Panel */}
          <AnimatePresence>
            {showComments && (
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute right-0 top-0 bottom-0 w-80 bg-zinc-900 border-l border-white/10 z-50 flex flex-col"
              >
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                  <h3 className="text-white font-bold text-sm">Komentar</h3>
                  <button onClick={() => setShowComments(false)} className="text-gray-400 hover:text-white">
                    <X size={18} />
                  </button>
                </div>
                
                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                  {(comments[activeMediaArray[modalActiveIndex]?.id] || []).length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-10">Belum ada komentar. Jadilah yang pertama!</div>
                  ) : (
                    (comments[activeMediaArray[modalActiveIndex]?.id] || []).map((c, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-bold">{c.name}</p>
                          <p className="text-sm text-gray-200 mt-0.5">{c.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="p-4 border-t border-white/10">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Tambahkan komentar..."
                      className="flex-grow bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 placeholder-gray-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newComment.trim()) {
                          const id = activeMediaArray[modalActiveIndex]?.id;
                          const c = { name: 'Pengunjung', text: newComment };
                          setComments(prev => ({ ...prev, [id]: [...(prev[id] || []), c] }));
                          setNewComment('');
                          toast.success('Komentar ditambahkan');
                        }
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
`;

content = content.replace(
  "{/* Vertical Scroll Snapping Container */}",
  commentsPanel + "\n          {/* Vertical Scroll Snapping Container */}"
);

fs.writeFileSync(file, content);
console.log('patched UI comments');
