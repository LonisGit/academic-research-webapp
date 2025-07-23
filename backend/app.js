const express = require('express');
const cors = require('cors');
const path = require('path');
const sciencedirectRoutes = require('./routes/sciencedirect');
const springerRoutes = require('./routes/springer');
const scraperRoute = require('./routes/ais');


//Keys laden
require('dotenv').config(); 

const app = express();
const PORT = 5000;

// Frontend statisch bereitstellen
app.use(express.static(path.join(__dirname, '../frontend')));

// Middleware
app.use(cors());
app.use(express.json());

//sciencedirect
app.use('/api/sciencedirect', sciencedirectRoutes);

//springer
app.use('/api/springer', springerRoutes);

//ais
app.use('/api/ais', scraperRoute);


// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
  console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
  console.log(`Test-Suche Springer: http://localhost:${PORT}/api/springer/search?q=virtual+reality`);
  console.log(`Test-Suche ScienceDirect: http://localhost:${PORT}/api/sciencedirect/search?q=virtual+reality`);
  console.log(`Test-Suche AIS: http://localhost:${PORT}/api/ais/search?q=virtual+reality`);
});
