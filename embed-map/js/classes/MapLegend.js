class MapLegend {
  constructor() {
    this.el = document.getElementById('legend');
    if(this.el === null) throw new Error('Legend element not found');
    const openBtn = this.el.querySelector('.Legend__open-btn');
    const closeBtn = this.el.querySelector('.Legend__close-btn');
    const content = this.el.querySelector('.Legend__content');

    openBtn.addEventListener('click', e => {
      content.classList.remove('Legend__el--hidden');
      openBtn.classList.add('Legend__el--hidden');
    });
    closeBtn.addEventListener('click', e => {
      content.classList.add('Legend__el--hidden');
      openBtn.classList.remove('Legend__el--hidden');
    });
  }
}
