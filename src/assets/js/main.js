(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover)').matches;
  const header = document.querySelector('[data-header]');

  /* Stripe hover wave: slide the double-height gradient up, then let it fall back. */
  if (canHover && !reduced) {
    document.querySelectorAll('.stripe').forEach((stripe) => {
      const fill = stripe.querySelector('.stripe__fill');
      if (!fill) return;
      let timer;
      stripe.addEventListener('mouseenter', () => {
        fill.style.transform = 'translateY(-50%)';
        clearTimeout(timer);
        timer = setTimeout(() => { fill.style.transform = ''; }, 800);
      });
    });
  }

  /* Home hero */
  const hero = document.querySelector('[data-hero]');
  if (hero) {
    const stripes = hero.querySelectorAll('.hero__stripes .stripe');
    if (reduced) {
      hero.classList.add('is-ready');
    } else {
      stripes.forEach((s) => { s.style.transitionDelay = `${250 + 90 * Math.floor(Math.random() * 12)}ms`; });
      requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('is-ready')));
      // Clear the delays once the intro is done so hover/leave feel immediate.
      setTimeout(() => stripes.forEach((s) => { s.style.transitionDelay = ''; }), 2600);
    }

    // Clicking a stripe folds the hero into header height, then opens the page.
    hero.querySelectorAll('a.stripe').forEach((link) => {
      link.addEventListener('click', (e) => {
        if (reduced || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        const headerH = header ? header.offsetHeight : 76;
        window.scrollTo({ top: 0, behavior: 'instant' });
        hero.style.height = `${hero.offsetHeight}px`;
        hero.offsetHeight; // reflow
        hero.classList.add('is-leaving');
        document.body.classList.add('is-leaving');
        hero.style.height = `${headerH}px`;
        setTimeout(() => { window.location.href = link.href; }, 720);
      });
    });

    // Coming back with the browser's back button restores the hero.
    window.addEventListener('pageshow', (e) => {
      if (!e.persisted) return;
      hero.classList.remove('is-leaving');
      document.body.classList.remove('is-leaving');
      hero.style.height = '';
    });

    // Show the compact stripe header once the hero is out of view.
    if (header && 'IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        header.classList.toggle('is-visible', !entry.isIntersecting);
      }, { rootMargin: '-80px 0px 0px 0px' }).observe(hero);
    }
  }

  /* Mobile menu */
  const toggle = document.querySelector('[data-menu-toggle]');
  if (toggle && header) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      header.classList.toggle('nav-open', open);
      document.body.classList.toggle('nav-open', open);
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  }

  /* Reveal on scroll */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length && 'IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  /* Resources filter */
  const filters = document.querySelector('[data-filters]');
  if (filters) {
    const posts = document.querySelectorAll('[data-category]');
    filters.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      filters.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      const cat = btn.dataset.filter;
      posts.forEach((p) => { p.hidden = cat !== 'all' && p.dataset.category !== cat; });
    });
  }

  /* Contact form — no backend chosen yet (see README). */
  const form = document.querySelector('[data-contact-form]');
  if (form) {
    form.addEventListener('submit', (e) => {
      if (form.getAttribute('action')) return; // once an endpoint is set, submit normally
      e.preventDefault();
      const status = form.querySelector('.form__status');
      status.hidden = false;
      status.textContent = 'Thank you! This form is not connected yet — it will be activated before launch.';
    });
  }
})();
