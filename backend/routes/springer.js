const express = require('express');
const axios = require('axios');
const router = express.Router();

// Route: /api/springer/search?q=deinSuchbegriff
router.get('/search', async (req, res) => {
  const query = req.query.q;
  const apiKey = process.env.SPRINGER_META_KEY;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  const url = `https://api.springernature.com/meta/v2/json?q=${encodeURIComponent(query)}&api_key=${apiKey}`;

  try {
    const response = await axios.get(url);
    
    const articles = response.data.records.map((record) => {
      const pdfLink = record.url?.find(u => u.format === 'pdf')?.value || null;
      const htmlLink = record.url?.find(u => u.format === 'html')?.value || null;

      return {
        title: record.title,
        authors: record.creators?.map(c => c.creator),
        abstract: record.abstract,
        publicationDate: record.publicationDate,
        doi: record.doi,
        journal: record.publicationName,
        isOpenAccess: record.openaccess === 'true',
        pdfLink,
        htmlLink,
        subjects: record.subjects,
        keywords: record.keyword,
      };
    });

    res.json(articles);

  } catch (error) {
    console.error('Springer API Fehler:', error.message);

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Daten:', error.response.data);
    }

    res.status(500).json({ error: 'Springer API call failed' });
  }

});

module.exports = router;
