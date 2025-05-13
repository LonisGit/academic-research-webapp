const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger/swagger');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get('/api/sciencedirect/search', (req, res) => {
  res.json({ source: 'ScienceDirect', query: req.query.query });
});

app.get('/api/springer/search', (req, res) => {
  res.json({ source: 'Springer', query: req.query.query });
});

app.get('/api/ais/search', (req, res) => {
  res.json({ source: 'AIS eLibrary', query: req.query.query });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
