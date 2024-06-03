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
