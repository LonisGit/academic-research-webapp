const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const fs = require('fs');

async function scrapeAIS(query) {
  const browser = await puppeteer.launch({
    headless: false, // zum Debuggen false, später true
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: null
  });

  const page = await browser.newPage();

  // Realistischen User-Agent und Header setzen
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://aisel.aisnet.org/'
  });

  try {
    // Erst Hauptseite aufrufen, dann die Suche ausführen
    await page.goto('https://aisel.aisnet.org/', { waitUntil: 'networkidle2', timeout: 30000 });

    // Cookie-Banner akzeptieren
    try {
      await page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 5000 });
      await page.click('#onetrust-accept-btn-handler');
      await page.waitForTimeout(1000);
    } catch {
      console.log('Kein Cookie-Banner gefunden.');
    }

    // Suchfeld finden und Query eingeben
    await page.waitForSelector('input[name="q"]');
    await page.type('input[name="q"]', query);
    await page.keyboard.press('Enter');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Optional: Screenshot und HTML speichern
    const html = await page.content();
    fs.writeFileSync('debug.html', html);
    await page.screenshot({ path: 'debug.png', fullPage: true });

    // Ergebnisse extrahieren
    const articles = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('#results-list > div.result.query').forEach(el => {
        const title = el.querySelector('p.grid_10 > span.title')?.textContent?.trim() || '';
        const authors = el.querySelector('p.grid_10 > span.author')?.textContent?.replace('Authors:', '').trim() || '';
        const publication = el.querySelector('p.grid_10 > span.pub')?.textContent?.trim() || '';
        const year = el.querySelector('p.grid_2.fr > span.year')?.textContent?.trim() || '';
        items.push({ title, authors, publication, year });
      });
      return items;
    });

    console.log('Gefundene Artikel:', articles.length);
    return articles;
  } catch (error) {
    console.error('Scraping fehlgeschlagen:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

module.exports = scrapeAIS;
