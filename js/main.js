/* ==========================================================
   Help Connect — Core UI Script
   ----------------------------------------------------------
   Features:
   - Mobile nav toggle (adds/removes .nav-open on <body>)
   - Header shadow on scroll (.is-scrolled on .site-header)
   - Auto-close nav when clicking a link (mobile)
   - Auto-close when resizing back to desktop
   ========================================================== */

(function () {
  const body = document.body;
  const header = document.querySelector('.site-header');
  const nav = document.querySelector('.site-nav');
  if (!header || !nav) return;

  // --- 1) Create mobile menu toggle button ---
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'menu-toggle';
  toggleBtn.setAttribute('aria-label', 'Toggle menu');
  toggleBtn.setAttribute('aria-expanded', 'false');
  toggleBtn.innerHTML = '☰';
  header.insertBefore(toggleBtn, nav);

  // Toggle open/close
  toggleBtn.addEventListener('click', () => {
    const isOpen = body.classList.toggle('nav-open');
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
  });

  // --- 2) Close nav when a link is clicked (mobile only) ---
  nav.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' && body.classList.contains('nav-open')) {
      body.classList.remove('nav-open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // --- 3) Header shadow on scroll ---
  const onScroll = () => {
    if (window.scrollY > 4) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // Run once on load

  // --- 4) Close mobile nav when resizing to desktop ---
  const mq = window.matchMedia('(min-width: 781px)');
  mq.addEventListener('change', () => {
    if (mq.matches && body.classList.contains('nav-open')) {
      body.classList.remove('nav-open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // --- 5) Optional animation class for fade/slide ---
  // Adds small delay for smoother nav opening if you style it in CSS
  const observer = new MutationObserver(() => {
    if (body.classList.contains('nav-open')) {
      document.documentElement.style.overflow = 'hidden'; // prevent body scroll
    } else {
      document.documentElement.style.overflow = '';
    }
  });
  observer.observe(body, { attributes: true, attributeFilter: ['class'] });
})();
