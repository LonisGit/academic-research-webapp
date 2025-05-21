const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/search', async (req, res) => {
  const query = req.query.q;
  const includeDetails = req.query.details === 'true'; // ?details=true
  const apiKey = process.env.ELSEVIER_API_KEY;

  if (!query) {
    return res.status(400).json({ error: 'Query-Parameter "q" fehlt.' });
  }

  if (!apiKey) {
    return res.status(500).json({ error: 'ScienceDirect API-Schlüssel fehlt.' });
  }

  const searchUrl = 'https://api.elsevier.com/content/search/sciencedirect';

  try {
    const searchResponse = await axios.get(searchUrl, {
      headers: {
        'X-ELS-APIKey': apiKey,
        'Accept': 'application/json',
      },
      params: {
        query: query,
      },
    });

    const entries = searchResponse.data['search-results']?.entry || [];

    const formattedResults = await Promise.all(entries.map(async (entry) => {
      const authorsArray = entry.authors?.author
        ? Array.isArray(entry.authors.author)
          ? entry.authors.author.map(a => a.$)
          : [entry.authors.author.$]
        : (entry['dc:creator'] ? [entry['dc:creator']] : []);

      const htmlLink = entry.link?.find(l => l['@ref'] === 'scidir')?.['@href'] || null;

      let abstract = null;
      let keywords = [];
      let pdfLink = null;

      if (includeDetails) {
        try {
          const identifier = entry.pii || (entry['dc:identifier']?.replace(/^DOI:/, '') ?? null);
          if (identifier) {
            const detailUrl = `https://api.elsevier.com/content/article/${entry.pii ? 'pii' : 'doi'}/${identifier}`;
            const detailResponse = await axios.get(detailUrl, {
              headers: {
                'X-ELS-APIKey': apiKey,
                'Accept': 'application/json',
              },
            });

            const fullArticle = detailResponse.data['full-text-retrieval-response'];

            abstract = fullArticle?.coredata?.dc_description || null;
            pdfLink = fullArticle?.coredata?.link?.find(l => l['@ref'] === 'scidir')?.['@href'] || null;

            const keywordList = fullArticle?.coredata?.dcterms_subject;
            if (keywordList) {
              keywords = Array.isArray(keywordList)
                ? keywordList.map(k => k['$'])
                : [keywordList['$']];
            }
          }
        } catch (err) {
          console.warn('Details konnten nicht geladen werden für:', entry['dc:title']);
        }
      }

      return {
        title: entry['dc:title'] || null,
        authors: authorsArray,
        abstract: abstract,
        publicationDate: entry['prism:coverDate'] || null,
        doi: entry['prism:doi'] || null,
        journal: entry['prism:publicationName'] || null,
        isOpenAccess: entry['openaccess'] === true || entry['openaccess'] === 'true' || entry['openaccess'] === 1,
        pdfLink: pdfLink,
        htmlLink: htmlLink,
        subjects: [], // Nicht direkt verfügbar
        keywords: keywords
      };
    }));

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
