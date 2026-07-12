const fs = require('fs');

let navAdmin = fs.readFileSync('src/pages/admin/NavigationAdmin.tsx', 'utf8');
const oldCondition = `      if (docs.length === 0) {
        console.log("Navigation collection is empty. Auto-seeding default menu and rich data...");`;
        
const newCondition = `      if (docs.length === 0 || !docs[0].name) {
        console.log("Navigation collection is empty or invalid. Auto-seeding default menu and rich data...");`;

if (navAdmin.includes(oldCondition)) {
  navAdmin = navAdmin.replace(oldCondition, newCondition);
  fs.writeFileSync('src/pages/admin/NavigationAdmin.tsx', navAdmin);
  console.log('Patched nav admin successfully');
} else {
  console.log('Failed to patch nav admin');
}
