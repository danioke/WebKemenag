const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/MediaAdmin.tsx', 'utf8');

const paginationUI = `
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
          )}
`;

code = code.replace(
  /\s*\)\)\}\n\s*<\/div>\n\s*\)\}/,
  paginationUI
);

fs.writeFileSync('src/pages/admin/MediaAdmin.tsx', code);
