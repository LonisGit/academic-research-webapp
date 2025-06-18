const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function scrapeAIS(query) {
  const url = `https://aisel.aisnet.org/do/search/?q=${encodeURIComponent(query)}&start=0&context=default`;

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  //    await new Promise(resolve => setTimeout(resolve, 2000));


  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Cookies akzeptieren (optional erweitern)
    try {
      await page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 5000 });
      await page.click('#onetrust-accept-btn-handler');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch {
      console.log('Kein Cookie Banner gefunden oder bereits akzeptiert');
    }

    // Warten, dass die Ergebnisse sicher da sind
    await new Promise(resolve => setTimeout(resolve, 5000));

        const html = await page.content();
    require('fs').writeFileSync('debug.html', html);
    console.log('HTML gespeichert.');

    await page.screenshot({ path: 'debug.png', fullPage: true });
    
    const resultsCount = await page.evaluate(() => {
      return document.querySelectorAll('#results-list > div.result.query').length;
    });
    console.log('Anzahl gefundener Ergebnisse:', resultsCount);

    if (resultsCount === 0) {
      const html = await page.evaluate(() => document.querySelector('#results-list')?.innerHTML || 'keine results-list');
      console.log('Inhalt von #results-list:', html);
    }

    // Dann Artikel auslesen
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



    return articles;
  } catch (error) {
    console.error('Scraping fehlgeschlagen:', error.message);
    throw new Error('Scraping fehlgeschlagen');
  } finally {
    await browser.close();
  }
}

module.exports = scrapeAIS;
