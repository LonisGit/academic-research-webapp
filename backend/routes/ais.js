const express = require('express');
const router = express.Router();
const scrapeAIS = require('../scraper/scrape');

// GET /api/ais/search?q=virtual+reality
router.get('/search', async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: 'Query fehlt.' });
  }

  try {
    const results = await scrapeAIS(query);
    res.json({
      source: 'AIS',
      query,
      count: results.length,
      results,
    });
  } catch (err) {
    res.status(500).json({ error: 'Scraping fehlgeschlagen', details: err.message });
  }
});

module.exports = router;
