(function() {
  const searchEl = document.querySelector('.SuburbsPage__search');
  if(!searchEl) return;
  const sortEl = document.querySelector('.SuburbsPage__search-sort');
  const orderEl = document.querySelector('.SuburbsPage__search-order');
  const paginationEl = document.querySelector('.SuburbsPage__pagination');
  const loadMoreEl = document.querySelector('.SuburbsPage__load-more-box');
  const loadIndicator = document.querySelector('.SuburbsPage__load-indicator');
  const tableBody = document.querySelector('.SuburbsPage__suburbs tbody');

  let suburbs = [];
  let regionSuburbs = [];
  let loadingSuburbs = false;
  let searchQuery = '';
  let sortBy = 'name';
  let orderDir = 'desc';

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
    // Loading region if required
    if(RedSuburbsContext.region !== '') {
      let region = await fetch(`/data/regions/${RedSuburbsContext.region}.json`).then(res => res.json());
      regionSuburbs = region.suburbs;
    }
    // Hide load indicator
    toggleLoadIndicator(false);
    loadingSuburbs = false;
  }

  const moreResultsToLoadNumber = 20;
  let lastResults = null;
  let lastRenderedNumber = 0;
  function renderSearchResults(number=20, useLastResults=false) {
    lastRenderedNumber = number;
    let results = [];
    if(useLastResults) {
      results = lastResults;
      if(number >= results.length) loadMoreEl.style.display = 'none';
    } else {
      // filter suburbs by searchQuery and limit to 20
      results = suburbs.filter(suburb => {
        if(RedSuburbsContext.state !== '' && suburb.state.toLowerCase() !== RedSuburbsContext.state) return false;
        if(RedSuburbsContext.lga !== '' && suburb.lga_key !== RedSuburbsContext.lga) return false;
        if(regionSuburbs.length > 0 && !regionSuburbs.includes(suburb.key)) return false;
        return suburb.name.toLowerCase().includes(searchQuery.toLowerCase());
      });
      // sort suburbs by sortBy
      results = results.sort((a, b) => {
        if(sortBy === 'name') {
          return a.name.localeCompare(b.name);
        } else if(sortBy === 'population') {
          return b.pops - a.pops;
        } else if(sortBy === 'crime_rank') {
          return b.cr - a.cr;
        }
      });
      // reverse results if orderDir is asc
      if(orderDir === 'asc') results = results.reverse();
      lastResults = results;
    }
    // Limit to 20 results
    results = results.slice(0, number);
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

  function showMoreResults() {
    renderSearchResults(lastRenderedNumber + moreResultsToLoadNumber, true);
  }

  async function performSearch() {
    searchQuery = searchEl.value;
    sortBy = sortEl.value;
    orderDir = orderEl.value;

    paginationEl.style.display = 'none';
    loadMoreEl.style.display = '';
    if(suburbs.length === 0) {
      if(!loadingSuburbs) {
        await loadSuburbs();
        renderSearchResults();
      }
    } else {
      renderSearchResults();
    }
  }

  searchEl.addEventListener('input', function(e) {
    const search = e.target.value;
    if(suburbs.length === 0 && search.length < 2) return;
    performSearch();
  });
  sortEl.addEventListener('change', performSearch);
  orderEl.addEventListener('change', performSearch);
  loadMoreEl.addEventListener('click', showMoreResults);
})();
