const express = require('express');
const axios = require('axios');
const router = express.Router();

// Route: /api/springer/search?q=deinSuchbegriff
router.get('/search', async (req, res) => {
  const query = req.query.q;
  const apiKey = process.env.SPRINGER_API_KEY;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  const url = `https://api.springernature.com/meta/v2/json?q=${encodeURIComponent(query)}&api_key=${apiKey}`;

  try {
    const response = await axios.get(url);
    const articles = response.data.records;
    res.json(articles);
  } catch (error) {
    console.error('Springer API Fehler:', error.message);
    res.status(500).json({ error: 'Springer API call failed' });
  }
});

module.exports = router;
