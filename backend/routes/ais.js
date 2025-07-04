const express = require('express');
const router = express.Router();
const scrapeAIS = require('../scraper/scrape');
const scrapeAISDetails = require('../scraper/scrapeAISDetails');

// GET /api/ais/search?q=virtual+reality&page=2
router.get('/search', async (req, res) => {
  const query = req.query.q;
  const page = parseInt(req.query.page) || 1;

  if (!query) return res.status(400).json({ error: 'Query fehlt.' });

  try {
    const results = await scrapeAIS(query, page); // ← einfach Seite übergeben
    res.json({ source: 'AIS', query, page, count: results.length, results });
  } catch (err) {
    res.status(500).json({ error: 'Scraping fehlgeschlagen', details: err.message });
  }
});

// POST /api/ais/details
router.post('/details', async (req, res) => {
  const { detailLink } = req.body;

  if (!detailLink) {
    return res.status(400).json({ error: 'detailLink fehlt in der Anfrage.' });
  }

  try {
    const data = await scrapeAISDetails(detailLink);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Detail-Scraping fehlgeschlagen', details: err.message });
  }
});

module.exports = router;
