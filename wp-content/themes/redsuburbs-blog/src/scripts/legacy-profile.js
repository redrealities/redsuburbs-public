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
(async function() {
  const ctxs = document.querySelectorAll('.SuburbProfilePage__trend-canvas');
  if(ctxs.length === 0) return;

  const printBtn = document.querySelector('.SuburbProfilePage__print-button');
  const compareBtn = document.querySelector('.SuburbProfilePage__compare-button');
  const saveBtn = document.querySelector('.SuburbProfilePage__save-button');

  let plusEntityData = null;
  if(rrAccount.premium) {
    console.log(`Requesting forecast data for the ${rrPageDetails.entityType} ${rrPageDetails.entityKey}`);
    // Requesting PLUS data
    plusEntityData = await rrAccount.apiReq(`/redsuburbs/plus-entity-profile/${rrPageDetails.entityType}s/${rrPageDetails.entityKey}`);

    const printStyles = document.createElement('link');
    printStyles.setAttribute('rel', 'stylesheet');
    printStyles.setAttribute('media', 'print');
    printStyles.setAttribute('href', `${PRO_URL}/wp-content/themes/redsuburbs-pro/src/styles/print-entity.css`);
    document.head.appendChild(printStyles);

    // Add print button
    if(printBtn !== null) {
      printBtn.addEventListener('click', () => window.print());
      compareBtn.addEventListener('click', () => {
        let compareEntities = JSON.parse(localStorage.getItem('compareEntities'));
        if(compareEntities === null) compareEntities = [];
        compareEntities.push({
          url: rrPageDetails.entityUrl,
          name: rrPageDetails.entityName,
          type: rrPageDetails.entityType,
          key: rrPageDetails.entityKey,
        });
        localStorage.setItem('compareEntities', JSON.stringify(compareEntities));
        window.location.href = '/compare';
      });
    }
    if(saveBtn !== null) {
      saveBtn.addEventListener('click', async () => {
        await rrAccount.saveLocation(saveBtn.dataset.name, saveBtn.dataset.type, saveBtn.dataset.key);
        alert('Location saved to your Saved Locations');
      });
    }
  } else {
    // FREE users
    printBtn.addEventListener('click', () => window.location.href = '/upgrade#feature-printable-profiles'); // or login
    compareBtn.addEventListener('click', () => window.location.href = '/upgrade#feature-side-by-side-compare'); // or login
    if(saveBtn !== null) saveBtn.addEventListener('click', () => window.location.href = '/upgrade#feature-saved-locations'); // or login
  }

  ctxs.forEach(ctx => {
    let data = total_crimes_trend_data;
    if(ctx.classList.contains('SuburbProfilePage__trend-canvas--violent')) {
      data = violent_crimes_trend_data;
    } else if(ctx.classList.contains('SuburbProfilePage__trend-canvas--property')) {
      data = property_crimes_trend_data;
    }

    if(plusEntityData !== null) {
      data['labels'].push(plusEntityData['forecast']['label']);
      data['datasets'][0]['data'].push(null);
      if(ctx.classList.contains('SuburbProfilePage__trend-canvas--total')) {
        data['datasets'][1]['data'].push(plusEntityData['forecast']['total']);
      } else if(ctx.classList.contains('SuburbProfilePage__trend-canvas--violent')) {
        data['datasets'][1]['data'].push(plusEntityData['forecast']['violent']);
      } else if(ctx.classList.contains('SuburbProfilePage__trend-canvas--property')) {
        data['datasets'][1]['data'].push(plusEntityData['forecast']['property']);
      }
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
