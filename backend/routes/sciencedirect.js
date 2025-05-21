const express = require('express'); // Node.js Bib; für Webserver & API
const axios = require('axios'); // GET-Anfragen
const router = express.Router(); // Router Objekt erzeugen



router.get('/search', async (req, res) => {
  //  ?q=...
  const query = req.query.q;

  const apiKey = process.env.ELSEVIER_API_KEY;

  //console.log('Suchbegriff:', query);
  //console.log('API-Schlüssel:', apiKey ? 'Vorhanden' : 'Fehlt');

  // Kein Suchbegriff eingegeben
  if (!query) {
    return res.status(400).json({ error: 'Query-Parameter "q" fehlt. Bitte gib einen Suchbegriff an.' });
  }

  // Kein API-Key gesetzt
  if (!apiKey) {
    return res.status(500).json({ error: 'ScienceDirect API-Schlüssel fehlt.' });
  }

  // ScienceDirect API-Endpunkt für Suchanfragen
  const url = 'https://api.elsevier.com/content/search/sciencedirect';

  try {
    // GET-Anfrage an die ScienceDirect API
    const response = await axios.get(url, {
      headers: {
        'X-ELS-APIKey': apiKey,         // API-Key zur Authentifizierung
        'Accept': 'application/json',   // Antwort in JSON
      },
      params: {
        query: encodeURIComponent(query),  // URL-kodierter Suchbegriff
      },
    });


    // Extrahiere die Ergebnisliste aus der API-Antwort
    const entries = response.data['search-results']?.entry || [];

    // Keine Einträge vorhanden
    if (!entries.length) {
      return res.status(200).json({ message: 'Keine Treffer gefunden.', results: [] });
    }

    // Rückgabe der Ergebnisse
    res.json({ count: entries.length, results: entries });

  } catch (error) {
    console.error('ScienceDirect API Fehler:', error.message);

    // Wenn die API eine spezifische Fehlermeldung mitliefert
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Antwortdaten:', error.response.data);
    }

    // Sende eine Fehlermeldung an den Client zurück
    res.status(500).json({
      error: 'ScienceDirect API-Aufruf fehlgeschlagen.',
      details: error.response?.data || error.message,
    });
  }
});

// Router in  server.js einbinden
module.exports = router;
