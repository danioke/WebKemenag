import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('response', response => {
    if (response.status() === 404 || response.headers()['content-type']?.includes('text/html')) {
      console.log('HTML/404 RESPONSE:', response.url());
    }
  });
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  await page.goto('http://localhost:3000/admin/berita', { waitUntil: 'networkidle0' });
  await browser.close();
})();
