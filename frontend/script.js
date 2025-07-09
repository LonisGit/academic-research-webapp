let currentSource = 'all';
let currentQuery = '';
let currentPage = {};
let accumulatedResults = [];
let currentSort = "relevance";
let filterOpenAccess = false;

let resultsBySource = {
  sciencedirect: [],
  springer: [],
  ais: []
};

// Event-Handler: Tabs
document.querySelectorAll('.tab-selector button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-selector button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSource = btn.getAttribute('data-source');
  });
});

// Event-Handler: Sortierung
document.getElementById("sort-select").addEventListener("change", (e) => {
  currentSort = e.target.value;
  updateResultsView();
});

// Event-Handler: Open Access Filter
document.getElementById("openaccess-checkbox").addEventListener("change", (e) => {
  filterOpenAccess = e.target.checked;
  updateResultsView();
});

// Hauptsuche
async function performSearch() {
  const query = document.getElementById('search-query').value.trim();
  if (!query) return;

  currentQuery = query;
  currentPage = {};
  accumulatedResults = [];
  resultsBySource = { sciencedirect: [], springer: [], ais: [] };

  document.getElementById('loader')?.classList.remove('hidden');
  document.getElementById('results').innerHTML = '';

  let sources = (currentSource === 'all') ? ['sciencedirect', 'springer', 'ais'] : [currentSource];

  for (let source of sources) {
    currentPage[source] = 1;
    await loadNextPage(source);
  }

  document.getElementById('loader')?.classList.add('hidden');
}

// API: Ergebnisse laden
async function loadNextPage(source) {
  let page = currentPage[source] || 1;
  let url = `/api/${source}/search?q=${encodeURIComponent(currentQuery)}&page=${page}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      const mapped = data.results.map(r => ({ ...r, source }));
      resultsBySource[source].push(...mapped);
      const startIndex = accumulatedResults.length;
      accumulatedResults.push(...mapped);

      if (currentSource === 'all') {
        mixResults();
        renderResults(accumulatedResults);
      } else {
        (page === 1) ? renderResults(accumulatedResults) : renderNewResults(mapped, startIndex);
      }

      currentPage[source] = page + 1;
    }

  } catch (err) {
    console.error(`Fehler beim Laden von ${source}, Seite ${page}:`, err);
  }
}

// Ergebnisse mischen (für "alle" Quellen)
function mixResults() {
  const max = Math.max(
    resultsBySource.sciencedirect.length,
    resultsBySource.springer.length,
    resultsBySource.ais.length
  );
  accumulatedResults = [];
  for (let i = 0; i < max; i++) {
    if (resultsBySource.sciencedirect[i]) accumulatedResults.push(resultsBySource.sciencedirect[i]);
    if (resultsBySource.springer[i]) accumulatedResults.push(resultsBySource.springer[i]);
    if (resultsBySource.ais[i]) accumulatedResults.push(resultsBySource.ais[i]);
  }
}

function parseDate(dateString) {
  if (!dateString) return new Date("0000-01-01"); // ganz am Ende

  // Format: YYYY-MM-DD → direkt nutzbar
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return new Date(dateString);
  }

  // Format: MM/YYYY → umwandeln zu YYYY-MM-01
  if (/^\d{2}\/\d{4}$/.test(dateString)) {
    const [month, year] = dateString.split("/");
    return new Date(`${year}-${month}-01`);
  }

  // Fallback
  return new Date("0000-01-01");
}


// Ergebnisse sortieren und filtern
function updateResultsView() {
  let resultsToDisplay = [...accumulatedResults];

  if (filterOpenAccess) {
    resultsToDisplay = resultsToDisplay.filter(item => item.isOpenAccess);
  }

  switch (currentSort) {
    case "year-desc":
      resultsToDisplay.sort((a, b) => {
        const da = parseDate(a.publicationDate);
        const db = parseDate(b.publicationDate);
        return db - da; // neu → alt
      })
      break;

    case "year-asc":
      resultsToDisplay.sort((a, b) => {
        const da = parseDate(a.publicationDate);
        const db = parseDate(b.publicationDate);
        return da - db; // alt → neu
      });
      break; F
    case "title-asc":
      resultsToDisplay.sort((a, b) =>
        (a.title || "").localeCompare(b.title || "")
      );
      break;
    case "title-desc":
      resultsToDisplay.sort((a, b) =>
        (b.title || "").localeCompare(a.title || "")
      );
      break;
    case "relevance":
    default:
      // Belass in Originalreihenfolge
      break;
  }

  renderResults(resultsToDisplay);
}

// Ergebnisse rendern
function renderResults(results) {
  const container = document.getElementById('results');
  container.innerHTML = results.length === 0 ? '<p>Keine Ergebnisse gefunden.</p>' : '';
  if (results.length === 0) return;

  document.getElementById('load-more')?.remove();

  results.forEach((r, index) => {
    const div = createResultCard(r, index);
    container.appendChild(div);
  });

  addLoadMoreButton(container);
  addDetailsEventListeners();
}

// Neue Ergebnisse anhängen
function renderNewResults(newResults, startIndex) {
  const container = document.getElementById('results');
  document.getElementById('load-more')?.remove();

  newResults.forEach((r, i) => {
    const div = createResultCard(r, startIndex + i);
    container.appendChild(div);
  });

  addLoadMoreButton(container);
  addDetailsEventListeners();
}

// Einzelne Karte erstellen
function createResultCard(r, index) {
  const authors = Array.isArray(r.authors) ? r.authors.join(', ') : r.authors || 'Unbekannt';
  const journal = r.journal || r.publication || 'Nicht verfügbar';
  const date = r.publicationDate || r.year || 'Unbekannt';
  const access = r.isOpenAccess ? 'Open Access' : (r.source === 'ais' ? 'Nicht geprüft' : 'Kein Open Access');

  const isSD = r.source === 'sciencedirect';
  const abstract = (!isSD && r.abstract) ? `<p class="abstract"><em>${r.abstract}</em></p>` :
    (!isSD ? '<p class="abstract"><em>Kein Abstract verfügbar</em></p>' : '');
  const keywords = (!isSD && r.keywords?.length) ? `<p><strong>Schlagwörter:</strong> ${r.keywords.join(', ')}</p>` : '';
  const pdf = r.pdfLink ? `<p><a href="${r.pdfLink}" target="_blank">📄 PDF herunterladen</a></p>` : '';
  const websiteLink = r.htmlLink ? `<p><a href="${r.htmlLink}" target="_blank">🌐 Zur Website</a></p>` :
    (r.doi ? `<p><a href="https://doi.org/${r.doi}" target="_blank">🌐 DOI-Link öffnen</a></p>` : '');

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

// Load More Button
function addLoadMoreButton(container) {
  const loadMore = document.createElement('button');
  loadMore.id = 'load-more';
  loadMore.textContent = 'Mehr laden';
  loadMore.className = 'load-more-btn';
  loadMore.addEventListener('click', () => {
    const sources = (currentSource === 'all') ? ['sciencedirect', 'springer', 'ais'] : [currentSource];
    sources.forEach(src => loadNextPage(src));
  });
  container.appendChild(loadMore);
}

// Detail-Buttons aktivieren
function addDetailsEventListeners() {
  document.querySelectorAll('.details-btn').forEach(btn => {
    btn.removeEventListener('click', detailsBtnHandler); // doppelt verhindern
    btn.addEventListener('click', detailsBtnHandler);
  });
}

// Detail-Nachladen (AIS)
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

// Exportieren als CSV
document.getElementById('export-csv').addEventListener('click', () => {
  if (accumulatedResults.length === 0) return alert('Keine Ergebnisse zum Exportieren!');

  const headers = ['Titel', 'Autoren', 'Journal', 'Veröffentlichung', 'Zugang', 'Quelle', 'Link'];
  const rows = accumulatedResults.map(r => {
    const authors = Array.isArray(r.authors) ? r.authors.join(', ') : (r.authors || '');
    const journal = r.journal || r.publication || '';
    const date = r.publicationDate || r.year || '';
    const access = r.isOpenAccess ? 'Open Access' : (r.source === 'ais' ? 'Nicht geprüft' : 'Kein Open Access');
    let link = r.htmlLink || (r.doi ? `https://doi.org/${r.doi}` : '');

    return [r.title || '', authors, journal, date, access, r.source || '', link];
  });

  const toCSVLine = arr => arr.map(f => {
    if (!f) return '';
    const s = f.toString();
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',');

  const csvContent = [headers, ...rows].map(toCSVLine).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `search_results_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});
