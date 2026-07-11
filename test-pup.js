import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/');
  await page.evaluate(() => localStorage.setItem('mock_admin_session', 'true'));
  await page.goto('http://localhost:3000/admin/berita');
  await new Promise(r => setTimeout(r, 2000));
  
  const btn = await page.$('button.bg-blue-600');
  if (btn) {
    await btn.click();
    await new Promise(r => setTimeout(r, 2000));
    
    const modal = await page.$('.fixed.inset-0.z-50');
    if (modal) {
      console.log('Modal div found in DOM!');
    } else {
      console.log('Modal div NOT found in DOM!');
    }
  }

  await browser.close();
})();
