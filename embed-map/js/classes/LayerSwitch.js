class LayerSwitch {
  constructor(layer, lens) {
    this.el = document.getElementById('layer-switch');
    if(this.el === null) throw new Error('Layer Switch element not found');
    this.shortDescriptionEl = this.el.querySelector('.LayerSwitch__toggle-val');
    this.lensNames = { cr: 'Rank', vr: 'Violent', pr: 'Property' };

    if(layer === 'auto' && lens === 'cr') {
      this.shortDescriptionEl.textContent = 'Auto';
    } else {
      this.shortDescriptionEl.textContent = `${layer} (${this.lensNames[lens]})`;
    }

    this.el.addEventListener('click', e => this.el.classList.toggle('LayerSwitch--active'));

    this.options = Array.from(this.el.querySelectorAll('.LayerSwitch__option-btn'));
    this.options.forEach(option => {
      if(option.dataset.option === 'layer') {
        option.classList.toggle('LayerSwitch__option-btn--active', option.dataset.value === layer);
      } else if(option.dataset.option === 'lens') {
        option.classList.toggle('LayerSwitch__option-btn--active', option.dataset.value === lens);
      }
      option.addEventListener('click', e => {
        console.log(option.dataset.option, option.dataset.value);
        const urlParams = new URLSearchParams(window.location.search);
        if(option.dataset.option === 'layer') {
          if(option.dataset.value === 'auto') {
            urlParams.delete('layer');
          }
          urlParams.set('layer', option.dataset.value);
        } else if(option.dataset.option === 'lens') {
          if(option.dataset.value === 'cr') {
            urlParams.delete('lens');
          }
          urlParams.set('lens', option.dataset.value);
        }
        window.location.search = urlParams.toString();
      });
    });
  }
}
