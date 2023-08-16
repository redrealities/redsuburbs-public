class QuickView {
  constructor() {
    this.el = document.getElementById('quick-view');
    if(this.el === null) throw new Error('QuickView element not found');
    this.parts = {
      crime_rank: this.el.querySelector('.val__crime-rank'),
      suburb_name: this.el.querySelector('.val__suburb-name'),
      suburb_pops: this.el.querySelector('.val__suburb-pops'),
      suburb_total_crimes: this.el.querySelector('.val__suburb-total-crimes'),
      suburb_crimes: this.el.querySelector('.SuburbQuickView__crimes')
    };
  }

  show(suburb) {
    this.el.classList.add('SuburbQuickView--visible');
    this.parts.crime_rank.innerHTML = suburb.properties.crime_rank + '/' + (suburb.properties.type === 'state' ? '6' : '100');
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
