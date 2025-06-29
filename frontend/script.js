let currentSource = 'all';
let currentQuery = '';
let currentPage = {}; //{ springer: 1, sciencedirect: 1, ais: 0 }
let accumulatedResults = [];

document.querySelectorAll('.tab-selector button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-selector button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSource = btn.getAttribute('data-source');
  });
});

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
  let page = currentPage[source] || 1;
  let url = '';

  if (source === 'ais') {
    const start = (page - 1) * 25; // AIS verwendet Offset
    url = `/api/ais/search?q=${encodeURIComponent(currentQuery)}&start=${start}`;
  } else {
    url = `/api/${source}/search?q=${encodeURIComponent(currentQuery)}&page=${page}`;
  }

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      const mapped = data.results.map(r => ({
        ...r,
        source
      }));

      if (page === 1) {
        accumulatedResults = [...mapped];
        renderResults(accumulatedResults);
      } else {
        accumulatedResults.push(...mapped);
        renderNewResults(mapped);
      }

      currentPage[source] = page + 1;

    } else {
      console.log(`Keine weiteren Ergebnisse für ${source}`);
    }

  } catch (err) {
    console.error(`Fehler beim Laden von Seite ${page} für ${source}:`, err);
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
