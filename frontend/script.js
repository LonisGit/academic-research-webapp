let currentSource = 'all';

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

  const resultContainer = document.getElementById('results');
  resultContainer.innerHTML = '<p>Suche läuft...</p>';

  let sources = ['sciencedirect', 'springer', 'ais'];
  if (currentSource !== 'all') sources = [currentSource];

  const allResults = [];

  for (let source of sources) {
    try {
      const res = await fetch(`/api/${source}/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (data.results) {
        const mapped = data.results.map(r => {
          if (source === 'ais') {
            return {
              title: r.title || 'Kein Titel',
              authors: r.authors || 'Unbekannt',
              journal: r.publication || 'Nicht verfügbar',
              publicationDate: r.year || 'Unbekannt',
              abstract: 'Kein Abstract verfügbar',
              doi: null,
              pdfLink: null,
              htmlLink: null,
              keywords: [],
              isOpenAccess: true,
              detailLink: r.detailLink || null,
              source: 'ais'
            };
          } else {
            return { ...r, source };
          }
        });
        allResults.push(...mapped);
      }

    } catch (err) {
      console.error(`Fehler bei ${source}:`, err);
    }
  }

  renderResults(allResults);
}

function renderResults(results) {
  const container = document.getElementById('results');
  container.innerHTML = '';

  if (!results.length) {
    container.innerHTML = '<p>Keine Ergebnisse gefunden.</p>';
    return;
  }

  results.forEach((r, index) => {
    const authors = Array.isArray(r.authors) ? r.authors.join(', ') : r.authors || 'Unbekannt';
    const keywords = r.keywords?.join(', ') || 'Keine';
    const journal = r.journal || 'Nicht verfügbar';
    const date = r.publicationDate || 'Unbekannt';
    const access = r.isOpenAccess ? 'Open Access' : 'Kein Open Access';
    const doi = r.doi ? `<a href="https://doi.org/${r.doi}" target="_blank">DOI</a>` : 'DOI nicht verfügbar';
    const abstract = r.abstract ? `<p class="abstract"><em>${r.abstract}</em></p>` : '<p><em>Kein Abstract verfügbar</em></p>';
    const pdf = (r.isOpenAccess && r.pdfLink) ? `<a href="${r.pdfLink}" target="_blank">PDF</a>` : '';
    const html = r.htmlLink ? `<a href="${r.htmlLink}" target="_blank">HTML</a>` : '';

    const div = document.createElement('div');
    div.className = 'result-card';
    div.innerHTML = `
      <h3>${r.title || 'Kein Titel'}</h3>
      <div class="abstract-section" data-index="${index}">
        ${abstract}
      </div>
      <p><strong>Autoren:</strong> ${authors}</p>
      <p><strong>Journal:</strong> ${journal}</p>
      <p><strong>Veröffentlichung:</strong> ${date}</p>
      <p><strong>Schlagwörter:</strong> ${keywords}</p>
      <p><strong>Zugang:</strong> ${access}</p>
      <p><strong>DOI:</strong> ${doi}</p>
      <p>${pdf} ${html}</p>
      ${r.source === 'ais' && r.detailLink ? `<button class="details-btn" data-link="${r.detailLink}" data-index="${index}">Details laden</button>` : ''}
    `;
    container.appendChild(div);
  });

  // Event Listener für Detail-Buttons
  document.querySelectorAll('.details-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const detailLink = btn.getAttribute('data-link');
      const index = parseInt(btn.getAttribute('data-index'));

      btn.textContent = 'Lade Details...';
      btn.disabled = true;

      try {
        const res = await fetch('/api/ais/details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ detailLink })
        });

        const data = await res.json();

        // Update Abstract, DOI, Keywords, PDF-Link
        results[index].abstract = data.abstract;
        results[index].doi = data.doi !== 'nicht verfügbar' ? data.doi : null;
        results[index].keywords = data.keywords?.split(',').map(k => k.trim()) || [];
        results[index].pdfLink = data.pdfLink !== 'nicht verfügbar' ? data.pdfLink : null;

        renderResults(results); // Seite neu rendern

      } catch (err) {
        console.error('Fehler beim Laden der Details:', err);
        btn.textContent = 'Fehler';
      }
    });
  });
}
