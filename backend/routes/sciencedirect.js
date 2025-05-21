const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/search', async (req, res) => {
  const query = req.query.q;
  const apiKey = process.env.ELSEVIER_API_KEY;

  if (!query) {
    return res.status(400).json({ error: 'Query-Parameter "q" fehlt.' });
  }

  if (!apiKey) {
    return res.status(500).json({ error: 'ScienceDirect API-Schlüssel fehlt.' });
  }

  const url = 'https://api.elsevier.com/content/search/sciencedirect';

  try {
    const response = await axios.get(url, {
      headers: {
        'X-ELS-APIKey': apiKey,
        'Accept': 'application/json',
      },
      params: {
        query: query,
      },
    });

    const entries = response.data['search-results']?.entry || [];

    const formattedResults = entries.map(entry => {
      const authorsArray = entry.authors?.author
        ? Array.isArray(entry.authors.author)
          ? entry.authors.author.map(a => a.$)
          : [entry.authors.author.$]
        : (entry['dc:creator'] ? [entry['dc:creator']] : []);

      const htmlLink = entry.link?.find(l => l['@ref'] === 'scidir')?.['@href'] || null;

      return {
        title: entry['dc:title'] || null,
        authors: authorsArray,
        abstract: null, // Leider nicht enthalten in Search-API
        publicationDate: entry['prism:coverDate'] || null,
        doi: entry['prism:doi'] || null,
        journal: entry['prism:publicationName'] || null,
        isOpenAccess: entry['openaccess'] === true || entry['openaccess'] === 'true' || entry['openaccess'] === 1,
        pdfLink: null, // Nicht über Search-API verfügbar
        htmlLink: htmlLink,
        subjects: [], // Nicht verfügbar über diese API
        keywords: [], // Nicht enthalten in Search-API
      };
    });

    res.json({
      source: 'ScienceDirect',
      query,
      count: formattedResults.length,
      results: formattedResults,
    });

  } catch (error) {
    console.error('ScienceDirect API Fehler:', error.message);
    res.status(500).json({
      error: 'ScienceDirect API-Aufruf fehlgeschlagen.',
      details: error.response?.data || error.message,
    });
  }
});

module.exports = router;
