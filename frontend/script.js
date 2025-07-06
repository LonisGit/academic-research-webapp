let currentSource = 'all';
let currentQuery = '';
let currentPage = {}; //{ springer: 1, sciencedirect: 1, ais: 0 }

let resultsBySource = {
  sciencedirect: [],
  springer: [],
  ais: []
};



document.querySelectorAll('.tab-selector button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-selector button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSource = btn.getAttribute('data-source');
  });
});

let accumulatedResults = []; // wird bei performSearch befüllt
let currentSort = "relevance"; // Standard: Relevanz (also Originalreihenfolge)
let filterOpenAccess = false; // Filter deaktiviert

document.getElementById("sort-select").addEventListener("change", (e) => {
  const selected = e.target.value;
  currentSort = selected;
  updateResultsView();
});

document.getElementById("openaccess-checkbox").addEventListener("change", (e) => {
  filterOpenAccess = e.target.checked;
  updateResultsView();
});

function updateResultsView() {
  let resultsToDisplay = [...accumulatedResults];

  // Filter anwenden
  if (filterOpenAccess) {
    resultsToDisplay = resultsToDisplay.filter(item => item.isOpenAccess);
  }

  // Sortierung anwenden (wenn nicht "relevance")
  if (currentSort === "year") {
  resultsToDisplay.sort((a, b) => (b.year || 0) - (a.year || 0));
} else if (currentSort === "title") {
  resultsToDisplay.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
} else if (currentSort === "title-desc") {
  resultsToDisplay.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
}


  renderResults(resultsToDisplay);
}

// Beispiel für performSearch (du kannst deine API-Logik hier einfügen)
function performSearch() {
  const query = document.getElementById("search-query").value.trim();
  if (!query) return;

  showLoader(true);

  // Simulierte Suche (hier würdest du deine API-Anfrage stellen)
  setTimeout(() => {
    // Beispielhafte Daten (du ersetzt das mit API-Resultaten)
    accumulatedResults = [
      { title: "A Study on AI", year: 2020, authors: ["Alice", "Bob"], isOpenAccess: true },
      { title: "Zebra Research", year: 2023, authors: ["Zoe"], isOpenAccess: false },
      { title: "Blockchain Trends", year: 2021, authors: ["Dave"], isOpenAccess: true }
    ];

    currentSort = "relevance"; // zurücksetzen
    document.getElementById("sort-select").value = "year"; // „Relevanz“ entspricht Original
    document.getElementById("openaccess-checkbox").checked = false;
    filterOpenAccess = false;

    updateResultsView();
    showLoader(false);
  }, 1000);
}

// Ergebnisse darstellen (du kannst dies beliebig anpassen)
function renderResults(results) {
  const container = document.getElementById("results");
  container.innerHTML = "";

  if (results.length === 0) {
    container.innerHTML = "<p>Keine Ergebnisse gefunden.</p>";
    return;
  }

  results.forEach((r) => {
    const div = document.createElement("div");
    div.className = "result-item";
    div.innerHTML = `
      <h3>${r.title}</h3>
      <p><strong>Jahr:</strong> ${r.year || "unbekannt"}</p>
      <p><strong>Autoren:</strong> ${Array.isArray(r.authors) ? r.authors.join(", ") : r.authors}</p>
      <p><strong>Open Access:</strong> ${r.isOpenAccess ? "✅" : "❌"}</p>
    `;
    container.appendChild(div);
  });
}

// Loader ein-/ausblenden (optional)
function showLoader(show) {
  const loader = document.getElementById("loader");
  loader.classList.toggle("hidden", !show);
}




async function performSearch() {
  const query = document.getElementById('search-query').value.trim();
  if (!query) return;

  currentQuery = query;
  currentPage = {};
  accumulatedResults = [];

  document.getElementById('loader')?.classList.remove('hidden');
  const resultContainer = document.getElementById('results');
  resultContainer.innerHTML = '';

  let sources = ['sciencedirect', 'springer', 'ais'];
  if (currentSource !== 'all') sources = [currentSource];

  for (let source of sources) {
    currentPage[source] = 1;
    await loadNextPage(source);
  }

  document.getElementById('loader')?.classList.add('hidden');
}

async function loadNextPage(source) {
  const page = currentPage[source] || 1;  // Default auf 1, falls undefined
  console.log('Page:', page, 'Source:', source);

  let url = `/api/${source}/search?q=${encodeURIComponent(currentQuery)}&page=${page}`;

  if (source === 'ais') {
    const start = (page - 1) * 25;
    url = `/api/ais/search?q=${encodeURIComponent(currentQuery)}&start=${start}`;
  }

  const res = await fetch(url);
  const data = await res.json();

  if (data.results && data.results.length > 0) {
    const mapped = data.results.map(r => ({ ...r, source }));
    resultsBySource[source].push(...mapped);

    if (currentSource === 'all') {
      mixResults();
      renderResults(accumulatedResults);
    } else {
      if (currentPage[source] === 1) {
        accumulatedResults = [...mapped];
        renderResults(accumulatedResults);
      } else {
        accumulatedResults.push(...mapped);
        renderNewResults(mapped);
      }
    }

    currentPage[source] = page + 1;

  } else {
    console.log(`Keine weiteren Ergebnisse für ${source}`);
  }
}

function mixResults() {
  const maxLength = Math.max(
    resultsBySource.sciencedirect.length,
    resultsBySource.springer.length,
    resultsBySource.ais.length
  );

  accumulatedResults = [];

  for (let i = 0; i < maxLength; i++) {
    if (resultsBySource.sciencedirect[i]) accumulatedResults.push(resultsBySource.sciencedirect[i]);
    if (resultsBySource.springer[i]) accumulatedResults.push(resultsBySource.springer[i]);
    if (resultsBySource.ais[i]) accumulatedResults.push(resultsBySource.ais[i]);
  }

}



// Rendert komplett neu (Liste leeren und alle Ergebnisse zeigen)
function renderResults(results) {
  const container = document.getElementById('results');
  container.innerHTML = ''; // Liste komplett löschen

  if (!results.length) {
    container.innerHTML = '<p>Keine Ergebnisse gefunden.</p>';
    return;
  }

  // Alten "Mehr laden" Button entfernen (falls vorhanden)
  const existingLoadMore = document.getElementById('load-more');
  if (existingLoadMore) existingLoadMore.remove();

  results.forEach((r, index) => {
    const div = createResultCard(r, index);
    container.appendChild(div);
  });

  addLoadMoreButton(container);
  addDetailsEventListeners();
}

// Hängt nur neue Ergebnisse an (Liste nicht löschen)
function renderNewResults(newResults) {
  const container = document.getElementById('results');

  // Alten "Mehr laden" Button entfernen (damit wir ihn hinten neu anhängen)
  const existingLoadMore = document.getElementById('load-more');
  if (existingLoadMore) existingLoadMore.remove();

  newResults.forEach((r, index) => {
    const div = createResultCard(r, accumulatedResults.length - newResults.length + index);
    container.appendChild(div);
  });

  addLoadMoreButton(container);
  addDetailsEventListeners();
}

// Hilfsfunktion zum Erzeugen einer Ergebnis-Karte
function createResultCard(r, index) {
  const authors = Array.isArray(r.authors) ? r.authors.join(', ') : r.authors || 'Unbekannt';
  // Für AIS fallback auf publication und year:
  const journal = r.journal || r.publication || 'Nicht verfügbar';
  const date = r.publicationDate || r.year || 'Unbekannt';
  const access = r.isOpenAccess ? 'Open Access' : (r.source === 'ais' ? 'Nicht geprüft' : 'Kein Open Access');

  const isSD = r.source === 'sciencedirect';
  const abstract = (!isSD && r.abstract)
    ? `<p class="abstract"><em>${r.abstract}</em></p>`
    : (!isSD ? '<p class="abstract"><em>Kein Abstract verfügbar</em></p>' : '');
  const keywords = (!isSD && r.keywords?.length)
    ? `<p><strong>Schlagwörter:</strong> ${r.keywords.join(', ')}</p>`
    : '';
  const pdf = r.pdfLink
    ? `<p><a href="${r.pdfLink}" target="_blank">📄 PDF herunterladen</a></p>`
    : '';
  const websiteLink = r.htmlLink
    ? `<p><a href="${r.htmlLink}" target="_blank">🌐 Zur Website</a></p>`
    : (r.doi ? `<p><a href="https://doi.org/${r.doi}" target="_blank">🌐 DOI-Link öffnen</a></p>` : '');

  const sourceClass = `card-${r.source || 'default'}`;

  const div = document.createElement('div');
  div.className = `result-card ${sourceClass}`;
  div.innerHTML = `
    <h3>${r.title || 'Kein Titel'}</h3>
    <div class="abstract-section" data-index="${index}">
      ${abstract}
      ${pdf}
      ${websiteLink}
    </div>
    <p><strong>Autoren:</strong> ${authors}</p>
    <p><strong>Journal:</strong> ${journal}</p>
    <p><strong>Veröffentlichung:</strong> ${date}</p>
    <p><strong>Zugang:</strong> ${access}</p>
    ${keywords}
    ${r.source === 'ais' && r.detailLink ? `<button class="details-btn" data-link="${r.detailLink}" data-index="${index}">Details laden</button>` : ''}
  `;

  return div;
}


// Fügt den "Mehr laden" Button ans Ende
function addLoadMoreButton(container) {
  const loadMore = document.createElement('button');
  loadMore.id = 'load-more';
  loadMore.textContent = 'Mehr laden';
  loadMore.className = 'load-more-btn';
  loadMore.addEventListener('click', () => {
    let sources = ['sciencedirect', 'springer', 'ais'];
    if (currentSource !== 'all') sources = [currentSource];
    sources.forEach(src => loadNextPage(src));
  });
  container.appendChild(loadMore);
}

// Event Listener für Details-Buttons (damit auch bei neu angehängten Ergebnissen funktioniert)
function addDetailsEventListeners() {
  document.querySelectorAll('.details-btn').forEach(btn => {
    btn.removeEventListener('click', detailsBtnHandler); // Entferne alten Listener, falls vorhanden
    btn.addEventListener('click', detailsBtnHandler);
  });
}

async function detailsBtnHandler(event) {
  const btn = event.currentTarget;
  const detailLink = btn.getAttribute('data-link');
  const index = parseInt(btn.getAttribute('data-index'));
  const card = btn.closest('.result-card');

  btn.textContent = 'Lade Details...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/ais/details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ detailLink })
    });

    const data = await res.json();
    console.log('Details geladen:', data);

    accumulatedResults[index].abstract = data.abstract;
    accumulatedResults[index].pdfLink = data.pdfLink;

    const abstractSection = card.querySelector('.abstract-section');
    abstractSection.innerHTML = `
      <p class="abstract"><em>${data.abstract || 'Kein Abstract verfügbar'}</em></p>
      ${data.pdfLink ? `<p><a href="${data.pdfLink}" target="_blank">📄 PDF herunterladen</a></p>` : ''}
    `;

  } catch (err) {
    console.error('Fehler beim Laden der Details:', err);
    btn.textContent = 'Fehler';
  }
}

document.getElementById('export-csv').addEventListener('click', () => {
  if (accumulatedResults.length === 0) {
    alert('Keine Ergebnisse zum Exportieren!');
    return;
  }

  // CSV Header (Spaltennamen)
  const headers = ['Titel', 'Autoren', 'Journal', 'Veröffentlichung', 'Zugang', 'Quelle', 'Link'];

  // CSV-Daten aufbereiten
  const rows = accumulatedResults.map(r => {
    // Autoren als String
    const authors = Array.isArray(r.authors) ? r.authors.join(', ') : (r.authors || '');

    // Journal/Publication
    const journal = r.journal || r.publication || '';

    // Datum
    const date = r.publicationDate || r.year || '';

    // Zugang (Open Access / etc)
    const access = r.isOpenAccess ? 'Open Access' : (r.source === 'ais' ? 'Nicht geprüft' : 'Kein Open Access');

    // Link (Website oder DOI)
    let link = '';
    if (r.htmlLink) link = r.htmlLink;
    else if (r.doi) link = `https://doi.org/${r.doi}`;

    // CSV-Zeile als Array, Felder werden später korrekt escaped
    return [r.title || '', authors, journal, date, access, r.source || '', link];
  });

  // Funktion um CSV-Zeilen zu erzeugen mit richtigem Escape für Kommas, Anführungszeichen etc.
  function toCSVLine(arr) {
    return arr.map(field => {
      if (field == null) return '';
      const str = field.toString();
      if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        // Anführungszeichen im Feld mit doppelten Anführungszeichen escapen und Feld in ""
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',');
  }

  // CSV-String zusammensetzen
  const csvContent = [headers, ...rows].map(toCSVLine).join('\n');

  // CSV als Blob erzeugen
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  // Download-Link erzeugen
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `search_results_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

