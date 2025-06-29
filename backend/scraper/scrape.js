const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function scrapeAIS(query, start = 0) {
  const browser = await puppeteer.launch({
    headless: true, // kannst du beim Debuggen auf false setzen
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: null,
  });

  const pageInstance = await browser.newPage();

  // Realistischen User-Agent und Header setzen
  await pageInstance.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
  );
  await pageInstance.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: 'https://aisel.aisnet.org/',
  });

const searchUrl = `https://aisel.aisnet.org/do/search/?q=${encodeURIComponent(query)}&start=${start}`;

  try {
    await pageInstance.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Cookie-Banner akzeptieren (falls vorhanden)
    try {
      await pageInstance.waitForSelector('#onetrust-accept-btn-handler', { timeout: 5000 });
      await pageInstance.click('#onetrust-accept-btn-handler');
      await pageInstance.waitForTimeout(1000);
    } catch {
      console.log('Kein Banner gefunden.');
    }

    // Ergebnisse extrahieren
    const articles = await pageInstance.evaluate(() => {
      const items = [];
      document.querySelectorAll('#results-list > div.result.query').forEach(el => {
        const title = el.querySelector('p.grid_10 > span.title')?.textContent?.trim() || '';
        const authors = el.querySelector('p.grid_10 > span.author')?.textContent?.replace('Authors:', '').trim() || '';
        const publication = el.querySelector('p.grid_10 > span.pub')?.textContent?.replace('Publication:', '').trim() || '';
        const year = el.querySelector('p.grid_2.fr > span.year')?.textContent?.replace('Date:', '').trim() || '';
        const detailLink = el.querySelector('a')?.href || '';

        items.push({ title, authors, publication, year, detailLink });
      });
      return items;
    });

    console.log(`Gefundene Artikel auf Seite ${start}:`, articles.length);
    return articles;
  } catch (error) {
    console.error('Scraping fehlgeschlagen:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

module.exports = scrapeAIS;
