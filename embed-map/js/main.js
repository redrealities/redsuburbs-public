(async function() {
  const dataPath = '/data';
  const urlBase = Util.isDev ? '/' : '/embed-map/';
  const dataLayers = [
    { name: 'suburbs', baseUrl: '/groups/', zoom: [10, Infinity] },
    { name: 'lgas', baseUrl: '/lga-groups/', zoom: [6, 9] },
  ];
  let suburbGroupsIndex = {};
  let lgaGroupsIndex = {};
  let suburbGroups = [];
  let lgaGroups = [];
  let statesData = null;
  let layer = 'auto';
  let bounds = L.latLngBounds(L.latLng(0,0), L.latLng(0,0));
  let center = {lat: -24.4871, lng: 138.8232};
  let zoom = 4;

  const dynamicCSSEl = document.getElementById('dynamic-css');
  const urlParams = new URLSearchParams(window.location.search);
  zoom = parseInt(urlParams.get('zoom') || zoom);
  center.lat = parseFloat(urlParams.get('lat') || center.lat);
  center.lng = parseFloat(urlParams.get('lng') || center.lng);
  layer = urlParams.get('layer') || layer;

  const mapView = new MapView([center.lat, center.lng], zoom);
  mapView.selectedSuburb = urlParams.get('suburb');

  async function loadGroupIndex(kind) { // kind = 'groups' | 'lga-groups'
    let response = await fetch(`${dataPath}/${kind}/index.json`);
    if(!response.ok) {
      alert(`Failed to load ${kind} data!`);
      throw new Error(`Failed to load ${kind} data!`);
    }

    let data = await response.json();
    return data;
  }

  async function loadStatesLayer() {
    const response = await fetch(`${dataPath}/states.geo.json`);
    if(!response.ok) {
      alert(`Failed to load states!`);
      throw new Error(`Failed to load states!`);
    }
    const data = await response.json();
    statesData = data;
  }

  function renderLayerData(layerName, data) {
    L.geoJSON(data, {
      style: s => mapView.styleSuburb(s, `rr__map-layer--${layerName}`),
    })
    .on('mouseover', e => mapView.mouseOverHandler(e))
    .on('mouseout', e => mapView.mouseOutHandler(e))
    .on('click', e => mapView.mouseClickHandler(e))
    .addTo(mapView.map);
  }

  async function renderStatesLayer() {
    if(!statesData) await loadStatesLayer();
    renderLayerData('states', statesData);
  }

  // FIXME: Create new DataLoader class and isolate this logic there
  let loadedGroups = [];
  async function loadGroups() {
    // ==== Identify which groups we need to load
    const currentLayer = layer;
    dataLayers.forEach(layer => {
      if(currentLayer !== layer.name && (zoom < layer.zoom[0] || zoom > layer.zoom[1])) return;
      //if(zoom <= zoomSwitchLvl) return;
      const layerIndex = layer.name == 'suburbs' ? suburbGroupsIndex : lgaGroupsIndex;
      if(layerIndex === null) return;
      const groupIds = Object.keys(layerIndex);
      const groupsToLoad = [];

      groupIds.forEach(groupId => {
        // Check if group already loaded
        if(loadedGroups.indexOf(groupId) !== -1) return;
        // Check if the group is within bounds
        const groupBounds = L.latLngBounds(
          L.latLng(
            layerIndex[groupId][1],
            layerIndex[groupId][0],
          ),
          L.latLng(
            layerIndex[groupId][3],
            layerIndex[groupId][2],
          ),
        );
        if(!bounds.intersects(groupBounds)) return;
        groupsToLoad.push(groupId);
      });

      // ==== Load groups
      if(groupsToLoad.length === 0) return;
      console.log(`Groups<${layer.name}> to load: ${groupsToLoad}`);
      loadedGroups = loadedGroups.concat(groupsToLoad);
      // Loading the group
      (async () => {
        const newGroups = [];
        const loadPromises = groupsToLoad.map(async (groupId, i) => {
          const response = await fetch(`${dataPath}${layer.baseUrl}${groupsToLoad[i]}.json`);
          if(!response.ok) {
            alert(`Failed to load group<${layer.name}> ${groupsToLoad[i]}!`);
            throw new Error(`Failed to load group<${layer.name}> ${groupsToLoad[i]}!`);
          }
          const data = await response.json();
          newGroups.push(data);
        });
        await Promise.all(loadPromises);
        // FIXME: Render loaded groups instead of storing them?
        if(layer.name == 'suburbs') {
          renderLayerData('suburbs', newGroups);
          // suburbGroups = suburbGroups.concat(newGroups);
        } else {
          renderLayerData('lgas', newGroups);
          // lgaGroups = lgaGroups.concat(newGroups);
        }
      })();
    });

  }

  function showMapLayer(layerName) {
    dynamicCSSEl.innerHTML = `.rr__map-layer--${layerName} { display: inline; }`;
  }
  window.showMapLayer = showMapLayer;

  function setBounds(_bounds) {
    bounds = _bounds;
    console.log('setBounds', bounds);
  }

  function setZoom(_zoom) {
    zoom = _zoom;
    console.log('setZoom', zoom);
  }

  function setCenter(_center) {
    center = _center;
    console.log('setCenter', center);
  }

  function showCurrentLayer(zoom, mapLayer) {
    if(['states', 'suburbs', 'lgas'].indexOf(mapLayer) !== -1) {
      showMapLayer(mapLayer);
      return;
    }
    // AUTO
    if(zoom > 5) {
      return dataLayers.map(layer => {
        if(zoom < layer.zoom[0] || zoom > layer.zoom[1]) return null;
        showMapLayer(layer.name);
      });
    } else {
      showMapLayer('states');
    }
  }

  function setDynamicUrl() {

    let url = `?lat=${center.lat}&lng=${center.lng}&zoom=${zoom}`;
    if(layer !== 'auto') url += `&layer=${layer}`;
    //navigate(url);
    window.history.pushState({}, '', urlBase + url);
    if(window.parent !== null) {
      window.parent.postMessage(JSON.stringify({
        type: 'map-url-change',
        url: '/' + url
      }), '*');
    }
  }

  let mapChangeTimeout = null;
  function handleMapChange() {
    if(mapView.map === null) return;
    if(mapChangeTimeout !== null) clearTimeout(mapChangeTimeout);
    mapChangeTimeout = setTimeout(function() {
      const center = mapView.map.getCenter();
      const bounds = mapView.map.getBounds();
      const zoom = mapView.map.getZoom();
      setBounds(bounds);
      setZoom(zoom);
      setCenter(center);
      loadGroups();
      showCurrentLayer(zoom, layer);
      setDynamicUrl();
    }, 500);
  }

  handleMapChange();
  mapView.map.on('moveend', () => handleMapChange());
  mapView.map.on('zoomend', () => handleMapChange());

  suburbGroupsIndex = await loadGroupIndex('groups');
  lgaGroupsIndex = await loadGroupIndex('lga-groups');
  await renderStatesLayer();
  showCurrentLayer(zoom, layer);

})();
