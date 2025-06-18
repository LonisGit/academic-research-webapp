const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function scrapeAIS(query) {
  const url = `https://aisel.aisnet.org/do/search/?q=${encodeURIComponent(query)}&start=0&context=default`;

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    await page.screenshot({ path: 'debug.png', fullPage: true });

    await page.waitForSelector('.artifact-description', { timeout: 10000 });

    const articles = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('.artifact-description').forEach(el => {
        const title = el.querySelector('h3 a')?.textContent?.trim() || '';
        const abstract = el.querySelector('.artifact-abstract p')?.textContent?.trim() || '';
        const authors = Array.from(el.querySelectorAll('.artifact-authors a')).map(a => a.textContent.trim());
        items.push({ title, abstract, authors });
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
