const express = require('express');
const scrape = require('../scraper/scrape');
const router = express.Router();

// Beispiel: http://localhost:5000/api/ais?url=https://aisel.aisnet.org/do/search/advanced/?fq=virtual_ancestor_link
router.get('/', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL-Parameter fehlt.' });
  }

  try {
    const results = await scrape(url);
    res.json({ count: results.length, results });
  } catch (error) {
    res.status(500).json({ error: 'Scraping fehlgeschlagen', details: error.message });
  }
});

module.exports = router;
