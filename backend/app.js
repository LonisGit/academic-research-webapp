const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger/swagger');
const sciencedirectRoutes = require('./routes/sciencedirect'); // sciencedirect.js einbinden

// Umgebungsvariablen laden
require('dotenv').config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ScienceDirect-Route durch sciencedirect.js ersetzen

/**
 * @swagger
 * /api/sciencedirect/search:
 *   get:
 *     summary: Suche in ScienceDirect
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Der Suchbegriff für ScienceDirect
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort mit Suchergebnissen
 */
app.use('/api/sciencedirect', sciencedirectRoutes);


/**
 * @swagger
 * /api/springer/search:
 *   get:
 *     summary: Suche in Springer Link
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Der Suchbegriff
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort mit Suchergebnis
 */
const springerRoutes = require('./routes/springer');
app.use('/api/springer', springerRoutes);
/**
 * @swagger
 * /api/ais/search:
 *   get:
 *     summary: Suche in AIS eLibrary
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Der Suchbegriff
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort mit Suchergebnis
 */
app.get('/api/ais/search', (req, res) => {
  res.json({ source: 'AIS eLibrary', query: req.query.query });
});

// Swagger-Dokumentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});