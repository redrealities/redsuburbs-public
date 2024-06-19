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

  if(!(rrAccount.authenticated && rrAccount.premium)) {
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
