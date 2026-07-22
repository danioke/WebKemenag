const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/MediaAdmin.tsx', 'utf8');

const startStr = `          ) : filteredFiles.length === 0 ? (`.trim();
const endStr = `        </div>\n      </div>\n\n      {deleteConfirm && (`.trim();

const blockStart = code.indexOf(startStr);
const blockEnd = code.indexOf(endStr, blockStart);

if (blockStart !== -1 && blockEnd !== -1) {
  const newBlock = `          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Folder size={48} className="mx-auto text-gray-300 mb-3" />
              <p>Belum ada media di kategori ini</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {paginatedFiles.map(file => (
                  <div key={file.id} className="group relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50 hover:border-green-400 transition-colors">
                    <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
                      {file.mimeType.startsWith('image/') ? (
                        <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                      ) : file.mimeType.startsWith('video/') ? (
                        <Video size={32} className="text-gray-400" />
                      ) : (
                        <FileText size={32} className="text-gray-400" />
                      )}
                      
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-2">
                        <button onClick={() => copyUrl(file.url)} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm" title="Salin URL">
                          <Copy size={16} />
                        </button>
                        <button onClick={() => { setEditingImage(file.url); setEditorOpen(true); }} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm" title="Crop Gambar" style={{ display: file.mimeType.startsWith("image/") ? "block" : "none" }}><Crop size={16} /></button>
                        <button onClick={() => setDeleteConfirm(file.url)} className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white backdrop-blur-sm" title="Hapus File">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="p-2 text-xs">
                      <p className="truncate font-medium text-gray-800" title={file.name}>{file.name}</p>
                      <p className="text-gray-500">{file.size}</p>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex justify-center items-center gap-2 pb-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-md border border-gray-200 text-sm font-medium disabled:opacity-50 hover:bg-gray-50"
                  >
                    Sebelumnya
                  </button>
                  <span className="text-sm text-gray-600 font-medium px-2">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-md border border-gray-200 text-sm font-medium disabled:opacity-50 hover:bg-gray-50"
                  >
                    Berikutnya
                  </button>
                </div>
              )}
            </>
          )\n\n`;
  code = code.substring(0, blockStart) + newBlock + code.substring(blockEnd);
  fs.writeFileSync('src/pages/admin/MediaAdmin.tsx', code);
} else {
  console.log("Could not find blocks");
}
