(function() {
  const ctx = document.querySelector('.SuburbProfilePage__chart-canvas');
  if(ctx === null) return;

  new Chart(ctx, {
    type: 'doughnut',
    data: chart_data,
    options: {
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.label + ': ' + context.parsed + '%';
            }
          }
        }
      },
    },
  });
})();
(function() {
  const ctxs = document.querySelectorAll('.SuburbProfilePage__trend-canvas');
  if(ctxs.length === 0) return;

  ctxs.forEach(ctx => {
    let data = total_crimes_trend_data;
    if(ctx.classList.contains('SuburbProfilePage__trend-canvas--violent')) {
      data = violent_crimes_trend_data;
    } else if(ctx.classList.contains('SuburbProfilePage__trend-canvas--property')) {
      data = property_crimes_trend_data;
    }
    new Chart(ctx, {
      type: 'line',
      data: data,
      options: {
        responsive: true
      },
    });
  });
})();
