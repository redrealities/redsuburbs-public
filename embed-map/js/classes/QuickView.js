class QuickView {
  constructor(lens) {
    this.el = document.getElementById('quick-view');
    if(this.el === null) throw new Error('QuickView element not found');
    this.lens = lens;
    this.parts = {
      crime_type: this.el.querySelector('.val__crime-type'),
      crime_rank: this.el.querySelector('.val__crime-rank'),
      suburb_name: this.el.querySelector('.val__suburb-name'),
      suburb_pops: this.el.querySelector('.val__suburb-pops'),
      suburb_total_crimes: this.el.querySelector('.val__suburb-total-crimes'),
      suburb_crime_rate: this.el.querySelector('.val__suburb-crime-rate'),
      suburb_crimes: this.el.querySelector('.SuburbQuickView__crimes'),
      suburb_rates: this.el.querySelector('.SuburbQuickView__rates')
    };
  }

  show(suburb) {
    this.el.classList.add('SuburbQuickView--visible');
    let crimeRank = suburb.properties.crime_rank;
    if(this.lens === 'cr') {
      this.parts.crime_type.textContent = 'Crime Rank';
    } else if(this.lens === 'vr') {
      this.parts.crime_type.textContent = 'Violent Crimes Rank';
      crimeRank = suburb.properties.violent_rank;
    } else if(this.lens === 'pr') {
      this.parts.crime_type.textContent = 'Property Crimes Rank';
      crimeRank = suburb.properties.property_rank;
    }
    const pops = suburb.properties.population;
    const crime = suburb.properties.crime;
    const crime_rate = pops < 1 ? 0 : crime['total'] / (pops / 1000);
    let property_crimes_number = 0;
    let violent_crimes_number = 0;
    for(let crime_type in crime) {
      if(crime_type === 'total') continue;
      if(PROPERTY_CRIME_TYPES.includes(crime_type)) {
        property_crimes_number += crime[crime_type];
      } else if(VIOLENT_CRIME_TYPES.includes(crime_type)) {
        violent_crimes_number += crime[crime_type];
      }
    }
    const property_crime_rate = pops < 1 ? 0 : property_crimes_number / (pops / 1000);
    const violent_crime_rate = pops < 1 ? 0 : violent_crimes_number / (pops / 1000);

    this.parts.crime_rank.innerHTML = crimeRank + '/' + (suburb.properties.type === 'state' ? '6' : '100');
    this.parts.suburb_name.innerHTML = suburb.properties.name;
    this.parts.suburb_pops.innerHTML = pops.toLocaleString();
    this.parts.suburb_total_crimes.innerHTML = crime['total'].toLocaleString();
    this.parts.suburb_crime_rate.innerHTML = crime_rate.toFixed(2);

    this.parts.suburb_rates.innerHTML = `
    <div class="SuburbQuickView__crime">
      <div class="SuburbQuickView__crime-name">Violent Crimes</div>
      <div class="SuburbQuickView__crime-value">${violent_crime_rate.toLocaleString()}</div>
    </div>
    <div class="SuburbQuickView__crime">
      <div class="SuburbQuickView__crime-name">Property Crimes</div>
      <div class="SuburbQuickView__crime-value">${property_crime_rate.toLocaleString()}</div>
    </div>
    `;

    this.parts.suburb_crimes.innerHTML = '';
    Object.keys(crime)
      .filter(c => c !== 'total')
      .sort((a, b) => crime[b] - crime[a])
      .slice(0, 5)
      .forEach(crime_type => {
        const crimeEl = document.createElement('div');
        crimeEl.classList.add('SuburbQuickView__crime');
        crimeEl.innerHTML = `<div class="SuburbQuickView__crime-name">${crime_type}</div><div class="SuburbQuickView__crime-val">${crime[crime_type].toLocaleString()}</div>`;
        this.parts.suburb_crimes.appendChild(crimeEl);
      });
  }

  hide() {
    this.el.classList.remove('SuburbQuickView--visible');
  }
}
