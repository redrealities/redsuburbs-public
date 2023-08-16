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
          if(s.type === 'nations') {
            window.location.href = '/national/'
          } else {
            window.location.href = `/${s.type}/${s.key}/`;
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
        if(s.type === 'nations') {
          window.location.href = '/national/'
        } else {
          window.location.href = `/${s.type}/${s.key}/`;
        }
      }
    });
  });
})();
