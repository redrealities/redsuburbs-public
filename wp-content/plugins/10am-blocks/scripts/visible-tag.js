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
