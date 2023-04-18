(function() {
  const searchEl = document.querySelector('.SuburbsPage__search');
  if(!searchEl) return;
  const paginationEl = document.querySelector('.SuburbsPage__pagination');
  const loadIndicator = document.querySelector('.SuburbsPage__load-indicator');
  const tableBody = document.querySelector('.SuburbsPage__suburbs tbody');

  let suburbs = [];
  let loadingSuburbs = false;
  let searchQuery = '';

  function getSuburbMapLink(bounds, zoom = 14) {
    const x = bounds[0] + (bounds[2] - bounds[0]) / 2;
    const y = bounds[1] + (bounds[3] - bounds[1]) / 2;
    return `/?lat=${y}&lng=${x}&zoom=${zoom}`;
  }

  function toggleLoadIndicator(state) {
    loadIndicator.classList.toggle('SuburbsPage__load-indicator--active', state);
  }

  async function loadSuburbs() {
    loadingSuburbs = true;
    // Show load indicator
    toggleLoadIndicator(true);
    // Load suburbs from API
    suburbs = await fetch('/data/suburbs.json').then(res => res.json());
    // Hide load indicator
    toggleLoadIndicator(false);
    loadingSuburbs = false;
  }

  function renderSearchResults() {
    // filter suburbs by searchQuery and limit to 20
    let results = suburbs.filter(suburb => {
      if(RedSuburbsContext.state !== '' && suburb.state.toLowerCase() !== RedSuburbsContext.state) return false;
      if(RedSuburbsContext.lga !== '' && suburb.lga_key !== RedSuburbsContext.lga) return false;
      return suburb.name.toLowerCase().includes(searchQuery.toLowerCase());
    }).slice(0, 20);
    // render suburbs
    tableBody.innerHTML = results.map(suburb => `
      <tr class="SuburbsPage__suburb">
        <td><a class="SuburbsPage__suburb-name" href="/suburbs/${suburb.key}">${suburb.name}</a></td>
        <td class="SuburbsPage__suburb-rank">${suburb.cr}</td>
        <td class="SuburbsPage__suburb-rank">${suburb.pops.toLocaleString()}</td>
        <td class="SuburbsPage__suburb-actions"><a class="SuburbsPage__suburb-btn btn btn--inline btn--red" href="${getSuburbMapLink(suburb.bounds)}">On Map</a></td>
      </tr>
    `).join('');
  }

  searchEl.addEventListener('input', async function(e) {
    const search = e.target.value;
    if(suburbs.length === 0 && search.length < 2) return;
    searchQuery = search;
    paginationEl.style.display = 'none';
    if(suburbs.length === 0) {
      if(!loadingSuburbs) {
        await loadSuburbs();
        renderSearchResults();
      }
    } else {
      renderSearchResults();
    }
  });
})();
