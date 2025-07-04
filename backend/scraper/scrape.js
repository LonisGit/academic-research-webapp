const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function scrapeAIS(query, page = 1) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: null,
  });

  const pageInstance = await browser.newPage();

  await pageInstance.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
  );
  await pageInstance.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: 'https://aisel.aisnet.org/',
  });

  try {
    await pageInstance.goto('https://aisel.aisnet.org/', { waitUntil: 'domcontentloaded' });

    // Cookie-Banner akzeptieren
    try {
      await pageInstance.waitForSelector('#onetrust-accept-btn-handler', { timeout: 5000 });
      await pageInstance.click('#onetrust-accept-btn-handler');
      await pageInstance.waitForTimeout(1000);
    } catch { }

    // Suche ausführen
    await pageInstance.waitForSelector('input[name="q"]');
    await pageInstance.type('input[name="q"]', query);
    await pageInstance.keyboard.press('Enter');
    await pageInstance.waitForNavigation({ waitUntil: 'networkidle2' });

    // Falls page > 1: weiterklicken
    for (let i = 1; i < page; i++) {
      await pageInstance.waitForSelector('a#next-page[title="Next Page"]', { timeout: 5000 });
      await pageInstance.click('a#next-page[title="Next Page"]');
      await pageInstance.waitForNavigation({ waitUntil: 'networkidle2' });
      await pageInstance.waitForTimeout(500); // kurz warten für DOM-Update
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

    console.log(`📄 AISel – Seite ${page}, Artikel: ${articles.length}`);
    articles.forEach((a, i) => {
      console.log(`  ${i + 1}. ${a.title}`);
    });

    return articles;

  } catch (err) {
    console.error('❌ Scraping fehlgeschlagen:', err.message);
    throw err;
  } finally {
    await browser.close();
  }
}

module.exports = scrapeAIS;
