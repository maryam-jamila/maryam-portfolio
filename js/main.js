/* ========================================================================
   MARYAM JAMILA — shared site behavior
   ======================================================================== */

(() => {
  function setupReveal() {
    const revealEls = document.querySelectorAll('.reveal:not([data-reveal-ready])');
    if (!revealEls.length) return;

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            entry.target.removeAttribute('data-reveal-ready');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

      revealEls.forEach(el => {
        el.setAttribute('data-reveal-ready', 'true');
        io.observe(el);
      });
    } else {
      revealEls.forEach(el => el.classList.add('in-view'));
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('.site-nav');
    const onScroll = () => {
      if (!nav) return;
      nav.classList.toggle('scrolled', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const toggle = document.querySelector('.nav-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    if (toggle && mobileMenu) {
      toggle.addEventListener('click', () => {
        toggle.classList.toggle('open');
        mobileMenu.classList.toggle('open');
        document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
      });
      mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          toggle.classList.remove('open');
          mobileMenu.classList.remove('open');
          document.body.style.overflow = '';
        });
      });
    }

    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === current || (current === '' && href === 'index.html')) link.classList.add('active');
    });

    setupReveal();
  });

  document.addEventListener('site-rendered', setupReveal);
})();
