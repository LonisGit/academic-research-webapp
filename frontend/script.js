async function searchScienceDirect() {
  const query = document.getElementById('scienceInput').value;
  const response = await fetch(`/api/sciencedirect/search?q=${encodeURIComponent(query)}`);
  const results = await response.json();
  displayResults(results, 'scienceResults');
}

async function searchSpringer() {
  const query = document.getElementById('springerInput').value;
  const response = await fetch(`/api/springer/search?query=${encodeURIComponent(query)}`);
  const results = await response.json();
  displayResults(results, 'springerResults');
}

async function searchAIS() {
  const query = document.getElementById('aisInput').value;
  const response = await fetch(`/api/ais/search?query=${encodeURIComponent(query)}`);
  const results = await response.json();
  displayResults(results, 'aisResults');
}

function displayResults(data, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  if (data.results && data.results.length) {
    data.results.forEach(item => {
      const div = document.createElement('div');
      div.classList.add('result');
      div.innerHTML = `
        <h3>${item.title || 'Kein Titel'}</h3>
        <p>${item.summary || 'Kein Abstract'}</p>
        <a href="${item.url}" target="_blank">Zur Quelle</a>
      `;
      container.appendChild(div);
    });
  } else {
    container.innerHTML = '<p>Keine Ergebnisse gefunden.</p>';
  }
}
