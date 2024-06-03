async function init10amSliders() {
  const sliders = document.querySelectorAll('._10am-slider');
  sliders.forEach((slider) => {
    const items = Array.from(slider.children[0].children).filter(c => c.classList.contains('_10am-div'));
    if(items.length === 0) return;
    slider.classList.add('_10am-slider--loaded');
    items[0].classList.add('_10am-slider__item--active');

    if('autoChangeSpeed' in slider.dataset) {
      const speed = parseInt(slider.dataset.autoChangeSpeed);
      if(speed > 0) setInterval(() => changeActiveSlide(+1), speed * 1000);
    }

    const arrowControls = slider.querySelector('._10am-slider__arrow-controls');
    if(arrowControls) {
      arrowControls.children[0].addEventListener('click', () => changeActiveSlide(-1));
      arrowControls.children[1].addEventListener('click', () => changeActiveSlide(+1));
    }

    function changeActiveSlide(delta, loop = true) {
      const activeIndex = items.findIndex(i => i.classList.contains('_10am-slider__item--active'));
      const previusItem = items.find(i => i.classList.contains('_10am-slider__item--previous'));
      if(previusItem) previusItem.classList.remove('_10am-slider__item--previous');

      let newIndex = activeIndex + delta;
      if(newIndex < 0) newIndex = loop ? items.length - 1 : 0;
      if(newIndex >= items.length) newIndex = loop ? 0 : items.length - 1;
      items[activeIndex].classList.add('_10am-slider__item--previous');
      items[activeIndex].classList.remove('_10am-slider__item--active');
      items[newIndex].classList.add('_10am-slider__item--active');
    }
  });
}
init10amSliders();
