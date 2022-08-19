
/* === File: landing-prime.js === */
(function() {
  serverless_mailer.setup({
    apiUrl: 'https://gblslv2ixl5amw6z2bexp3mjcq0hnahs.lambda-url.us-east-1.on.aws/'
  });
  const forms = Array.from(document.querySelectorAll('.serverless-submit__box'));
  forms.forEach(form => {
    const successEl = form.querySelector('.serverless-submit__success');
    const errorEl = form.querySelector('.serverless-submit__error');
    serverless_mailer.handleForm(
      form,
      'Crime API landing page message',
      () => successEl.textContent = 'We\'ll be in touch soon',
      error => errorEl.textContent = error
    );
  });
})();
