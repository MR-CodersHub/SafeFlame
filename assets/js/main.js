/* ============================================================
   SafeFlame — shared interactions (Vanilla JS / ES6)
   ============================================================ */
(() => {
  'use strict';

  document.documentElement.classList.add('js');

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const store = {
    get(k, d) { try { return localStorage.getItem(k) || d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } }
  };

  /* ---------- Toast ---------- */
  function toast(message, type = 'success') {
    let stack = $('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      stack.setAttribute('role', 'status');
      stack.setAttribute('aria-live', 'polite');
      document.body.appendChild(stack);
    }
    const el = document.createElement('div');
    el.className = `toast ${type === 'error' ? 'error' : ''}`;
    el.innerHTML = `${type === 'error'
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v5m0 3h.01"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/></svg>'}<span></span>`;
    $('span', el).textContent = message;
    stack.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 480);
    }, 4000);
  }

  /* ---------- Theme + direction ---------- */
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const btn = $('[data-theme-toggle]');
    if (btn) btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
  function applyDir(dir) {
    document.documentElement.dir = dir;
    const btn = $('[data-dir-toggle]');
    if (btn) {
      btn.setAttribute('aria-label', dir === 'rtl' ? 'Switch to LTR layout' : 'Switch to RTL layout');
      const label = $('span', btn);
      if (label) label.textContent = dir === 'rtl' ? 'LTR' : 'RTL';
    }
  }
  applyTheme(store.get('sf-theme', 'light'));
  applyDir(store.get('sf-dir', 'ltr'));

  $$('[data-theme-toggle]').forEach(btn => btn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    store.set('sf-theme', next);
  }));
  $$('[data-dir-toggle]').forEach(btn => btn.addEventListener('click', () => {
    const next = document.documentElement.dir === 'rtl' ? 'ltr' : 'rtl';
    applyDir(next);
    store.set('sf-dir', next);
  }));

  /* ---------- Header / back to top ---------- */
  const header = $('.site-header');
  const toTop = $('.to-top');
  const quickCall = $('.quick-call');
  function onScroll() {
    const y = window.scrollY;
    header?.classList.toggle('scrolled', y > 12);
    toTop?.classList.toggle('show', y > 420);
    quickCall?.classList.toggle('show', y > 420);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- Mobile navigation ---------- */
  const mobileNav = $('.mobile-nav');
  const openNav = () => { mobileNav?.classList.add('open'); mobileNav?.setAttribute('aria-hidden', 'false'); document.body.classList.add('nav-open'); };
  const closeNav = () => { mobileNav?.classList.remove('open'); mobileNav?.setAttribute('aria-hidden', 'true'); document.body.classList.remove('nav-open'); };
  $$('[data-nav-open]').forEach(b => b.addEventListener('click', openNav));
  $$('[data-nav-close]').forEach(b => b.addEventListener('click', closeNav));
  mobileNav?.addEventListener('click', e => { if (e.target === mobileNav) closeNav(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeNav(); closeProfile(); } });
  $$('.mobile-panel nav a').forEach(a => a.addEventListener('click', closeNav));

  /* ---------- Profile menu ---------- */
  const profileWrap = $('.profile-wrap');
  const profileBtn = $('[data-profile-toggle]');
  const closeProfile = () => { profileWrap?.classList.remove('open'); profileBtn?.setAttribute('aria-expanded', 'false'); };
  profileBtn?.addEventListener('click', e => {
    e.stopPropagation();
    const open = profileWrap.classList.toggle('open');
    profileBtn.setAttribute('aria-expanded', String(open));
  });
  $$('.profile-menu a').forEach(a => a.addEventListener('click', closeProfile));
  document.addEventListener('click', e => { if (profileWrap && !profileWrap.contains(e.target)) closeProfile(); });

  /* ---------- Hero slider ---------- */
  const slides = $$('.hero-slide');
  if (slides.length) {
    let index = 0;
    let timer;
    const dots = $$('.hero-dot');
    const show = (i) => {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, n) => {
        const active = n === index;
        s.classList.toggle('active', active);
        s.setAttribute('aria-hidden', String(!active));
      });
      dots.forEach((d, n) => {
        const active = n === index;
        d.classList.toggle('active', active);
        d.setAttribute('aria-selected', String(active));
      });
    };
    const start = () => { timer = setInterval(() => show(index + 1), 6500); };
    const stop = () => clearInterval(timer);
    dots.forEach((d, i) => d.addEventListener('click', () => { show(i); stop(); start(); }));
    $('[data-slide-prev]')?.addEventListener('click', () => { show(index - 1); stop(); start(); });
    $('[data-slide-next]')?.addEventListener('click', () => { show(index + 1); stop(); start(); });
    const hero = $('.hero');
    hero?.addEventListener('mouseenter', stop);
    hero?.addEventListener('mouseleave', start);
    let touchX = 0;
    hero?.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
    hero?.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) { show(index + (dx < 0 ? 1 : -1)); stop(); start(); }
    }, { passive: true });
    show(0);
    start();
  }

  /* ---------- Scroll reveal ---------- */
  const revealItems = $$('.wow');
  if ('IntersectionObserver' in window && revealItems.length) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('in'); obs.unobserve(entry.target); }
      });
    }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    revealItems.forEach(el => obs.observe(el));
  } else {
    revealItems.forEach(el => el.classList.add('in'));
  }

  /* ---------- Animated counters ---------- */
  const counters = $$('[data-count]');
  if (counters.length) {
    const run = (el) => {
      const target = Number(el.dataset.count);
      const dur = 1600;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString();
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if ('IntersectionObserver' in window) {
      const cObs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { run(e.target); cObs.unobserve(e.target); } });
      }, { threshold: .4 });
      counters.forEach(el => cObs.observe(el));
    } else counters.forEach(run);
  }

  /* ---------- FAQ accordion ---------- */
  $$('.faq-item .faq-q').forEach(btn => btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    $$('.faq-item').forEach(i => { i.classList.remove('open'); $('.faq-q', i)?.setAttribute('aria-expanded', 'false'); });
    if (!isOpen) { item.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
  }));

  /* ---------- Product / resource filters ---------- */
  $$('[data-filter-group]').forEach(group => {
    const name = group.dataset.filterGroup;
    const items = $$(`[data-filter-item="${name}"]`);
    const tabs = $$(`[data-filter-tab="${name}"]`, group);
    const search = $(`[data-filter-search="${name}"]`);
    const empty = $(`[data-empty="${name}"]`);
    const apply = () => {
      const active = $('[data-filter-tab].active', group)?.dataset.value || 'all';
      const term = (search?.value || '').trim().toLowerCase();
      let visible = 0;
      items.forEach(item => {
        const cat = item.dataset.category || '';
        const text = item.textContent.toLowerCase();
        const okCat = active === 'all' || cat.split(' ').includes(active);
        const okText = !term || text.includes(term);
        item.classList.toggle('hide', !(okCat && okText));
        if (okCat && okText) visible++;
      });
      if (empty) empty.classList.toggle('show', visible === 0);
    };
    tabs.forEach(tab => tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      apply();
    }));
    search?.addEventListener('input', apply);
  });

  /* ---------- Simple tab panels ---------- */
  $$('[data-tabset]').forEach(set => {
    const tabs = $$('[data-tab]', set);
    const panels = $$('[data-panel]', set);
    tabs.forEach(tab => tab.addEventListener('click', () => {
      const key = tab.dataset.tab;
      tabs.forEach(t => t.classList.toggle('active', t === tab));
      panels.forEach(p => p.classList.toggle('hide', p.dataset.panel !== key));
    }));
  });

  /* ---------- Pricing toggle ---------- */
  $$('[data-billing]').forEach(sw => sw.addEventListener('click', () => {
    const yearly = sw.classList.toggle('on');
    sw.setAttribute('aria-pressed', String(yearly));
    $$('[data-price-monthly]').forEach(el => { el.textContent = yearly ? el.dataset.priceYearly : el.dataset.priceMonthly; });
    $$('[data-price-cycle]').forEach(el => { el.textContent = yearly ? '/mo, billed yearly' : '/month'; });
    toast(yearly ? 'Yearly pricing applied — save 20%' : 'Monthly pricing applied');
  }));

  /* ---------- Product gallery ---------- */
  const galleryMain = $('.gallery-main img');
  $$('.gallery-thumbs img').forEach(thumb => thumb.addEventListener('click', () => {
    if (!galleryMain) return;
    galleryMain.src = thumb.src.replace(/w=\d+/, 'w=1200');
    galleryMain.alt = thumb.alt;
    $$('.gallery-thumbs img').forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
  }));

  /* ---------- Forms ---------- */
  function setError(field, msg) {
    field.classList.add('invalid');
    const el = $('.error-msg', field);
    if (el) el.textContent = msg;
  }
  function clearError(field) {
    field.classList.remove('invalid');
    const el = $('.error-msg', field);
    if (el) el.textContent = '';
  }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  $$('form[data-validate]').forEach(form => {
    $$('input, select, textarea', form).forEach(control => {
      control.addEventListener('input', () => {
        const f = control.closest('.field');
        if (f) clearError(f);
      });
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      let ok = true;
      let firstBad = null;
      $$('[data-required]', form).forEach(control => {
        const field = control.closest('.field');
        const value = (control.value || '').trim();
        clearError(field);
        if (!value) { setError(field, 'This field is required.'); ok = false; firstBad = firstBad || control; return; }
        if (control.type === 'email' && !emailRe.test(value)) { setError(field, 'Enter a valid email address.'); ok = false; firstBad = firstBad || control; return; }
        if (control.dataset.phone === 'true' && !/^[+\d][\d\s().-]{6,}$/.test(value)) { setError(field, 'Enter a valid phone number.'); ok = false; firstBad = firstBad || control; return; }
        if (control.minLength && value.length < Number(control.minLength)) {
          setError(field, `Please enter at least ${control.minLength} characters.`); ok = false; firstBad = firstBad || control;
        }
      });
      const consent = $('[data-consent]', form);
      if (consent && !consent.checked) {
        setError(consent.closest('.field') || consent.parentElement, 'Please accept the terms to continue.');
        ok = false;
      }
      if (!ok) {
        firstBad?.focus();
        toast('Please check the highlighted fields.', 'error');
        return;
      }
      const btn = $('button[type="submit"]', form);
      if (btn) {
        btn.disabled = true;
        const old = btn.innerHTML;
        btn.innerHTML = 'Sending…';
        setTimeout(() => {
          btn.disabled = false;
          btn.innerHTML = old;
          form.reset();
          toast(form.dataset.success || 'Thank you. We will be in touch shortly.');
        }, 850);
      }
    });
  });

  /* ---------- Newsletter ---------- */
  $$('form[data-newsletter]').forEach(form => form.addEventListener('submit', e => {
    e.preventDefault();
    const input = $('input', form);
    if (!emailRe.test(input.value.trim())) { toast('Please enter a valid email address.', 'error'); input.focus(); return; }
    form.reset();
    toast('You are subscribed to SafeFlame insights.');
  }));

  /* ---------- Standalone authentication ---------- */
  $$('[data-password-toggle]').forEach(btn => btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.passwordToggle);
    if (!input) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.classList.toggle('is-visible', show);
    btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    btn.setAttribute('aria-pressed', String(show));
    input.focus();
  }));

  $$('form[data-demo-auth]').forEach(form => {
    $$('input', form).forEach(control => control.addEventListener('input', () => {
      const field = control.closest('.field');
      if (field) clearError(field);
    }));
    form.addEventListener('submit', e => {
      e.preventDefault();
      let ok = true;
      let firstBad = null;
      $$('[data-required]', form).forEach(c => {
        const f = c.closest('.field');
        clearError(f);
        const v = (c.value || '').trim();
        if (!v) { setError(f, 'This field is required.'); ok = false; firstBad = firstBad || c; return; }
        if (c.type === 'email' && !emailRe.test(v)) { setError(f, 'Enter a valid email address.'); ok = false; firstBad = firstBad || c; return; }
        if (c.dataset.phone === 'true' && !/^[+\d][\d\s().-]{6,}$/.test(v)) { setError(f, 'Enter a valid phone number.'); ok = false; firstBad = firstBad || c; return; }
        if (c.minLength && v.length < Number(c.minLength)) { setError(f, `Use at least ${c.minLength} characters.`); ok = false; firstBad = firstBad || c; }
      });
      const pass = $('[data-password]', form);
      const confirm = $('[data-confirm-password]', form);
      if (pass && confirm && confirm.value && pass.value !== confirm.value) {
        setError(confirm.closest('.field'), 'Passwords do not match.');
        ok = false; firstBad = firstBad || confirm;
      }
      const consent = $('[data-consent]', form);
      if (consent && !consent.checked) {
        setError(consent.closest('.field') || consent.parentElement, 'Please accept the terms to continue.');
        ok = false; firstBad = firstBad || consent;
      }
      if (!ok) { firstBad?.focus(); toast('Please check the highlighted fields.', 'error'); return; }
      const btn = $('button[type="submit"]', form);
      if (btn) { btn.disabled = true; btn.textContent = 'Please wait…'; }
      const signup = form.dataset.demoAuth === 'signup';
      toast(signup ? 'Demo account created. Redirecting to sign in.' : 'Demo sign-in complete. Redirecting to the homepage.');
      setTimeout(() => { location.href = form.dataset.redirect || (signup ? 'login.html' : 'index.html'); }, 1100);
    });
  });

  /* ---------- Maintenance countdown ---------- */
  const cd = $('[data-countdown]');
  if (cd) {
    const target = new Date(cd.dataset.countdown).getTime();
    const parts = { days: $('[data-cd="days"]'), hours: $('[data-cd="hours"]'), minutes: $('[data-cd="minutes"]'), seconds: $('[data-cd="seconds"]') };
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      const d = Math.floor(diff / 86400000);
      const h = Math.floor(diff / 3600000) % 24;
      const m = Math.floor(diff / 60000) % 60;
      const s = Math.floor(diff / 1000) % 60;
      if (parts.days) parts.days.textContent = String(d).padStart(2, '0');
      if (parts.hours) parts.hours.textContent = String(h).padStart(2, '0');
      if (parts.minutes) parts.minutes.textContent = String(m).padStart(2, '0');
      if (parts.seconds) parts.seconds.textContent = String(s).padStart(2, '0');
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- 404 quick search ---------- */
  const errSearch = $('[data-error-search]');
  errSearch?.addEventListener('submit', e => {
    e.preventDefault();
    const q = $('input', errSearch).value.trim();
    if (!q) { toast('Type a page or keyword to search.', 'error'); return; }
    toast(`No results for “${q}”. Try our main navigation.`);
    errSearch.reset();
  });

  if ($('[data-detail-page]')) {
    const photo = (id, w) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
    const featureSets = {
      extinguisher: [
        ['Certified agent', 'Listed extinguishing media with clear class ratings and batch traceability.'],
        ['Clear labelling', 'Colour-coded instruction panels make operation obvious under pressure.'],
        ['Service-ready', 'Compatible with scheduled inspection, refill and hydrostatic test programmes.']
      ],
      detection: [
        ['Fast identification', 'Devices report precise location and type to speed up response.'],
        ['Drift monitoring', 'Continuous baseline checks flag contamination before false alarms occur.'],
        ['Audit-ready records', 'Test and event history exports straight into compliance files.']
      ],
      suppression: [
        ['Complete assembly', 'Valve, gauge and test drains supplied as a matched, documented set.'],
        ['Monitored signals', 'Pressure and flow supervision alerts the panel before a fault becomes silent.'],
        ['Service access', 'Layout keeps isolation and test points reachable without a system shutdown.']
      ],
      egress: [
        ['Uniform luminance', 'LED optics deliver even illumination with no dark spots or glare.'],
        ['3-hour duration', 'Maintained operation through the required emergency period.'],
        ['Flexible mounting', 'Wall and ceiling options suit corridors, stairwells and doorways.']
      ],
      panel: [
        ['Automatic device mapping', 'Devices are discovered and labelled during commissioning, eliminating manual address errors.'],
        ['Drift compensation', 'Continuous sensor baseline monitoring flags contamination before a false alarm occurs.'],
        ['Audit-ready logs', 'Every event, test and access action is timestamped and exportable for compliance files.']
      ]
    };
    const catalog = {
      'guardian-x2': { name: 'Guardian X2', accent: 'Addressable Fire Panel', category: 'panel', summary: 'Two-loop detection control with device-level diagnostics, mapped cause-and-effect logic and secure remote engineer access.', price: '$2,450', image: '3958649', gallery: ['3958649', '39183052', '37907535'], specs: [['Loops', '2 × 159 devices'], ['Display', '7" colour LCD'], ['Protocols', 'Addressable + conventional'], ['Power', '230V AC + battery backup'], ['Enclosure', 'Steel, IP30'], ['Compliance', 'EN 54-2 / EN 54-4']], overviewTitle: 'Control without complexity.', overview: 'Guardian X2 gives facility teams a clear view of every detector, call point and output on the network. Engineers can locate, test and document devices from a single interface.' },
      'water-jet-9l': { name: 'Water Jet 9L', accent: 'Extinguisher', category: 'extinguisher', summary: 'Class A protection for offices, corridors and general commercial areas.', price: '$89', image: '19107333', gallery: ['19107333', '18329661', '33533879'], specs: [['Capacity', '9 L'], ['Agent', 'Water'], ['Fire class', 'A'], ['Discharge', '≈13 sec'], ['Mounting', 'Wall bracket'], ['Compliance', 'EN 3']], overviewTitle: 'Ready for everyday risks.', overview: 'A straightforward water jet unit for Class A risks in commercial interiors. Simple operation and clear instructions make it a dependable first line of defence.' },
      'abc-dry-powder-6kg': { name: 'ABC Dry Powder', accent: '6kg Unit', category: 'extinguisher', summary: 'Multi-class coverage for mixed-risk sites, vehicles and workshops.', price: '$74', image: '18329661', gallery: ['18329661', '19107333', '33533879'], specs: [['Capacity', '6 kg'], ['Agent', 'ABC powder'], ['Fire class', 'A / B / C'], ['Working pressure', '12 bar'], ['Mounting', 'Wall bracket'], ['Compliance', 'EN 3']], overviewTitle: 'One unit, three classes.', overview: 'Dry powder covers solid, liquid and electrical risks in a single compact unit. Ideal where the hazard mix changes from one area of a site to the next.' },
      'glass-extinguisher-case': { name: 'Glass', accent: 'Extinguisher Case', category: 'extinguisher', summary: 'Secure, visible housing with break-seal access for public areas.', price: '$165', image: '15340134', gallery: ['15340134', '19107333', '18329661'], specs: [['Material', 'Toughened glass'], ['Access', 'Break-seal'], ['Capacity', '1–2 units'], ['Mounting', 'Surface fixed'], ['Finish', 'Powder-coated'], ['Compliance', 'EN 3']], overviewTitle: 'Visible, protected, accessible.', overview: 'A glazed cabinet keeps extinguishers protected without hiding them. The break-seal gives immediate access in an emergency while deterring casual removal.' },
      'foam-9l-industrial': { name: 'Foam 9L', accent: 'Industrial Unit', category: 'extinguisher', summary: 'Flammable liquid protection for plant rooms and workshops.', price: '$138', image: '33533879', gallery: ['33533879', '19107333', '15340134'], specs: [['Capacity', '9 L'], ['Agent', 'AFFF foam'], ['Fire class', 'B'], ['Discharge', '≈15 sec'], ['Mounting', 'Wall or vehicle'], ['Compliance', 'EN 3']], overviewTitle: 'Built for flammable liquids.', overview: 'Film-forming foam smothers flammable liquid fires and helps prevent re-ignition. Suited to plant rooms, workshops and fuel storage areas.' },
      'photoelectric-smoke-head': { name: 'Photoelectric', accent: 'Smoke Head', category: 'detection', summary: 'Fast response to smouldering fires with drift compensation.', price: '$62', image: '37907535', gallery: ['37907535', '24503710', '3958649'], specs: [['Type', 'Photoelectric'], ['Detection', 'Smouldering fires'], ['Sensitivity', 'Drift compensated'], ['Supply', '24 V DC'], ['Protocol', 'Addressable'], ['Compliance', 'EN 54-7']], overviewTitle: 'Early warning, fewer false alarms.', overview: 'Optical sensing responds quickly to slow, smouldering fires. Automatic drift compensation keeps sensitivity stable as the sensor ages.' },
      'manual-call-point': { name: 'Manual', accent: 'Call Point', category: 'detection', summary: 'Resettable glass-less break glass unit with clear signage.', price: '$48', image: '20614571', gallery: ['20614571', '3958649', '39183053'], specs: [['Type', 'Resettable'], ['Element', 'Glass-less'], ['Supply', '24 V DC'], ['Indication', 'Integral LED'], ['Protocol', 'Addressable'], ['Compliance', 'EN 54-11']], overviewTitle: 'A clear call to act.', overview: 'A conspicuous call point that anyone can operate in seconds. The resettable element reduces replacement costs after drills or accidental activation.' },
      'addressable-2-loop-panel': { name: 'Addressable 2-Loop', accent: 'Control Panel', category: 'panel', summary: 'Device-level diagnostics with mapped cause-and-effect logic.', price: '$2,450', image: '3958649', gallery: ['3958649', '39183052', '37907535'], specs: [['Loops', '2 × 159 devices'], ['Display', '7" colour LCD'], ['Protocols', 'Addressable + conventional'], ['Power', '230V AC + battery backup'], ['Enclosure', 'Steel, IP30'], ['Compliance', 'EN 54-2 / EN 54-4']], overviewTitle: 'Control without complexity.', overview: 'Two-loop control with device-level diagnostics and mapped cause-and-effect logic. Engineers can test, locate and document every device from one interface.' },
      'wireless-detector-kit': { name: 'Wireless', accent: 'Detector Kit', category: 'detection', summary: 'Retrofit detection for listed buildings and live environments.', price: '$320', image: '24503710', gallery: ['24503710', '37907535', '3958649'], specs: [['Devices', 'Up to 32'], ['Protocol', 'Wireless'], ['Battery life', '5 years'], ['Gateway', 'Included'], ['Commissioning', 'App-based'], ['Compliance', 'EN 54-25']], overviewTitle: 'Detection without disruption.', overview: 'A wireless detector kit brings listed buildings and live sites up to standard without chasing new cables through finished spaces.' },
      'wet-system-valve-set': { name: 'Wet System', accent: 'Valve Set', category: 'suppression', summary: 'Complete alarm valve assembly with gauge and test drains.', price: '$1,890', image: '12045663', gallery: ['12045663', '12171965', '3958649'], specs: [['Type', 'Wet alarm valve'], ['Size', 'DN100'], ['Gauge', 'Dual scale'], ['Drain', 'Test drain included'], ['Material', 'Ductile iron'], ['Approval', 'FM / UL']], overviewTitle: 'The heart of the system.', overview: 'A matched wet alarm valve assembly that controls flow, raises the alarm and provides safe test points for routine verification.' },
      'sprinkler-monitoring-kit': { name: 'Sprinkler', accent: 'Monitoring Kit', category: 'suppression', summary: 'Pressure, flow and valve supervised signals to the panel.', price: '$570', image: '12171965', gallery: ['12171965', '12045663', '3958649'], specs: [['Inputs', 'Pressure + flow'], ['Signals', 'Valve supervision'], ['Output', 'Volt-free contacts'], ['Supply', '24 V DC'], ['Enclosure', 'IP65'], ['Approval', 'UL listed']], overviewTitle: 'Know the system is ready.', overview: 'Supervision signals tell the panel when pressure drops or a valve moves, so a silent fault never leaves the system unavailable.' },
      'maintained-exit-sign': { name: 'Maintained', accent: 'Exit Sign', category: 'egress', summary: 'Uniform luminance, long-life LEDs and universal arrow tabs.', price: '$118', image: '1725617', gallery: ['1725617', '15067757', '3958649'], specs: [['Type', 'Maintained'], ['Light source', 'Long-life LED'], ['Duration', '3 hours'], ['Arrows', 'Universal tabs'], ['Mounting', 'Wall or ceiling'], ['Compliance', 'EN 60598-2-22']], overviewTitle: 'Guidance people can follow.', overview: 'Consistent luminance and clear directional tabs keep escape routes legible in normal operation and during an emergency.' },
      'emergency-bulkhead-light': { name: 'Emergency', accent: 'Bulkhead Light', category: 'egress', summary: 'IP65 corridor and stairwell lighting with 3-hour duration.', price: '$96', image: '15067757', gallery: ['15067757', '1725617', '3958649'], specs: [['Type', 'Emergency LED'], ['Rating', 'IP65'], ['Duration', '3 hours'], ['Output', '240 lm'], ['Mounting', 'Wall or ceiling'], ['Compliance', 'EN 60598-2-22']], overviewTitle: 'Safe passage, even in darkness.', overview: 'A sealed bulkhead luminaire for corridors, stairwells and damp areas, maintaining usable light levels when the supply fails.' },
      'addressable-call-point': { name: 'Addressable', accent: 'Call Point', category: 'detection', summary: 'Resettable unit with identification at the panel.', price: '$48', image: '20614571', gallery: ['20614571', '3958649', '39183053'], specs: [['Type', 'Addressable'], ['Element', 'Glass-less'], ['Supply', '24 V DC'], ['Indication', 'Integral LED'], ['Protocol', 'Loop device'], ['Compliance', 'EN 54-11']], overviewTitle: 'Identification at the panel.', overview: 'An addressable call point that reports its exact location to the panel, helping responders reach the right part of the building quickly.' },
      'multi-sensor-head': { name: 'Multi-Sensor', accent: 'Head', category: 'detection', summary: 'Smoke and heat sensing with adaptive algorithms.', price: '$72', image: '39183052', gallery: ['39183052', '37907535', '3958649'], specs: [['Type', 'Multi-sensor'], ['Detection', 'Smoke + heat'], ['Sensitivity', 'Adaptive'], ['Supply', '24 V DC'], ['Protocol', 'Addressable'], ['Compliance', 'EN 54-7']], overviewTitle: 'Two senses, one decision.', overview: 'Combining optical and thermal sensing improves detection across a wider range of fires while reducing nuisance alarms.' },
      'sounder-beacon': { name: 'Sounder &', accent: 'Beacon', category: 'detection', summary: 'Synchronised visual and audible evacuation warning.', price: '$58', image: '39183053', gallery: ['39183053', '20614571', '3958649'], specs: [['Type', 'Sounder + beacon'], ['Sound output', '100 dB'], ['Flash rate', '1 Hz'], ['Supply', '24 V DC'], ['Protocol', 'Addressable'], ['Compliance', 'EN 54-3 / 23']], overviewTitle: 'Heard and seen, instantly.', overview: 'Synchronised audible and visual warning devices ensure evacuation signals reach everyone, including in noisy or high-ambient-light areas.' }
    };
    const slug = new URLSearchParams(location.search).get('p');
    const product = catalog[slug] || catalog['guardian-x2'];
    const features = featureSets[product.category] || featureSets.panel;
    const setText = (key, value) => { const el = $(`[data-detail="${key}"]`); if (el) el.textContent = value; };

    document.title = `${product.name} ${product.accent} | SafeFlame`;
    const meta = $('meta[name="description"]');
    if (meta) meta.setAttribute('content', `${product.name} — ${product.summary} Specifications, documents and quotations from SafeFlame.`);

    $('[data-detail="hero"]')?.style.setProperty('--hero-image', `url('${photo(product.image, 1200)}')`);
    setText('summary', product.summary);
    setText('price', product.price);
    setText('overview-title', product.overviewTitle);
    setText('overview', product.overview);
    setText('documentation', `Downloadable, version-controlled documents issued with every ${product.name} system.`);
    setText('datasheet', `${product.name} Technical Datasheet`);

    const titleEl = $('[data-detail="title"]');
    if (titleEl) {
      titleEl.textContent = '';
      titleEl.append(document.createTextNode(product.name + ' '));
      const accent = document.createElement('span');
      accent.className = 'accent-orange';
      accent.textContent = product.accent;
      titleEl.append(accent);
    }

    const badges = $('[data-detail="badges"]');
    if (badges) {
      badges.textContent = '';
      (product.badges || [['Certified', 'hot'], ['In stock', 'green'], ['5-year warranty', '']]).forEach(([label, cls]) => {
        const badge = document.createElement('span');
        badge.className = cls ? `badge ${cls}` : 'badge';
        badge.textContent = label;
        badges.append(badge);
      });
    }

    const mainImg = $('[data-detail="main-image"]');
    const gallery = $('[data-detail="gallery"]');
    if (mainImg) { mainImg.src = photo(product.image, 1200); mainImg.alt = product.name; }
    if (gallery) {
      gallery.textContent = '';
      product.gallery.forEach((id, i) => {
        const thumb = document.createElement('img');
        thumb.src = photo(id, 300);
        thumb.alt = `${product.name} view ${i + 1}`;
        if (i === 0) thumb.className = 'active';
        thumb.addEventListener('click', () => {
          if (mainImg) mainImg.src = photo(id, 1200);
          $$('img', gallery).forEach(t => t.classList.toggle('active', t === thumb));
        });
        gallery.append(thumb);
      });
    }

    const specs = $('[data-detail="specs"]');
    if (specs) {
      specs.textContent = '';
      product.specs.forEach(([label, value]) => {
        const row = document.createElement('div');
        const key = document.createElement('span'); key.textContent = label;
        const val = document.createElement('b'); val.textContent = value;
        row.append(key, val);
        specs.append(row);
      });
    }

    features.forEach(([heading, text], i) => {
      setText(`feature-${i}-title`, heading);
      setText(`feature-${i}-text`, text);
    });
  }

  /* ---------- Image safety net ---------- */
  $$('img').forEach(img => {
    img.addEventListener('error', () => {
      if (img.dataset.fallback) return;
      img.dataset.fallback = '1';
      img.src = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#1D2E40"/><path d="M400 250c40 50 65 85 65 125a65 65 0 0 1-130 0c0-40 25-75 65-125Z" fill="#C63832"/><text x="400" y="470" fill="#FAFBFC" font-family="Arial" font-size="34" font-weight="700" text-anchor="middle">SafeFlame</text></svg>'
      );
    });
  });

  /* ---------- Current-year footer ---------- */
  $$('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });

  /* ---------- Active nav state ---------- */
  const current = location.pathname.split('/').pop() || 'index.html';
  let markedNav = false;
  $$('.main-nav > li > a').forEach(a => {
    const href = (a.getAttribute('href') || '').split('#')[0];
    if (!markedNav && href === current) { a.closest('li')?.classList.add('active'); markedNav = true; }
  });
})();
