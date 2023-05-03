(function() {
  const form = document.querySelector('.feedback-form');
  if(form === null) return;
  const featureField = form.querySelector('input[name="Feature"]');

  serverless_mailer.setup({
    apiUrl: 'https://gblslv2ixl5amw6z2bexp3mjcq0hnahs.lambda-url.us-east-1.on.aws/'
  });

  const closeBtns = document.querySelectorAll('.feedback-form__close-btn');
  closeBtns.forEach(btn => btn.addEventListener('click', () => form.classList.remove('feedback-form--visible')));

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.addEventListener('click', () => form.classList.remove('feedback-form--visible'));

  serverless_mailer.handleForm(
    form,
    'RedSuburbs feedback popup',
    () => {
      form.classList.remove('feedback-form--visible');
      alert('Thanks for your feedback!');
    },
    error => alert(`Error submitting feedback: ${error}`)
  );

  function askFeedback(feature) {
    const placeholders = form.querySelectorAll('.feedback-form__placeholder');
    placeholders.forEach(el => el.dataset.value = feature);
    featureField.value = feature;
    form.classList.add('feedback-form--visible');
    localStorage.setItem('last-feedback-asked', new Date());
  }
  window.askFeedback = askFeedback;

  // askFeedback('Suburb Profile');

  // User feedback conditions
  // User has been using website for at least 24 hours
  if(localStorage.getItem('first_visit') !== null) {
    const first_visit = new Date(localStorage.getItem('first_visit'));
    const now = new Date();
    const daysSinceFirstVisit = Math.floor((now - first_visit) / (1000 * 60 * 60 * 24));
    if(daysSinceFirstVisit < 1) return;
  } else {
    localStorage.setItem('first_visit', new Date());
    return;
  }
  // User feedback wasn't asked for at least 60 days
  if(localStorage.getItem('last-feedback-asked') !== null) {
    const lastAsked = new Date(localStorage.getItem('last-feedback-asked'));
    const now = new Date();
    const daysSinceLastAsked = (now - lastAsked) / (1000 * 60 * 60 * 24);
    if(daysSinceLastAsked < 60) return;
  }

  let asked = false;
  const featureName = 'feedbackFeatureName' in window ? window.feedbackFeatureName : 'Red Suburbs';

  // Asking after usage for 15 minutes
  setTimeout(() => {
    if(asked) return;
    asked = true;
    askFeedback(featureName);
  }, 15*1000);
  // Or after scrolled to the bottom of the page
  window.addEventListener('scroll', () => {
    if(window.scrollY + window.innerHeight < document.body.scrollHeight - 400) return;
    if(asked) return;
    asked = true;
    askFeedback(featureName);
  });

})();
