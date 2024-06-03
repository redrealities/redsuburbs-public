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
