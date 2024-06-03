async function init10amAccordions() {
  await nextAnimationFrame();
  const accordions = document.querySelectorAll('._10am-accordion');
  accordions.forEach(function(acc) {
    let items = acc.querySelectorAll('._10am-accordion__item');
    items.forEach(function(item) {
      // Calculate content height
      let title = item.querySelector('._10am-accordion__title');
      let content = item.querySelector('._10am-accordion__content');
      item.style.height = (title.offsetHeight + content.offsetHeight) + 'px';

      // Handle toggle click
      title.addEventListener('click', async function(e) {
        e.preventDefault();
        for(let i in Array.from(items)) {
          if(items[i].isSameNode(item))
            items[i].classList.toggle('_10am-accordion__item--active');
          else
            items[i].classList.remove('_10am-accordion__item--active');
        }
        await elementTransitionEnd(item);
      })
    })
  });
}

init10amAccordions();
