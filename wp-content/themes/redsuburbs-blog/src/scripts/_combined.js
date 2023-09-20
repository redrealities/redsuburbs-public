
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

/* === File: legacy-account.js === */
const PRO_API_URL = PRO_URL + '/wp-json';

class RRAccount {
  constructor() {
    this.ctrlMenu = null;
    this.userDetails = this.authenticateUser();
    this.authenticated = this.userDetails !== null;
    this.premium = this.authenticated && ['plus', 'pro'].includes(this.userDetails.accessLevel);
    document.body.classList.toggle('rr-account--authenticated', this.authenticated);
    document.body.classList.toggle('rr-account--premium', this.premium);
  }

  onPageLoad() {
    this.handleLoginForm();
    this.handleRegistrationForm();
    this.handleAccountDetails();

    if(this.authenticated && this.premium) {
      this.hideAds();
      this.handleSavedLocations();
    }

    if(this.authenticated) {
      this.showUserDetails();
    }

    const logoutBtns = Array.from(document.querySelectorAll('.util__logout-btn'));
    logoutBtns.forEach(btn => btn.addEventListener('click', () => rrAccount.logout()));
  }

  checkProfileChecksLimit(counter) {
    if(this.authenticated && this.premium) return;
    if(counter >= 15) {
      // show upgrade modal
      document.querySelector('.upgrade-modal').classList.add('modal--active');
      dataLayer.push({'event': 'profile-monthly-limit-reached'});
    }
  }

  addToProfileCheckCounter() {
    let checksCounter = localStorage.getItem('profileChecksCounter');
    if(!checksCounter) {
      checksCounter = 0;
    } else {
      checksCounter = parseInt(checksCounter);
    }
    let checksMonth = localStorage.getItem('profileChecksMonth');
    let currentMonth = new Date().getMonth().toString();
    if(checksMonth !== currentMonth) {
      checksMonth = currentMonth;
      checksCounter = 0;
    }

    checksCounter++;
    dataLayer.push({'event': 'countable-entity-profile-viewed'});
    localStorage.setItem('profileChecksCounter', checksCounter);
    localStorage.setItem('profileChecksMonth', checksMonth);

    this.checkProfileChecksLimit(checksCounter);
  }

  hideAds() {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = '.adsbygoogle { display: none !important; }';
    document.head.appendChild(styleEl);
  }

  authenticateUser() {
    // check if token is in localStorage
    let userDetails = localStorage.getItem('userDetails');
    if (!userDetails) return null;
    // check if token is valid
    userDetails = JSON.parse(userDetails);
    if (userDetails && userDetails.token) {
      // FIXME: check if user Access Level expired
      return userDetails;
    }
    return null;
  }

  logout(redirect_to = '/') {
    localStorage.removeItem('userDetails');
    window.top.location.href = redirect_to;
  }

  requestLogin() {
    window.top.location.href = '/login';
  }

  requestUpgrade() {
    // redirect top frame to /upgrade
    window.top.location.href = 'https://redsuburbs.com.au/upgrade';
  }

  // TODO: Move to separate class, or not, maybe it belongs here.
  showUserDetails() {
    const ctrl = document.querySelector('.AccountCtrl');
    if (!ctrl) return;
    const avatar = ctrl.querySelector('.AccountCtrl__avatar');
    const avatarImg = avatar.children[0];

    avatar.dataset.level = this.userDetails.accessLevel;
    avatarImg.src = this.userDetails.avatar;
    avatarImg.setAttribute('title', `${this.userDetails.displayName}: ${this.userDetails.accessLevel} access level`);

    ctrl.classList.add('AccountCtrl--authenticated');

    const ctrlMenu = ctrl.querySelector('.AccountCtrl__menu');
    this.ctrlMenu = ctrlMenu;
    avatar.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleCtrlMenuVisibility();
    });
    ctrlMenu.querySelector('.AccountCtrl__set-start-btn').addEventListener('click', (e) => {
      this.setStartLocation();
      this.toggleCtrlMenuVisibility(false);
    });
  }

  // TODO: Move to separate class
  toggleCtrlMenuVisibility(visible=null) {
    if(!this.ctrlMenu) return;
    if(visible === null) {
      this.ctrlMenu.classList.toggle('AccountCtrl__menu--active');
    } else {
      this.ctrlMenu.classList.toggle('AccountCtrl__menu--active', visible);
    }
  }

  async requestUserAccessLevel() {
    const response = await this.apiReq('/redsuburbs/user-level');
    this.userDetails.accessLevel = response.accessLevel;
    this.userDetails.accessExpireDate = response.accessExpireDate;
    localStorage.setItem('userDetails', JSON.stringify(this.userDetails));
    return response;
  }

  async setStartLocation() {
    const urlParams = new URLSearchParams(window.location.search);

    if(!(urlParams.has('lat') && urlParams.has('lng') && urlParams.has('zoom'))) {
      if(confirm('You can only set your start location from the map page.\n\nDo you want to open it now?')) {
        window.location.href = '/';
      }
      return;
    }

    const lat = urlParams.get('lat');
    const lng = urlParams.get('lng');
    const zoom = urlParams.get('zoom');

    const response = await this.apiReq('/redsuburbs/start-location', 'POST', { lat, lng, zoom });
    if(response.success) {
      alert('Start location set successfully');
    } else {
      alert('Error setting start location');
      console.error(response);
    }
  }

  async getStartLocation() {
    const response = await this.apiReq('/redsuburbs/start-location');
    return response;
  }

  async resetStartLocation() {
    const response = await this.apiReq('/redsuburbs/start-location', 'DELETE');
  }

  async saveLocation(name, type, key) {
    const response = await this.apiReq('/redsuburbs/saved-locations', 'POST', { name, type, key });
    return response;
  }

  async getSavedLocations() {
    const response = await this.apiReq('/redsuburbs/saved-locations');
    return response;
  }

  async deleteSavedLocation(key) {
    const response = await this.apiReq(`/redsuburbs/saved-locations/${key}`, 'DELETE');
    return response;
  }

  async apiReq(url, method = 'GET', reqData = {}) {
    const opts = {
      'method': method,
      'headers': {
        'Authorization': `Bearer ${rrAccount.userDetails.token}`
      }
    };
    if(method !== 'GET') {
      opts.body = JSON.stringify(reqData);
      opts.headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${PRO_API_URL}${url}`, opts);
    if(!response.ok) {
      if(response.status === 403) {
        rrAccount.logout(document.location.href);
      } else {
        console.error(response);
      }
    }
    const data = await response.json();
    return data;
  }

  // --- These methods are to be moved to one or many separate files
  // TODO: Move to separate class
  async handleAccountDetails() {
    const form = document.querySelector('.AccountDetails');
    if (!form) return;
    if(!this.authenticated) this.requestLogin();

    const currentAccessLevel = this.userDetails.accessLevel;
    const response = await this.requestUserAccessLevel();
    if(response.accessLevel !== currentAccessLevel) {
      document.location.reload();
      return;
    }

    const errorEl = form.querySelector('.AccountForm__error');
    form.querySelector('[data-name=name]').textContent = this.userDetails.displayName;
    form.querySelector('[data-name=email]').textContent = this.userDetails.email;
    form.querySelector('[data-name=level]').textContent = this.userDetails.accessLevel.toUpperCase();
    form.querySelector('[data-name=level]').dataset.value = this.userDetails.accessLevel;
    Array.from(form.querySelectorAll('[data-name=id]')).forEach(el => el.value = this.userDetails.id);
    form.querySelector('[data-name=expires]').textContent = this.userDetails.accessExpireDate;

    const el = form.querySelector('[data-name=start-position]');
    if(this.premium) {
      this.getStartLocation().then(data => {
        if(!('lat' in data) || data['lat'] === 0) {
          el.innerHTML = "Not set<br> <span style='opacity: 0.7'>(press account button in top right corner to setup start position)</span>";
          return;
        }
        el.innerHTML = `<a href="/?lat=${data.lat}&lng=${data.lng}&zoom=${data.zoom}">Lat: ${data.lat} Long: ${data.lng} Zoom: ${data.zoom}</a> &nbsp;`;
        const resetBtn = document.createElement('button');
        resetBtn.classList.add('btn', 'btn--inline');
        resetBtn.textContent = 'Reset';
        resetBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          if(confirm('Are you sure you want to reset your start location?')) {
            await this.resetStartLocation();
            window.location.reload();
          }
        });
        el.appendChild(resetBtn);
      });
    } else {
      el.innerHTML = "Require Non-Free Account";
    }
  }

  // TODO: Move to separate class
  handleLoginForm() {
    // find form
    const form = document.querySelector('.AccountLogin');
    if(!form) return;
    if(this.authenticated) {
      window.location.href = '/account';
      return;
    }

    const errorEl = form.querySelector('.AccountForm__error');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      form.classList.add('AccountForm--loading');
      const email = form.querySelector('#email').value;
      const password = form.querySelector('#password').value;
      // request JWT token with fetch from /jwt-auth/v1/token
      const response = await fetch(`${PRO_API_URL}/jwt-auth/v1/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email,
          password,
        }),
      });
      form.classList.remove('AccountForm--loading');
      const data = await response.json();
      if(data.success) {
        // store token in localStorage
        const userDetails = JSON.stringify(data.data);
        localStorage.setItem('userDetails', userDetails);
        //localStorage.setItem('token', data.data.token);
        // redirect to account page
        window.location.href = '/';
      } else {
        errorEl.innerHTML = data.message;
      }

    });
  }

  handleRegistrationForm() {
    // find form
    const form = document.querySelector('.AccountForm--registration');
    if(!form) return;
    if(this.authenticated) {
      window.location.href = '/account';
      return;
    }
    const checkoutForm = document.querySelector('.AccountForm--checkout');
    const checkoutFormClientRef = checkoutForm.querySelector('[name=client_reference_id]');
    const errorEl = form.querySelector('.AccountForm__error');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      form.classList.add('AccountForm--loading');
      const firstName = form.querySelector('#first_name').value;
      const lastName = form.querySelector('#last_name').value;
      const email = form.querySelector('#email').value;
      const password = form.querySelector('#password').value;
      // request JWT token with fetch from /jwt-auth/v1/token
      const response = await fetch(`${PRO_API_URL}/redsuburbs/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
        }),
      });
      form.classList.remove('AccountForm--loading');
      if(!response.ok) {
        errorEl.innerHTML = 'Error registering account';
        return;
      }
      const data = await response.json();
      if(data.success) {
        const userId = data.userId;
        checkoutFormClientRef.value = userId;
        checkoutForm.submit();
      } else {
        errorEl.innerHTML = data.message;
      }
    });
  }

  async handleSavedLocations() {
    const el = document.querySelector('.SavedLocations');
    if(!el) return;

    // load saved locations
    const savedLocations = await this.getSavedLocations();
    let html = '';
    savedLocations.forEach(location => {
      const locationUrl = location.type === 'national' ? '/national': `/${location.type}s/${location.key}`;
      html += `<div class="SavedLocations__item">
        <a class="SavedLocations__item-link" href="${locationUrl}">${location.name} (${location.type})</a>
        <button class="SavedLocations__item-remove btn btn--red btn--small" data-key="${location.key}">Remove</button>
      </div>`;
    });
    el.innerHTML = html;
    const removeBtns = Array.from(el.querySelectorAll('.SavedLocations__item-remove'));
    removeBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const key = btn.dataset.key;
        if(confirm(`Are you sure you want to remove this location?`)) {
          await this.deleteSavedLocation(key);
          window.location.reload();
        }
      });
    });
  }
}
const rrAccount = new RRAccount();

/* === File: legacy-compare.js === */
(function() {
  // If intity profile page, await full load and report page height to parent iframe
  if(document.querySelector('.SuburbProfilePage__chart-canvas')) {
    window.addEventListener('load', () => {
      window.parent.postMessage(JSON.stringify({
        type: 'enty-profile-page-height',
        height: document.body.scrollHeight
      }), '*');
    });
  }


  const entityHeaders = document.querySelector('.EntityCompare__headers');
  const iframesParent = document.querySelector('.EntityCompare__wrapper');

  if(entityHeaders === null) return;

  if(!(rrAccount.authenticated && ['plus', 'pro'].includes(rrAccount.userDetails.accessLevel))) {
    // FREE users
    window.location.href = '/upgrade'; // or login
    return;
  }

  Array.from(entityHeaders.children).forEach((iframe, i) => {
    iframe.querySelector('.EntityCompare__remove-entity-btn').addEventListener('click', removeEntity);
  });

  // Listen to iframe messages, resize all iframes to largest height
  let largestHeight = 0;
  window.addEventListener('message', (e) => {
    const data = JSON.parse(e.data);
    if(data.type === 'enty-profile-page-height') {
      if(data.height > largestHeight) {
        largestHeight = data.height;
        Array.from(iframesParent.children).filter(i => !i.classList.contains('EntityCompare__add-entity-box')).forEach(iframe => iframe.style.height = `${largestHeight}px`);
      }
    }
  });

  // Loading compare entities from localStorage
  let compareEntities = JSON.parse(localStorage.getItem('compareEntities'));
  if(compareEntities && compareEntities.length > 0) {
    compareEntities.forEach(entity => {
      addEntity(entity, false);
    });
  } else {
    compareEntities = [];
    // showing default entity
    addEntity({
      url: '/national/',
      name: 'Australia',
      type: 'nation',
      key: 'australia',
    });
  }

  document.addEventListener('add-compare-entity', (e) => {
    addEntity(e.detail);
  });

  function addEntity(details, save=true) {
    const entity = document.createElement('iframe');
    entity.classList.add('EntityCompare__entity');
    entity.src = details.url + '#embed';
    entity.style.height = `${largestHeight}px`;
    // insert after last iframe
    iframesParent.insertBefore(entity, iframesParent.querySelector('.EntityCompare__add-entity-box'));
    // console.log(e);
    const header = document.createElement('a');
    header.classList.add('EntityCompare__header');
    header.href = details.url;
    header.target = '_blank';
    header.innerHTML = `
      <div class="EntityCompare__header-name">${details.name}</div>
      <div class="EntityCompare__header-type">${details.type}</div>
      <button class="EntityCompare__remove-entity-btn"><img class="EntityCompare__remove-entity-icon" src="/wp-content/themes/redsuburbs-blog/src/images/x-icon.svg" /></button>
    `;
    header.querySelector('.EntityCompare__remove-entity-btn').addEventListener('click', removeEntity);
    // insert last element
    entityHeaders.appendChild(header);

    if(save) {
      compareEntities.push(details);
      localStorage.setItem('compareEntities', JSON.stringify(compareEntities));
    }
  }

  function removeEntity(e) {
    e.preventDefault();
    if(!confirm('Are you sure you want to remove this entity?')) return;
    const entityHeader = e.target.closest('.EntityCompare__header');
    const entityIdx = Array.from(entityHeaders.children).indexOf(entityHeader);
    const entityIframe = iframesParent.children[entityIdx];
    entityIframe.remove();
    entityHeader.remove();
    compareEntities.splice(entityIdx, 1);
    localStorage.setItem('compareEntities', JSON.stringify(compareEntities));
  }
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
(async function() {
  const ctxs = document.querySelectorAll('.SuburbProfilePage__trend-canvas');
  if(ctxs.length === 0) return;

  const printBtn = document.querySelector('.SuburbProfilePage__print-button');
  const compareBtn = document.querySelector('.SuburbProfilePage__compare-button');
  const saveBtn = document.querySelector('.SuburbProfilePage__save-button');

  let plusEntityData = null;
  if(rrAccount.premium) {
    console.log(`Requesting forecast data for the ${rrPageDetails.entityType} ${rrPageDetails.entityKey}`);
    // Requesting PLUS data
    plusEntityData = await rrAccount.apiReq(`/redsuburbs/plus-entity-profile/${rrPageDetails.entityType}s/${rrPageDetails.entityKey}`);

    const printStyles = document.createElement('link');
    printStyles.setAttribute('rel', 'stylesheet');
    printStyles.setAttribute('media', 'print');
    printStyles.setAttribute('href', `${PRO_URL}/wp-content/themes/redsuburbs-pro/src/styles/print-entity.css`);
    document.head.appendChild(printStyles);

    // Add print button
    if(printBtn !== null) {
      printBtn.addEventListener('click', () => window.print());
      compareBtn.addEventListener('click', () => {
        let compareEntities = JSON.parse(localStorage.getItem('compareEntities'));
        if(compareEntities === null) compareEntities = [];
        compareEntities.push({
          url: rrPageDetails.entityUrl,
          name: rrPageDetails.entityName,
          type: rrPageDetails.entityType,
          key: rrPageDetails.entityKey,
        });
        localStorage.setItem('compareEntities', JSON.stringify(compareEntities));
        window.location.href = '/compare';
      });
    }
    if(saveBtn !== null) {
      saveBtn.addEventListener('click', async () => {
        await rrAccount.saveLocation(saveBtn.dataset.name, saveBtn.dataset.type, saveBtn.dataset.key);
        alert('Location saved to your Saved Locations');
      });
    }
  } else {
    // FREE users
    printBtn.addEventListener('click', () => window.location.href = '/upgrade'); // or login
    compareBtn.addEventListener('click', () => window.location.href = '/upgrade'); // or login
    if(saveBtn !== null) saveBtn.addEventListener('click', () => window.location.href = '/upgrade'); // or login
  }

  ctxs.forEach(ctx => {
    let data = total_crimes_trend_data;
    if(ctx.classList.contains('SuburbProfilePage__trend-canvas--violent')) {
      data = violent_crimes_trend_data;
    } else if(ctx.classList.contains('SuburbProfilePage__trend-canvas--property')) {
      data = property_crimes_trend_data;
    }

    if(plusEntityData !== null) {
      data['labels'].push(plusEntityData['forecast']['label']);
      data['datasets'][0]['data'].push(null);
      if(ctx.classList.contains('SuburbProfilePage__trend-canvas--total')) {
        data['datasets'][1]['data'].push(plusEntityData['forecast']['total']);
      } else if(ctx.classList.contains('SuburbProfilePage__trend-canvas--violent')) {
        data['datasets'][1]['data'].push(plusEntityData['forecast']['violent']);
      } else if(ctx.classList.contains('SuburbProfilePage__trend-canvas--property')) {
        data['datasets'][1]['data'].push(plusEntityData['forecast']['property']);
      }
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

/* === File: legacy-common.js === */
(function() {
 if(document.location.hash !== '') document.body.setAttribute('data-hash', document.location.hash);
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
    // get custom event name from data attribute
    const customEventName = searchForm.getAttribute('data-custom-event');
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
      'nations': 'nation ',
      'states': 'state ',
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
          let url = '';
          if(s.type === 'nations') {
            url = '/national/'
          } else {
            url = `/${s.type}/${s.key}/`;
          }
          if(customEventName) {
            document.dispatchEvent(new CustomEvent(customEventName, {
              detail: {
                url,
                name: s.name,
                type: s.type,
                key: s.key,
              }
            }));
          } else {
            window.location.href = url;
          }
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
        let url = '';
        if(s.type === 'nations') {
          url = '/national/'
        } else {
          url = `/${s.type}/${s.key}/`;
        }
        if(customEventName) {
          document.dispatchEvent(new CustomEvent(customEventName, {
            detail: {
              url,
              name: s.name,
              type: s.type,
              type: s.key,
            }
          }));
        } else {
          window.location.href = url;
        }
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
