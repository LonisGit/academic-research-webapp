const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger/swagger');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

//Swagger comments for docs
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
 *         description: Der Suchbegriff
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort mit Suchergebnis
 */
app.get('/api/sciencedirect/search', (req, res) => {
    res.json({ source: 'ScienceDirect', query: req.query.query });
  });


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
app.get('/api/springer/search', (req, res) => {
    res.json({ source: 'SpringerLink', query: req.query.query });
  });
  
/**
 * @swagger
 * /api/ais/search:
 *   get:
 *     summary: Suche in ais Link
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

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
