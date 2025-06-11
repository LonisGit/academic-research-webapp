const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeAIS(query) {
  const url = `https://aisel.aisnet.org/do/search/?q=${encodeURIComponent(query)}&start=0&context=default`;

  try {
    const { data } = await axios.get(url);
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
    console.error('Fehler beim Scrapen:', error);
    throw error;
  }
}

module.exports = scrapeAIS;
