# academic-research-webapp
Projektseminar WI 2025: academic-research-webapp.

## Voraussetzungen

- Node.js (v18+ empfohlen)
- npm (Node Package Manager)
- Internetzugang
- VPN-Zugang zur Universität (für lizenzierte Datenbanken)

## Projektstruktur

```text
/backend         → Express.js Backend mit API-Anbindung und Scraping
/frontend        → HTML/CSS/JS Frontend
/routes          → Einzelrouten pro Datenbank (Springer, ScienceDirect, AISel)
/scraper         → Puppeteer-basierter Scraper für AISel
```
## Installation & Start

1. Terminal öffnen und ins Backend wechseln:
   ```bash
   cd backend
   npm install
   ```

2. Backend starten:
   ```bash
   node app.js

3. Frontend öffnen:

   `frontend/index.html` im Browser öffnen oder `http://localhost:5000` im Browser öffnen..

