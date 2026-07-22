const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/FotoAdmin.tsx', 'utf8');

const stateCode = `
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncMedia = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/videos/auto-fetch', { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        if (result.fetchedCount > 0) {
          toast.success(\`Sinkronisasi Berhasil! \${result.fetchedCount} media baru dari Facebook/Youtube.\`);
          fetchData();
        } else {
          toast.success('Seluruh foto dari media sosial Anda sudah mutakhir.');
        }
      } else {
        toast.error('Gagal menjalankan sinkronisasi media otomatis.');
      }
    } catch (err: any) {
      toast.error('Kesalahan koneksi saat sinkronisasi');
    } finally {
      setIsSyncing(false);
    }
  };
`;

code = code.replace(
  /const \[isEditing, setIsEditing\] = useState\(false\);\n\s*const \[uploading, setUploading\] = useState\(false\);/,
  stateCode
);

const buttonsCode = `
        <div className="flex gap-2">
          <button
            onClick={handleSyncMedia}
            disabled={isSyncing}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} /> 
            {isSyncing ? "Menarik Data..." : "Ambil dari Facebook"}
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Tambah Data
          </button>
        </div>
`;

code = code.replace(
  /<button\s+onClick=\{openAddModal\}[\s\S]*?<\/button>/,
  buttonsCode
);

fs.writeFileSync('src/pages/admin/FotoAdmin.tsx', code);
