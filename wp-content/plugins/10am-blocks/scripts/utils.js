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
