const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/BeritaAdmin.tsx', 'utf8');

const target = `      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan saat menyimpan data');
    }
  };`;

const replacement = `      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error('Terjadi kesalahan: ' + (error.message || 'Gagal menyimpan data'));
    } finally {
      setIsSubmitting(false);
    }
  };`;

code = code.replace(target, replacement);
fs.writeFileSync('src/pages/admin/BeritaAdmin.tsx', code);
console.log("Patched BeritaAdmin.tsx");
