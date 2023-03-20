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
  const suburbs = await fetch('/data/suburb_names.json').then(r => r.json());

  function filterSuburbs(suburb) {
    return suburbs.filter(s => s.toLowerCase().includes(suburb.toLowerCase())).slice(0, 20);
  }

  function renderSuburbList(suburbs) {
    const list = document.querySelector('.SuburbSearch__results');
    list.innerHTML = '';
    suburbs.forEach(s => {
      const item = document.createElement('button');
      item.classList.add('SuburbSearch__result');
      item.textContent = s;
      item.addEventListener('click', function(e) {
        e.preventDefault();
        // send message to map iframe
        console.log(item);
        window.location.href = '/?suburb=' + item.textContent;
      });
      list.appendChild(item);
    });
    list.classList.toggle('SuburbSearch__results--visible', list.children.length > 0);
  }

  searchInput.addEventListener('input', function(e) {
    const suburbs = filterSuburbs(e.target.value);
    renderSuburbList(suburbs);
  });

  searchInput.addEventListener('blur', function() {
    setTimeout(function() {
      renderSuburbList([]);
    }, 200);
  });

  searchForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const query = searchInput.value;
    const suburbs = filterSuburbs(query);
    if(suburbs.length > 0) {
      window.location.href = '/?suburb=' + suburbs[0];
    }
  });
})();
