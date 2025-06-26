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

  document.getElementById('loader').classList.remove('hidden');
  document.getElementById('results').innerHTML = '';


  const resultContainer = document.getElementById('results');

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
              isOpenAccess: false,
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

  // Ergebnisse zufällig (Fisher-Yates Shuffle)
  for (let i = allResults.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allResults[i], allResults[j]] = [allResults[j], allResults[i]];
  }


  renderResults(allResults);
  document.getElementById('loader').classList.add('hidden');

}

function renderResults(results) {
  const container = document.getElementById('results');
  container.innerHTML = '';

  if (!results.length) {
    container.innerHTML = '<p>Keine Ergebnisse gefunden.</p>';
    return;
  }

  results.forEach(r => {
    const authors = Array.isArray(r.authors) ? r.authors.join(', ') : r.authors || 'Unbekannt';
    const journal = r.journal || 'Nicht verfügbar';
    const date = r.publicationDate || 'Unbekannt';
    const access = r.isOpenAccess ? 'Open Access' : 'Kein Open Access';
    const doi = r.doi ? `<a href="https://doi.org/${r.doi}" target="_blank">DOI</a>` : 'DOI nicht verfügbar';
    const isSD = r.source === 'sciencedirect';

    // Nur wenn Open Access, PDF-Link anzeigen
    const pdf = (r.pdfLink && r.isOpenAccess) ? `<a href="${r.pdfLink}" target="_blank">PDF</a>` : '';
    const html = r.htmlLink ? `<a href="${r.htmlLink}" target="_blank">HTML</a>` : '';

    // Abstract & Keywords nur wenn nicht ScienceDirect
    const abstract = (!isSD && r.abstract) ? `<p class="abstract"><em>${r.abstract}</em></p>` : '';
    const keywords = (!isSD && r.keywords?.length) ? `<p><strong>Schlagwörter:</strong> ${r.keywords.join(', ')}</p>` : '';

    // Optional: Farbliche Klasse je nach Quelle
    const sourceClass = `card-${r.source || 'default'}`;

    const div = document.createElement('div');
    div.className = `result-card ${sourceClass}`;
    div.innerHTML = `
      <h3>${r.title || 'Kein Titel'}</h3>
      ${abstract}
      <p><strong>Autoren:</strong> ${authors}</p>
      <p><strong>Journal:</strong> ${journal}</p>
      <p><strong>Veröffentlichung:</strong> ${date}</p>
      ${keywords}
      <p><strong>Zugang:</strong> ${access}</p>
      <p><strong>DOI:</strong> ${doi}</p>
      <p>${pdf} ${html}</p>
    `;
    container.appendChild(div);
  });
}


