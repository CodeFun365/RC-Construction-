// RC Construction: mobile menu and the estimate request form. No framework, no tracking.
(function () {
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.menu-toggle');
  if (toggle && header) {
    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.classList.contains('nav-open')) {
        header.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  // Estimate form: sends through Web3Forms (free). Until an access key is set in config.js,
  // it asks people to call or text instead of failing silently.
  var form = document.querySelector('form.lead-form');
  if (!form) return;
  var status = form.querySelector('.form-status');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var key = form.querySelector('input[name="access_key"]');
    if (!key || !key.value || key.value.indexOf('YOUR_') === 0) {
      status.className = 'form-status err';
      status.textContent = 'Our online form is being set up. Please call or text ' + form.dataset.phone + ' and we will get right back to you.';
      return;
    }
    var button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Sending…';
    fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.success) {
          form.reset();
          status.className = 'form-status ok';
          status.textContent = 'Thanks! Your request is in. We will call or text you soon.';
        } else {
          throw new Error(data.message || 'Something went wrong');
        }
      })
      .catch(function () {
        status.className = 'form-status err';
        status.textContent = 'Sorry, that did not send. Please call or text ' + form.dataset.phone + '.';
      })
      .finally(function () { button.disabled = false; button.textContent = 'Send my request'; });
  });
})();
