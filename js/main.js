/* ==========================================================
   Help Connect — Core UI Script (de-dupe safe)
   ========================================================== */
(function () {
  const body = document.body;
  const header = document.querySelector('.site-header');
  const nav = document.querySelector('.site-nav');
  if (!header || !nav) return;

  // De-dupe: remove extra toggles if they exist
  const toggles = header.querySelectorAll('.menu-toggle');
  if (toggles.length > 1) toggles.forEach((btn, i) => { if (i > 0) btn.remove(); });

  // Create toggle if missing
  let toggleBtn = header.querySelector('.menu-toggle');
  if (!toggleBtn) {
    toggleBtn = document.createElement('button');
    toggleBtn.className = 'menu-toggle';
    toggleBtn.setAttribute('aria-label', 'Toggle menu');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.innerHTML = '☰';
    header.insertBefore(toggleBtn, nav);
  }

  // Avoid double-binding: mark once
  if (!toggleBtn.dataset.bound) {
    toggleBtn.addEventListener('click', () => {
      const isOpen = body.classList.toggle('nav-open');
      toggleBtn.setAttribute('aria-expanded', String(isOpen));
    });

    nav.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' && body.classList.contains('nav-open')) {
        body.classList.remove('nav-open');
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
    });

    const onScroll = () => {
      if (window.scrollY > 4) header.classList.add('is-scrolled');
      else header.classList.remove('is-scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const mq = window.matchMedia('(min-width: 781px)');
    mq.addEventListener('change', () => {
      if (mq.matches && body.classList.contains('nav-open')) {
        body.classList.remove('nav-open');
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Prevent body scroll when nav is open (optional)
    const observer = new MutationObserver(() => {
      document.documentElement.style.overflow = body.classList.contains('nav-open') ? 'hidden' : '';
    });
    observer.observe(body, { attributes: true, attributeFilter: ['class'] });

    toggleBtn.dataset.bound = '1';
  }
})();
