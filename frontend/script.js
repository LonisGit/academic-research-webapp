
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
  const page = currentPage[source];
  const res = await fetch(`/api/${source}/search?q=${encodeURIComponent(currentQuery)}&page=${page}`);
  const data = await res.json();

  if (data.results) {
    const mapped = data.results.map(r => ({
      ...r,
      source
    }));
    accumulatedResults.push(...mapped);
    currentPage[source]++;
    renderResults(accumulatedResults);
  }
}


function renderResults(results) {
  const container = document.getElementById('results');

  // Nur beim ersten Render leeren
  if (container.innerHTML === '') {
    container.innerHTML = '';
  }

  if (!results.length) {
    container.innerHTML = '<p>Keine Ergebnisse gefunden.</p>';
    return;
  }

  // Entferne alten Button, um doppelte Buttons zu vermeiden
  const existingLoadMore = document.getElementById('load-more');
  if (existingLoadMore) existingLoadMore.remove();

  results.forEach((r, index) => {
    const authors = Array.isArray(r.authors) ? r.authors.join(', ') : r.authors || 'Unbekannt';
    const journal = r.journal || 'Nicht verfügbar';
    const date = r.publicationDate || 'Unbekannt';
    const access = r.isOpenAccess ? 'Open Access' : 'Kein Open Access';

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

    container.appendChild(div);
  });


  if (results.length) {
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

  // Event Listener für Detail-Buttons
  document.querySelectorAll('.details-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
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

        results[index].abstract = data.abstract;
        results[index].pdfLink = data.pdfLink;

        const abstractSection = card.querySelector('.abstract-section');
        abstractSection.innerHTML = `
      <p class="abstract"><em>${data.abstract || 'Kein Abstract verfügbar'}</em></p>
      ${data.pdfLink ? `<p><a href="${data.pdfLink}" target="_blank">📄 PDF herunterladen</a></p>` : ''}
    `;

      } catch (err) {
        console.error('Fehler beim Laden der Details:', err);
        btn.textContent = 'Fehler';
      }
    });

  });


}


