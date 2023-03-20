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
