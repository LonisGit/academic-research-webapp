const express = require('express');
const router = express.Router();
const scrapeAIS = require('../scraper/scrape');

//Beispiel: http://localhost:5000/api/ais/search?q=virtual+reality
router.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Query fehlt.' });

  try {
    const articles = await scrapeAIS(query);
    res.json({ source: 'AIS', query, count: articles.length, results: articles});
  } catch (err) {
    res.status(500).json({ error: 'Scraping fehlgeschlagen', details: err.message });
  }
});

module.exports = router;
