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
