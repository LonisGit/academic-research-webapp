const axios = require('axios');
const cheerio = require('cheerio');

async function scrape(url) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const articles = [];

    // Artikel-Container identifizieren
    $('.artifact-description').each((i, el) => {
      const title = $(el).find('h3 a').text().trim();

      // Abstract
      const abstract = $(el).find('.artifact-abstract p').text().trim();

      // Autoren
      const authors = [];
      $(el).find('.artifact-authors a').each((i, authorEl) => {
        authors.push($(authorEl).text().trim());
      });

      articles.push({ title, abstract, authors});
    });

    return articles;
  } catch (error) {
    console.error('Fehler beim Scrapen:', error);
    return null;
  }
}

// Beispiel-Aufruf
(async () => {
  const url = 'https://aisel.aisnet.org/do/search/advanced/?fq=virtual_ancestor_link';
  const data = await scrape(url);
  console.log(JSON.stringify(data, null, 2));
})();
