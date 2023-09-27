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
      gtag('event', 'profile_monthly_limit_reached', {counter, authenticated: this.authenticated, location: document.location.href});
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
    gtag('event', 'countable_entity_profile_viewed', {checksCounter, authenticated: this.authenticated, location: document.location.href});
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
