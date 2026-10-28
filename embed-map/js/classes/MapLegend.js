class MapLegend {
  constructor() {
    this.el = document.getElementById('legend');
    if(this.el === null) throw new Error('Legend element not found');
    this.openBtn = this.el.querySelector('.Legend__open-btn');
    this.content = this.el.querySelector('.Legend__content');
    const closeBtn = this.el.querySelector('.Legend__close-btn');

    this.openBtn.addEventListener('click', e => this.open());
    closeBtn.addEventListener('click', e => this.close());
    // Delegated, Leaflet re-renders the attribution control
    document.addEventListener('click', e => {
      if(!e.target.closest('.Legend__sources-link')) return;
      e.preventDefault();
      this.open();
    });
  }

  open() {
    this.content.classList.remove('Legend__el--hidden');
    this.openBtn.classList.add('Legend__el--hidden');
  }

  close() {
    this.content.classList.add('Legend__el--hidden');
    this.openBtn.classList.remove('Legend__el--hidden');
  }
}
