const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger/swagger');
const sciencedirectRoutes = require('./routes/sciencedirect');
const springerRoutes = require('./routes/springer');

require('dotenv').config(); // Umgebungsvariablen laden

const app = express();
const PORT = 5000;

// Frontend statisch bereitstellen
app.use(express.static(path.join(__dirname, '../frontend')));

// Middleware
app.use(cors());
app.use(express.json());

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

// Server starten
app.listen(PORT, () => {
  console.log(`✅ Server läuft auf http://localhost:${PORT}`);
  console.log(`📚 Swagger UI: http://localhost:${PORT}/api-docs`);
});
