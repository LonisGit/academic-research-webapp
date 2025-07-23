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

    // Cookies akzeptieren
    try {
      await pageInstance.waitForSelector('#onetrust-accept-btn-handler', { timeout: 5000 });
      await pageInstance.click('#onetrust-accept-btn-handler');
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch {}

    // Suche starten
    await pageInstance.waitForSelector('input[name="q"]');
    await pageInstance.type('input[name="q"]', query);
    await pageInstance.keyboard.press('Enter');
    await pageInstance.waitForNavigation({ waitUntil: 'networkidle2' });

    // Weiterklicken falls gewünscht
    for (let i = 1; i < page; i++) {
      const oldTitle = await pageInstance.evaluate(() =>
        document.querySelector('#results-list .result.query span.title')?.textContent?.trim() || ''
      );

      await pageInstance.waitForSelector('a#next-page[title="Next Page"]', { timeout: 5000 });
      await pageInstance.click('a#next-page[title="Next Page"]');

      await pageInstance.waitForFunction(
        old => {
          const newTitle = document.querySelector('#results-list .result.query span.title')?.textContent?.trim() || '';
          return newTitle && newTitle !== old;
        },
        {},
        oldTitle
      );

      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Ergebnisse mappen
    const articles = await pageInstance.evaluate(() => {
      const items = [];
      document.querySelectorAll('#results-list .result.query').forEach(el => {
        const title = el.querySelector('span.title')?.textContent?.trim() || '';
        const authors = el.querySelector('span.author')?.textContent?.replace('Authors:', '').trim() || '';
        const publication = el.querySelector('span.pub')?.textContent?.replace('Publication:', '').trim() || '';
        const year = el.querySelector('span.year')?.textContent?.replace('Date:', '').trim() || '';
        const detailLink = el.querySelector('a')?.href || '';
        items.push({ title, authors, publication, year, detailLink });
      });
      return items;
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
