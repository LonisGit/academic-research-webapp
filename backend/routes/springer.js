const express = require('express');
const axios = require('axios');
const router = express.Router();

// GET /api/springer/search?q=ai
router.get('/search', async (req, res) => {
  const query = req.query.q;
  const page = parseInt(req.query.page) || 1;
  const pageSize = 25; // max für Basic
  const start = (page - 1) * pageSize + 1;
  
  if (!query) return res.status(400).json({ error: 'Query fehlt' });

  try {
    const response = await axios.get('https://api.springernature.com/meta/v2/json', {
      params: {
        q: query,
        api_key: process.env.SPRINGER_META_KEY,
        s: start,
        p: pageSize
      }
    });

    //mapping der results
    const results = (response.data.records || []).map(item => ({
      title: item.title,
      authors: item.creators?.map(c => c.creator) || [],
      journal: item.publicationName || '',
      publicationDate: item.onlineDate || '',
      abstract: item.abstract || '',
      doi: item.doi || '',
      pdfLink: item.url?.find(u => u.format === 'pdf')?.value || '',
      htmlLink: item.url?.find(u => u.format === 'html')?.value || '',
      isOpenAccess: item.openaccess === 'true'
    }));

    res.json({
      query,
      page,
      pageSize,
      total: parseInt(response.data.result?.[0]?.total || 0),
      results
    });

  } catch (err) {
    res.status(500).json({ error: 'Fehler bei Springer-Abfrage', details: err.message });
  }
});

module.exports = router;
