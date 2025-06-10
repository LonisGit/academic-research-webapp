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

  let sources = ['sciencedirect', 'springer', 'ais'];
  if (currentSource !== 'all') sources = [currentSource];

  const allResults = [];

  for (let source of sources) {
    try {
      const res = await fetch(`/api/${source}/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.results) {
        allResults.push(...data.results.map(r => ({ ...r, source })));
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
    container.innerHTML = '<p>❌ Keine Ergebnisse gefunden.</p>';
    return;
  }

  results.forEach(r => {
    const authors = Array.isArray(r.authors) ? r.authors.join(', ') : r.authors || 'Unbekannt';
    const keywords = r.keywords?.join(', ') || 'Keine';
    const journal = r.journal || 'Nicht verfügbar';
    const date = r.publicationDate || 'Unbekannt';
    const access = r.isOpenAccess ? '🟢 Open Access' : '🔒 Zugriff erforderlich';
    const doi = r.doi ? `<a href="https://doi.org/${r.doi}" target="_blank">DOI</a>` : 'DOI nicht verfügbar';

    const pdf = r.pdfLink ? `<a href="${r.pdfLink}" target="_blank">📄 PDF</a>` : '';
    const html = r.htmlLink ? `<a href="${r.htmlLink}" target="_blank">🌐 HTML</a>` : '';

    const div = document.createElement('div');
    div.className = 'result-card';
    div.innerHTML = `
      <h3>${r.title || 'Kein Titel'}</h3>
      <p><strong>Autoren:</strong> ${authors}</p>
      <p><strong>Journal:</strong> ${journal}</p>
      <p><strong>Veröffentlichung:</strong> ${date}</p>
      <p><strong>Schlagwörter:</strong> ${keywords}</p>
      <p><strong>Zugang:</strong> ${access}</p>
      <p><strong>DOI:</strong> ${doi}</p>
      <p>${r.abstract || 'Kein Abstract verfügbar'}</p>
      <p>${pdf} ${html}</p>
      <p><a href="${r.url}" target="_blank">Zur Quelle (${r.source})</a></p>
    `;
    container.appendChild(div);
  });
}
