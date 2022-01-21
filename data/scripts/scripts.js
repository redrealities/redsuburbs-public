(async function() {
  const startColor = {r: 46, g: 127, b: 24};
  const endColor = {r: 200, g: 37, b: 56};
  const map = L.map('map', {attributionControl: false}).setView([-27.4594, 153.0289], 12);
  const tStartColor = tinycolor('green');

  //L.control.attribution({prefix: '}).addTo(map);
  const attributionControl = L.control.attribution({prefix: '&copy; <a href="https://redrealities.com">RedRealities PTY LTD</a>'}).addTo(map);


  L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: ['a','b','c']
  }).addTo(map);



  const response = await fetch('data/suburbs-data.json');
  if(!response.ok) {
    alert('Failed to load suburbs data!');
    return;
  }

  const data = await response.json();
  const max_ratio = data.max_ratio;
  const median_ratio = data.median_ratio;
  const suburbs = data.suburbs;
  const suburb_names = Object.keys(suburbs);

  suburb_names.forEach(name => {
    const latlngs = suburbs[name].polygon.map(i => [i[1], i[0]]);
    const population = suburbs[name].population;
    const crime = suburbs[name].crime;
    const crime_ratio = suburbs[name].crime_ratio;
    //const color = getGradientColor(startColor, endColor, crime_ratio / max_ratio);
    let mult = 1;
    if(crime_ratio <= median_ratio) {
      mult = 0.5 * (crime_ratio / median_ratio);
    } else {
      mult = 0.5 + 0.5 * (crime_ratio / max_ratio);
    }
    const color = tStartColor.clone().spin(-120 * mult);
    const polygon = L.polygon(latlngs, {
      stroke: false,
      color: color.toHexString(), //`rgb(${color.r}, ${color.g}, ${color.b})`,
      fillOpacity: 0.6
    }).addTo(map);
    polygon.bindTooltip(`
      ${name}<br>
      Pops - ${population}<br>
      Crime - ${crime.total}<br>
      CR - ${crime_ratio.toFixed(2)}
    `);
    polygon.on('mouseover', () => polygon.setStyle({stroke: true}));
    polygon.on('mouseout', () => polygon.setStyle({stroke: false}));
  });


  function getGradientColor(startColor, endColor, position) {
    return {
      r: (endColor.r - startColor.r) * position + startColor.r,
      g: (endColor.g - startColor.g) * position + startColor.g,
      b: (endColor.b - startColor.b) * position + startColor.b,
    };
  }

  // const response = await fetch('data/suburbs-list.json');
  // if(!response.ok) {
  //   alert('Failed to load suburbs list');
  //   return;
  // }

  // const suburbs = await response.json();
  // //console.log(suburbs);
  // const requests = [];
  // suburbs.forEach(suburb => requests.push(async () => {
  //   const response = await fetch(`data/simple-polygons/${suburb}.json`);
  //   if(!response.ok) {
  //     console.error(`Failed to load polygon for ${suburb}`);
  //     return;
  //   }
  //   const data = await response.json();
  //   const latlngs = data.map(i => [i[1], i[0]]);

  //   const polygon = L.polygon(latlngs, {color: 'red'}).addTo(map);
  // }));

  // const batch_size = 10;
  // while(requests.length > 0) {
  //   const fn_batch = requests.splice(0, requests.length < batch_size ? requests.length : batch_size);
  //   const promise_batch = fn_batch.map(f => f());
  //   await Promise.all(promise_batch);
  // }

  //var polygon = L.polygon(latlngs, {color: 'red'}).addTo(map);
})();
