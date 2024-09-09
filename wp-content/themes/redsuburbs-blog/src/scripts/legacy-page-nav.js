(function() {
  // find all page nav anchors
  const anchors = Array.from(document.querySelectorAll('.Page__navigation-anchor'));
  // find all page nav links
  const links = Array.from(document.querySelectorAll('.Page__navigation-item'));
  const scrollHandler = () => {
    // get current scroll position
    const scrollPosition = window.scrollY;
    console.log(scrollPosition);
    // get current anchor
    let currentAnchor = null;
    anchors.forEach(anchor => {
      if(scrollPosition > anchor.offsetTop - 65) currentAnchor = anchor; // adjusted for header height
    });
    if(currentAnchor === null) {
      links.forEach(link => link.classList.remove('Page__navigation-item--active'));
    } else {
      // adjust active class on all all links
      links.forEach(
        link => link.classList.toggle('Page__navigation-item--active',
          link.dataset.target === currentAnchor.id)
      );
    }
  };
  // track scroll position
  window.addEventListener('scroll', scrollHandler);
  window.addEventListener('hashchange', scrollHandler);
  scrollHandler();
})();
