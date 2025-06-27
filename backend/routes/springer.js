const express = require('express');
const axios = require('axios');
const router = express.Router();

//For testing: http://localhost:5000/api/springer/search?q=virtual+reality
router.get('/search', async (req, res) => {
  const query = req.query.q;
  const page = parseInt(req.query.page) || 1;
  const pageSize = 20;
  const startIndex = (page - 1) * pageSize;

  if (!query) return res.status(400).json({ error: 'Query fehlt' });

  try {
    const response = await axios.get('https://api.springernature.com/meta/v2/json', {
      params: {
        q: query,
        api_key: process.env.SPRINGER_API_KEY,
        p: page,
        pageSize
      }
    });

    const results = (response.data.records || []).map(item => ({
      title: item.title,
      authors: item.creators?.map(c => c.creator) || [],
      journal: item.publicationName || '',
      publicationDate: item.publicationDate || '',
      abstract: item.abstract || '',
      doi: item.doi || '',
      pdfLink: item.url?.find(u => u.format === 'pdf')?.value || '',
      htmlLink: item.url?.find(u => u.format === 'html')?.value || '',
      isOpenAccess: item.openaccess === 'true'
    }));

    res.json({
      query,
      page,
      total: parseInt(response.data.result[0]?.total || 0),
      results
    });

  } catch (err) {
    res.status(500).json({ error: 'Fehler bei Springer-Abfrage', details: err.message });
  }
});

module.exports = router;