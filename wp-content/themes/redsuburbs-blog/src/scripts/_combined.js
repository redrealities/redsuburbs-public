
/* === File: legacy-suburbs.js === */
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

/* === File: legacy-map.js === */
function makeSuburbKey(suburb_name) {
  search_str = suburb_name.toLowerCase();
  search_str = search_str.replace(/-/g, '');
  search_str = search_str.replace(/\(/g, '');
  search_str = search_str.replace(/\)/g, '');
  search_str = search_str.replace(/\./g, '');
  search_str = search_str.replace(/'/g, '');
  search_str = search_str.replace(/\s+/g, '-');
  search_str = search_str.replace(/^\s+|\s+$/g, '');
  return search_str;
}

(function() {
  const msg = document.querySelector('.HomePage__welcome-msg');
  if(msg === null) return;
  const closeBtn = msg.querySelector('.HomePage__welcome-msg-close-btn');
  const noshowBtn = msg.querySelector('.HomePage__welcome-msg-noshow-btn');

  if(localStorage.getItem('welcomeMsg') === 'hidden') {
    msg.classList.add('HomePage__welcome-msg--hidden');
  }

  closeBtn.addEventListener('click', () => {
    msg.classList.add('HomePage__welcome-msg--hidden');
  });
  noshowBtn.addEventListener('click', () => {
    msg.classList.add('HomePage__welcome-msg--hidden');
    localStorage.setItem('welcomeMsg', 'hidden');
  });
})();
(function() {
  const map = document.querySelector('.HomePage__map');
  if(map === null) return;
  if(window.location.search !== '') {
    if(window.location.search.indexOf('?suburb=') === 0) {
      const suburb = decodeURI(window.location.search.split('=')[1]);
      focusOnSuburb(map, suburb);
    } else {
      map.src = map.src + window.location.search;
    }
  }


  // bound is array of four floats
  function getLatLngFromBounds(bounds) {
    const lat = (bounds[0] + bounds[2]) / 2;
    const lng = (bounds[1] + bounds[3]) / 2;
    return [lat, lng];
  }

  async function focusOnSuburb(map, suburbName) {
    const suburbKey = makeSuburbKey(suburbName);
    const suburb = await fetch(`/data/suburbs/${suburbKey}.json`).then(r => r.json());
    console.log(suburb);
    const latLng = getLatLngFromBounds(suburb.bounds);
    console.log(latLng);
    const url = `?lat=${latLng[1]}&lng=${latLng[0]}&zoom=14&suburb=${suburbName}`;
    map.src = map.src + url;
  }

  window.addEventListener('message', function(e) {
    // decode json from message
    try {
      const data = JSON.parse(e.data);
      if(data.type === 'map-url-change') {
        console.log(data.url);
        history.pushState(null, null, data.url);
      }
    } catch(error) {
      console.log(`Unexpected message:`, e.data);
    }
  });
})();

/* === File: landing-prime.js === */
(function() {
  serverless_mailer.setup({
    apiUrl: 'https://gblslv2ixl5amw6z2bexp3mjcq0hnahs.lambda-url.us-east-1.on.aws/'
  });
  const forms = Array.from(document.querySelectorAll('.serverless-submit__box'));
  forms.forEach(form => {
    const successEl = form.querySelector('.serverless-submit__success');
    const errorEl = form.querySelector('.serverless-submit__error');
    serverless_mailer.handleForm(
      form,
      'RedSuburbs landing page message',
      () => successEl.textContent = 'We\'ll be in touch soon',
      error => errorEl.textContent = error
    );
  });
})();

/* === File: legacy-profile.js === */
(function() {
  const ctx = document.querySelector('.SuburbProfilePage__chart-canvas');
  if(ctx === null) return;

  new Chart(ctx, {
    type: 'doughnut',
    data: chart_data,
    options: {
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.label + ': ' + context.parsed + '%';
            }
          }
        }
      },
    },
  });
})();
(function() {
  const ctxs = document.querySelectorAll('.SuburbProfilePage__trend-canvas');
  if(ctxs.length === 0) return;

  ctxs.forEach(ctx => {
    let data = total_crimes_trend_data;
    if(ctx.classList.contains('SuburbProfilePage__trend-canvas--violent')) {
      data = violent_crimes_trend_data;
    } else if(ctx.classList.contains('SuburbProfilePage__trend-canvas--property')) {
      data = property_crimes_trend_data;
    }
    new Chart(ctx, {
      type: 'line',
      data: data,
      options: {
        responsive: true
      },
    });
  });
})();

/* === File: legacy-sidebar.js === */
(function() {
  const sidebar = document.querySelector('.Sidebar__container');
  // General visibility
  const sidebarToggle = document.querySelector('.Sidebar__open-trigger');
  const sidebarClose = Array.from(document.querySelectorAll('.Sidebar__close-btn, .Sidebar__close-trigger'));

  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.add('Sidebar__container--active');
  });

  sidebarClose.forEach(i => i.addEventListener('click', () => {
    sidebar.classList.remove('Sidebar__container--active');
  }));

  // Accordion submenu
  const submenuParents = Array.from(sidebar.querySelectorAll('.Sidebar__submenu-parent'));
  submenuParents.forEach(i => i.addEventListener('click', e => {
    e.preventDefault();
    i.classList.toggle('Sidebar__submenu-parent--active');
  }));
})();

/* === File: legacy-search.js === */
(async function() {
  const searchForms = Array.from(document.querySelectorAll('.SuburbSearch'));
  searchForms.forEach(async searchForm => {
    const searchInput = searchForm.querySelector('input');
    const resultsArea = searchForm.querySelector('.SuburbSearch__results');
    // load suburb names
    const items = await fetch('/data/search_names.json').then(r => r.json());
    const searchItems = [];
    items.forEach(itemGroup => {
      itemGroup.items.forEach(item => searchItems.push({
        type: itemGroup.type,
        name: item,
        key: makeSuburbKey(item),
      }));
    });
    const type_search_prefix = {
      'suburbs': 'suburb ',
      'lgas': 'lga ',
      'postcodes': 'postcode ',
    };

    function filterItems(search) {
      return searchItems.filter(s => (type_search_prefix[s.type] + s.name).toLowerCase().includes(search.toLowerCase())).slice(0, 20);
    }

    function renderItemsList(items) {
      const list = resultsArea;
      list.innerHTML = '';
      items.forEach(s => {
        const item = document.createElement('button');
        item.classList.add('SuburbSearch__result');
        item.dataset.type = type_search_prefix[s.type];
        item.textContent = s.name;
        item.addEventListener('click', function(e) {
          e.preventDefault();
          // send message to map iframe
          console.log(item);
          window.location.href = `/${s.type}/${s.key}/`;
        });
        list.appendChild(item);
      });
      list.classList.toggle('SuburbSearch__results--visible', list.children.length > 0);
    }

    searchInput.addEventListener('input', function(e) {
      const items = filterItems(e.target.value);
      // console.log(items);
      renderItemsList(items);
    });

    searchInput.addEventListener('blur', function() {
      setTimeout(function() {
        renderItemsList([]);
      }, 200);
    });

    searchForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const query = searchInput.value;
      const items = filterItems(query);
      if(items.length > 0) {
        const s = items[0];
        window.location.href = `/${s.type}/${s.key}/`;
      }
    });
  });
})();

/* === File: legacy-feedback-form.js === */
(function() {
  const form = document.querySelector('.feedback-form');
  if(form === null) return;
  const featureField = form.querySelector('input[name="Feature"]');

  serverless_mailer.setup({
    apiUrl: 'https://gblslv2ixl5amw6z2bexp3mjcq0hnahs.lambda-url.us-east-1.on.aws/'
  });

  const closeBtns = document.querySelectorAll('.feedback-form__close-btn');
  closeBtns.forEach(btn => btn.addEventListener('click', () => form.classList.remove('feedback-form--visible')));

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.addEventListener('click', () => form.classList.remove('feedback-form--visible'));

  serverless_mailer.handleForm(
    form,
    'RedSuburbs feedback popup',
    () => {
      form.classList.remove('feedback-form--visible');
      alert('Thanks for your feedback!');
    },
    error => alert(`Error submitting feedback: ${error}`)
  );

  function askFeedback(feature) {
    const placeholders = form.querySelectorAll('.feedback-form__placeholder');
    placeholders.forEach(el => el.dataset.value = feature);
    featureField.value = feature;
    form.classList.add('feedback-form--visible');
    localStorage.setItem('last-feedback-asked', new Date());
  }
  window.askFeedback = askFeedback;

  // askFeedback('Suburb Profile');

  // User feedback conditions
  // User has been using website for at least 24 hours
  if(localStorage.getItem('first_visit') !== null) {
    const first_visit = new Date(localStorage.getItem('first_visit'));
    const now = new Date();
    const daysSinceFirstVisit = Math.floor((now - first_visit) / (1000 * 60 * 60 * 24));
    if(daysSinceFirstVisit < 1) return;
  } else {
    localStorage.setItem('first_visit', new Date());
    return;
  }
  // User feedback wasn't asked for at least 60 days
  if(localStorage.getItem('last-feedback-asked') !== null) {
    const lastAsked = new Date(localStorage.getItem('last-feedback-asked'));
    const now = new Date();
    const daysSinceLastAsked = (now - lastAsked) / (1000 * 60 * 60 * 24);
    if(daysSinceLastAsked < 60) return;
  }

  let asked = false;
  const featureName = 'feedbackFeatureName' in window ? window.feedbackFeatureName : 'Red Suburbs';

  // Asking after usage for 15 minutes
  setTimeout(() => {
    if(asked) return;
    asked = true;
    askFeedback(featureName);
  }, 15*1000);
  // Or after scrolled to the bottom of the page
  window.addEventListener('scroll', () => {
    if(window.scrollY + window.innerHeight < document.body.scrollHeight - 400) return;
    if(asked) return;
    asked = true;
    askFeedback(featureName);
  });

})();
