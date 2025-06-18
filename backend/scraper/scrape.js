const puppeteer = require('puppeteer');

async function scrapeAIS(query) {
  const url = `https://aisel.aisnet.org/do/search/?q=${encodeURIComponent(query)}&start=0&context=default`;

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0 Safari/537.36'
  );

  await page.goto(url, { waitUntil: 'networkidle2' });

  const html = await page.content();
  require('fs').writeFileSync('debug.html', html);
  console.log('HTML gespeichert.');


  const articles = await page.evaluate(() => {
    const results = [];
    const elements = document.querySelectorAll('.artifact-description');

    elements.forEach(el => {
      const titleEl = el.querySelector('h3 a');
      const abstractEl = el.querySelector('.artifact-abstract p');
      const authorEls = el.querySelectorAll('.artifact-authors a');

      const title = titleEl ? titleEl.textContent.trim() : '';
      const abstract = abstractEl ? abstractEl.textContent.trim() : '';
      const authors = Array.from(authorEls).map(a => a.textContent.trim());

      results.push({ title, abstract, authors });
    });

    return results;
  });

  await browser.close();
  return articles;
}

scrapeAIS('digital transformation')
  .then(results => console.log(results))
  .catch(err => console.error('Fehler beim Scrapen:', err));

module.exports = scrapeAIS;
