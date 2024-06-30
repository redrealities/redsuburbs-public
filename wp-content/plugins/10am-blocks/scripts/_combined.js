
/* === File: 0.utils.js === */
function nextAnimationFrame() {
  return new Promise(function(resolve, reject) {
    window.requestAnimationFrame(function() {
      window.requestAnimationFrame(resolve);
    });
  });
}

function timePassed(duration) {
  return new Promise(function(resolve, reject) {
    setTimeout(resolve, duration);
  });
}

function awaitEvent(target, eventName) {
  return new Promise(function(resolve, reject) {
    target.addEventListener(eventName, resolve, { once: true });
  });
}

function elementTransitionEnd(node) {
  return new Promise(function(resolve, reject) {
    node.addEventListener('transitionend', function() {
      resolve();
    }, { once: true });
  });
}

/* === File: accordion.js === */
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

/* === File: distance-estimator.js === */
(function(target) {
    const els = Array.from(target.querySelectorAll('.distance-estimator'));
    const handler = function() {
        const vh = window.innerHeight;
        els.forEach(function(el) {
            const rect = el.getBoundingClientRect();
            let v;
            let scale = Math.abs(-rect.height) + Math.abs(vh);
            if(rect.top >= vh) {
                v = 1;
            } else if(rect.top <= -rect.height) {
                v = 0;
            } else {
                let absTop = rect.top + (-rect.height) * -1;
                v = absTop / scale;
            }
            v = 1 - v;
            el.style.setProperty('--est-distance-mult', v);
            //console.log(rect.top, rect.bottom, v);
        });
    };
    window.distanceEstimatorHandler = handler;
    document.addEventListener('DOMContentLoaded', handler);
    target.addEventListener('scroll', handler);
})(document);

/* === File: menu.js === */
function init10amMenus() {
  const els = Array.from(document.querySelectorAll('._10am-menu'));
  els.forEach((el) => {
    const toggleBtn = el.querySelector('._10am-menu__toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        el.classList.toggle('_10am-menu--open');
      });
    }
  });
}

init10amMenus();

/* === File: slider.js === */
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

/* === File: visible-tag.js === */
(function() {
  let tags = [];

  function findVisibleTags(node) {
    return Array.from(node.querySelectorAll('.visible-tag'));
  }

  window.addVisibleTags = function(node) {
    tags = [...tags, ...findVisibleTags(node)];
  }

  window.addEventListener('load', function() {
    addVisibleTags(document);
    handler();
    window.addEventListener('scroll', handler);

    function handler() {
      // const viewStart = window.pageYOffset;
      // const viewEnd = window.pageYOffset + window.innerHeight;
      const viewHeight = window.innerHeight;

      tags.forEach(function(t) {
        const rect = t.getBoundingClientRect();
        const topPos = viewHeight - rect.top;
        const bottomPos = viewHeight - (rect.top + rect.height);
        //console.log(topPos, bottomPos);
        //console.log(topPos, bottomPos, videoHeight);
        if(topPos > viewHeight/4) {
          t.classList.add('visible-tag--visible');
        }

        let isOnScreen = topPos > viewHeight/4 && bottomPos < viewHeight/4;
        t.classList.toggle('visible-tag--on-screen', isOnScreen);
      });
    }
  });
})();
