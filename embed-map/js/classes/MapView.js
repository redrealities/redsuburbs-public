class MapView {
  constructor(center, zoom, layer, lens) {
    this.selectedSuburb = '';
    this.baseProfilesUrl = Util.isDev ? 'http://192.168.1.7:8080' : '//redsuburbs.com.au';
    this.lens = lens;

    const map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
    }).setView(center, zoom);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://redrealities.com">RedRealities PTY LTD</a> | © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);
    L.control.attribution({
      position: 'bottomleft',
      prefix: false
    }).addTo(map);

    this.map = map;
    this.quickView = new QuickView(lens);
    this.mapLegend = new MapLegend();
    this.layerSwitch = new LayerSwitch(layer, lens);
  }

  getAreaColor(crimeRank) {
    let x = crimeRank / 100;
    let intensity = 0;
    if(x > 0.5) {
      intensity = Math.log(1 - (x - 0.5) *2) / -5; // 5.5
    }
    if(intensity > 1) intensity = 1;
    const color = tinycolor(`rgba(255, 0, 0, ${intensity})`);
    return color.toRgbString();
  }

  getSuburbColor(crimeRank) {
    let x = Math.ceil(crimeRank / 10) / 10;
    let intensity = x;
    if(intensity === 0.1) intensity = 0;
    const color = tinycolor(`rgba(255, 0, 0, ${intensity})`);
    return color.toRgbString();
  }

  styleSuburb(suburb, className) {
    //if(props.crimeData === null) return {};
    if(suburb === undefined) return {};
    let crimeRank = suburb.properties.crime_rank;
    if(this.lens === 'vr') {
      crimeRank = suburb.properties.violent_rank;
    } else if(this.lens === 'pr') {
      crimeRank = suburb.properties.property_rank;
    }
    let fillColor = 'rgba(0,0,0,0)';
    if(suburb.properties.type === 'suburb') {
      // crimeRank = suburb.properties.mcr;
      fillColor = this.getSuburbColor(crimeRank);
    } else if(suburb.properties.type === 'lga') {
      // crimeRank = suburb.properties.mcr;
      fillColor = this.getSuburbColor(crimeRank);
    } else if(suburb.properties.type === 'state') {
      crimeRank = 80 + (crimeRank/6 * 20);
      fillColor = this.getAreaColor(crimeRank);
    } else {
      fillColor = this.getAreaColor(crimeRank);
    }
    return {
      stroke: suburb.properties.name === this.selectedSuburb,
      //color: 'rgb(255, 73, 23)',
      color: 'rgb(60, 60, 60)',
      opacity: 1,
      fillOpacity: 0.6,
      fillColor: fillColor,
      className: 'rr__map-layer ' + className
    };
  }


  highlightLayer(layer) {
    const suburb = layer.feature;

    layer.setStyle({
      stroke: true,
      //color: 'rgb(232, 73, 23)',
      color: 'rgb(60, 60, 60)',
      opacity: 1
    });
    if(!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }
    this.quickView.show(suburb);
    // updateHighlightedSuburb(suburb.properties.name);
  }

  mouseClickHandler(event) {
    if(Util.isMobileWidth()) {
      if(!event.layer.options.stroke) {
        this.highlightLayer(event.layer);
        return;
      }
    }
    const suburb = event.layer.feature;
    let urlCategory = 'states';
    if(suburb.properties.type === 'suburb') {
      urlCategory = 'suburbs';
    } else if(suburb.properties.type === 'lga') {
      urlCategory = 'lgas';
    }

    if(suburb.id !== undefined) window.open(`${this.baseProfilesUrl}/${urlCategory}/${suburb.properties.key}`, '_top');
  }

  mouseOverHandler(event, highlight = true) {
    if(Util.isMobileWidth()) return;
    if(highlight) this.highlightLayer(event.layer);
  }

  mouseOutHandler(event) {
    const layer = event.layer;
    const suburb = event.layer.feature;
    this.quickView.hide();

    if(suburb.properties.name === this.selectedSuburb) return;
    layer.setStyle({
      stroke: false
    });
  }
}
