(function() {
  const sidebar = document.querySelector('.Sidebar__container');
  const sidebarToggle = document.querySelector('.Sidebar__open-trigger');
  const sidebarClose = Array.from(document.querySelectorAll('.Sidebar__close-btn, .Sidebar__close-trigger'));

  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.add('Sidebar__container--active');
  });

  sidebarClose.forEach(i => i.addEventListener('click', () => {
    sidebar.classList.remove('Sidebar__container--active');
  }));
})();
