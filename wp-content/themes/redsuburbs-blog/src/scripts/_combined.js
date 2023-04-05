
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

(async function() {
  const searchForm = document.querySelector('.SuburbSearch');
  if(searchForm === null) return;
  const searchInput = searchForm.querySelector('input');
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
    const list = document.querySelector('.SuburbSearch__results');
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
    console.log(items);
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

/* === File: legacy-sidebar.js === */
(function() {
  const sidebar = document.querySelector('.Sidebar__container');
  const sidebarToggle = document.querySelector('.Sidebar__open-trigger');
  const sidebarClose = Array.from(document.querySelectorAll('.Sidebar__close-btn, .Sidebar__close-trigger'));

  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.add('Sidebar__container--active');
  });

  sidebarClose.forEach(i => i.addEventListener('click', () => {
    sidebar.classList.remove('Sidebar__container--active');
  }));
})();
