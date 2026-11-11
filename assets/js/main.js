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
      setTimeout(() => {
        stripes.forEach((s) => { s.style.transitionDelay = ''; });
        hero.classList.add('is-settled');
      }, 2600);
    }

    const keys = hero.querySelectorAll('[data-note]'); // white stripes + black keys

    /* Piano sound: real grand piano recordings (Salamander Grand Piano, CC BY 3.0,
       Alexander Holm) in assets/audio, one every 3 semitones; notes in between are
       pitch-shifted from the nearest one. Each stripe/black key has a MIDI note in
       data-note and plays it when clicked. Always on. */
    const AC = window.AudioContext || window.webkitAudioContext;
    let play = () => {};
    if (AC && window.fetch) {
      const SAMPLES = { 42: 'Fs2', 45: 'A2', 48: 'C3', 60: 'C4', 63: 'Ds4', 66: 'Fs4', 69: 'A4', 72: 'C5' };
      const buffers = {};
      let ctx = null;
      let loading = null;

      const load = () => {
        if (!ctx) ctx = new AC();
        if (!loading) {
          loading = Promise.all(Object.entries(SAMPLES).map(([midi, name]) =>
            fetch(`assets/audio/${name}.mp3`)
              .then((r) => r.arrayBuffer())
              .then((data) => new Promise((ok, fail) => ctx.decodeAudioData(data, ok, fail)))
              .then((buf) => { buffers[midi] = buf; })
              .catch(() => {})));
        }
        return loading;
      };
      const sound = (midi) => {
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();
        const base = Object.keys(buffers).map(Number)
          .reduce((best, m) => (best === null || Math.abs(m - midi) < Math.abs(best - midi) ? m : best), null);
        if (base === null) return;
        const src = ctx.createBufferSource();
        src.buffer = buffers[base];
        src.playbackRate.value = Math.pow(2, (midi - base) / 12);
        const gain = ctx.createGain();
        const t = ctx.currentTime;
        gain.gain.setValueAtTime(0.55, t);
        gain.gain.setTargetAtTime(0, t + 1.4, 0.5); // let it ring, then fade like a released key
        src.connect(gain).connect(ctx.destination);
        src.start(t);
        src.stop(t + 4);
      };
      play = (midi) => { load().then(() => sound(midi)); };
      setTimeout(load, 1200); // preload so the first note is instant
    }

    /* "Click me" hint that follows the mouse over the stripes, until the first click on this page. */
    const tip = hero.querySelector('.hero__tip');
    let clicked = false;
    if (tip && canHover && !clicked) {
      hero.querySelectorAll('.hero__stripes').forEach((area) => {
        area.addEventListener('pointermove', (e) => {
          if (clicked || e.pointerType !== 'mouse') return;
          tip.hidden = false;
          tip.style.transform = `translate(${e.clientX + 16}px, ${e.clientY + 18}px)`;
        });
        area.addEventListener('pointerleave', () => { tip.hidden = true; });
      });
    }

    // Pressing a stripe or black key: it sinks like a piano key and plays its note.
    // Holding and dragging across the keys plays each one in turn (a glissando).
    let current = null;
    let dragging = false;
    const press = (el) => {
      if (el === current) return;
      if (current) current.classList.remove('is-pressed');
      current = el;
      if (!el) return;
      el.classList.add('is-pressed');
      play(Number(el.dataset.note));
    };
    const keyAt = (x, y) => {
      const under = document.elementFromPoint(x, y);
      if (!under) return null;
      const key = under.closest('[data-note]');
      return key && hero.contains(key) ? key : null;
    };
    keys.forEach((el) => {
      el.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault(); // no text selection while dragging
        dragging = true;
        press(el);
        if (!clicked) {
          clicked = true;
          if (tip) tip.hidden = true;
        }
      });
    });
    document.addEventListener('pointermove', (e) => {
      if (dragging) press(keyAt(e.clientX, e.clientY));
    });
    const stop = () => { dragging = false; press(null); };
    document.addEventListener('pointerup', stop);
    document.addEventListener('pointercancel', stop);


    // Logo + menu icon slide in only once the bottom of the piano reaches the top of the screen.
    if (header) {
      const reveal = () => header.classList.toggle('is-in', hero.getBoundingClientRect().bottom <= 140); // a little before the piano fully leaves
      reveal();
      window.addEventListener('scroll', reveal, { passive: true });
      window.addEventListener('resize', reveal);
    }

    // "Scroll" cue: bring the menu bar to the top of the screen.
    const scrollCue = hero.querySelector('[data-scroll-to-menu]');
    if (scrollCue && header) {
      scrollCue.addEventListener('click', (e) => {
        e.preventDefault();
        const top = header.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: getComputedStyle(header).position === 'fixed' ? hero.offsetHeight : top, behavior: reduced ? 'auto' : 'smooth' });
      });
    }

  }

  /* Mobile menu */
  const toggle = document.querySelector('[data-menu-toggle]');
  if (toggle && header) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      header.classList.toggle('nav-open', open);
      document.body.classList.toggle('nav-open', open);
      const label = toggle.querySelector('.menu-toggle__label');
      if (label) label.textContent = open ? 'Close' : 'Menu';
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    // Clicking outside the menu (the dimmed page on desktop) closes it.
    document.addEventListener('click', (e) => {
      if (header.classList.contains('nav-open') && !e.target.closest('#site-nav') && !e.target.closest('[data-menu-toggle]')) setOpen(false);
    });
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
