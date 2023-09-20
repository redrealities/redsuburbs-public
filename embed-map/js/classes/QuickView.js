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
      suburb_crimes: this.el.querySelector('.SuburbQuickView__crimes')
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
    this.parts.crime_rank.innerHTML = crimeRank + '/' + (suburb.properties.type === 'state' ? '6' : '100');
    this.parts.suburb_name.innerHTML = suburb.properties.name;
    this.parts.suburb_pops.innerHTML = suburb.properties.population.toLocaleString();
    this.parts.suburb_total_crimes.innerHTML = suburb.properties.crime['total'].toLocaleString();
    this.parts.suburb_crimes.innerHTML = '';
    const crime = suburb.properties.crime;
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
