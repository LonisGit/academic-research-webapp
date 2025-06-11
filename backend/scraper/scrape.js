const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeAIS(query) {
  const url = `https://aisel.aisnet.org/do/search/?q=${encodeURIComponent(query)}&start=0&context=default`;

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Referer': 'https://aisel.aisnet.org/',
    };

    const { data } = await axios.get(url, { headers });
    const $ = cheerio.load(data);

    const articles = [];

    $('.artifact-description').each((i, el) => {
      const title = $(el).find('h3 a').text().trim();
      const abstract = $(el).find('.artifact-abstract p').text().trim();
      const authors = [];

      $(el).find('.artifact-authors a').each((_, a) => {
        authors.push($(a).text().trim());
      });

      articles.push({ title, abstract, authors });
    });

    return articles;
  } catch (error) {
    console.error('Fehler beim Scrapen:', error.message);
    throw error;
  }
}

module.exports = scrapeAIS;