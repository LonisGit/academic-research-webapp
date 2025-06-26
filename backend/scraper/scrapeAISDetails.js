const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function scrapeAISDetails(detailLink) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(detailLink, { waitUntil: 'domcontentloaded' });

    const data = await page.evaluate(() => {
      const getMeta = name => document.querySelector(`meta[name="${name}"]`)?.content?.trim() || null;

      return {
        abstract: getMeta('description'),
        pdfLink: getMeta('bepress_citation_pdf_url')
      };
    });

    return data;
  } catch (err) {
    console.error('Fehler bei Detailseite:', err.message);
    throw err;
  } finally {
    await browser.close();
  }
}

module.exports = scrapeAISDetails;
