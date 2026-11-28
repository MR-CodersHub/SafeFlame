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
    const scope = set.closest('section') || document;
    const panels = $$('[data-panel]', scope);
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

  if ($('[data-service-page]')) {
    const photo = (id, w) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
    const serviceCatalog = {
      'fire-detection-alarms': {
        name: 'Fire Detection', accent: '& Alarms', eyebrow: 'Service detail · 01',
        summary: 'Addressable and conventional detection, engineered to your floor plan and commissioned with a complete handover file.',
        hero: 3958649,
        overviewTitle: 'Detection that', overviewAccent: 'sees the whole picture.',
        overviewLead: 'We design coverage around how your building actually operates — occupancy, compartmentation and the way people move — not just a drawing.',
        overviewBody: 'Every device is addressed, tested and documented. Engineers leave you with a clear cause-and-effect matrix and a panel your team can actually read.',
        badges: [['Design to EN 54', 'hot'], ['Addressable + conventional', 'green'], ['Full handover file', '']],
        overviewImage: 39183052, overviewAlt: 'Ceiling-mounted fire detector in a commercial building',
        examine: [
          ['Coverage design', 'Detector spacing, audibility and device mapping reviewed against the floor plan and occupancy.'],
          ['Panel & devices', 'Loop integrity, fault history, call points, sounders and interfaces tested device by device.'],
          ['Integration', 'Suppression, access control, HVAC shutdown and remote monitoring checked as one system.']
        ],
        steps: [
          ['Survey', 'We walk the site with your drawings and mark every constraint before specifying a single device.'],
          ['Specify', 'A written schedule, coverage drawing and cause-and-effect matrix are agreed up front.'],
          ['Install', 'Certified technicians fit and wire the system in phases around your operations.'],
          ['Commission', 'Witnessed testing, engineer training and a bound handover pack close the job.']
        ],
        deliverablesTitle: 'What lands on', deliverablesAccent: 'your desk.',
        deliverablesIntro: 'A complete pack for sign-off, insurance and the next inspection.',
        deliverables: ['Device schedule and as-fired drawings', 'Cause & Effect matrix and test records', 'Commissioning certificate and warranties', 'Engineer training sign-off sheet'],
        deliverablesImage: 37907535, deliverablesAlt: 'Detector mounted on a ceiling',
        faqs: [
          ['Can you upgrade an existing panel?', 'Often yes. We survey the loop, document reusable devices and set out a phased migration with no blind spots.'],
          ['Will testing disrupt our building?', 'Tests are scheduled around occupation, with sounders isolated by zone and short notice where needed.'],
          ['Do you provide drawings?', 'Yes. As-installed drawings and a device schedule are included in the handover pack.'],
          ['Is remote monitoring available?', 'We can add an approved monitoring link with event forwarding to your chosen alarm receiving centre.']
        ],
        cta: { eyebrow: 'Book a survey', title: 'Get a detection design that fits.', text: 'A senior engineer, a drawn coverage plan and a fixed price within 48 hours.', points: ['Drawn coverage', 'Fixed price'], button: 'Book a survey', time: '09:00', day: 'MONDAY · 48H', mark: '09:00' }
      },
      'suppression-systems': {
        name: 'Suppression', accent: 'Systems', eyebrow: 'Service detail · 02',
        summary: 'Wet, dry, pre-action and clean-agent systems engineered around the assets you cannot afford to lose.',
        hero: 12045663,
        overviewTitle: 'Suppression built', overviewAccent: 'around the risk.',
        overviewLead: 'Water is not always the answer. We match the agent to the hazard, the building and the downtime you can tolerate.',
        overviewBody: 'From sprinkler hydraulics to clean-agent cylinders, every installation is calculated, witnessed and handed over with maintenance access in mind.',
        badges: [['Wet · dry · pre-action', 'hot'], ['Clean agent options', 'green'], ['Hydraulic calc pack', '']],
        overviewImage: 13312223, overviewAlt: 'Industrial valves and pipework with pressure gauges',
        examine: [
          ['Hazard mapping', 'Fuel loads, occupancy and critical equipment mapped to decide where suppression is genuinely required.'],
          ['Hydraulics & supply', 'Flow, pressure and storage calculated against the most demanding design scenario.'],
          ['Discharge testing', 'Alarms, valves and deluge or pre-action sequences proven with a witnessed acceptance test.']
        ],
        steps: [
          ['Assess', 'We identify the hazard, the asset value and the outage tolerance before choosing an agent.'],
          ['Calculate', 'Hydraulics, agent quantities and discharge times are modelled and checked independently.'],
          ['Install', 'Pipework, cylinders and controls are fitted in phased areas with permit-to-work discipline.'],
          ['Prove', 'A witnessed discharge test and full documentation close the commissioning file.']
        ],
        deliverablesTitle: 'What lands on', deliverablesAccent: 'your desk.',
        deliverablesIntro: 'Calculations, drawings and certificates your insurer and auditors will ask for.',
        deliverables: ['Hydraulic calculation report', 'As-installed pipework drawings', 'Discharge test certificate', 'Maintenance and inspection schedule'],
        deliverablesImage: 12045663, deliverablesAlt: 'Detailed view of an industrial fire sprinkler system',
        faqs: [
          ['Will sprinklers damage equipment?', 'Only the operating head discharges, and pre-action or clean-agent options are available where water is unacceptable.'],
          ['Can a system be added to an old building?', 'Yes. We route pipework to suit the structure and phase installation to keep areas live.'],
          ['How often is servicing needed?', 'Weekly visual checks, annual servicing and periodic hydrostatic tests depending on the system type.'],
          ['Do you handle refills?', 'We manage cylinder refills, head replacements and test records under a planned agreement.']
        ],
        cta: { eyebrow: 'Book a survey', title: 'Get a suppression design that fits.', text: 'A hazard review, system option comparison and a fixed price within 48 hours.', points: ['Hazard review', 'Fixed price'], button: 'Book a survey', time: '10:00', day: 'TUESDAY · 48H', mark: '10:00' }
      },
      'inspection-risk-audit': {
        name: 'Inspection', accent: '& Risk Audit', eyebrow: 'Service detail · 03',
        summary: 'A rigorous, documented fire safety inspection that turns uncertainty into a clear, costed plan of action.',
        hero: 5294222,
        overviewTitle: 'An inspection that', overviewAccent: 'leaves you informed.',
        overviewLead: 'Too many inspections produce a folder of jargon. Ours produce a conversation: what is working, what is not, what it costs to fix and what can wait.',
        overviewBody: 'Every assessment is carried out by a senior engineer who will explain findings on site, photograph evidence and rank each item by real-world risk rather than paperwork convenience.',
        badges: [['Typical: 1 site day', 'hot'], ['Report in 5 days', 'green'], ['All property types', '']],
        overviewImage: 20614571, overviewAlt: 'Red fire alarm call point inspected on a concrete wall',
        examine: [
          ['Active protection', 'Detection coverage, alarm audibility, panel fault history, suppression readiness and extinguisher condition.'],
          ['Passive protection', 'Fire doors, compartments, penetrations, structural protection and means of escape routes.'],
          ['Management systems', 'Records, maintenance regimes, staff training, emergency plans and evidence of previous actions.']
        ],
        steps: [
          ['Pre-visit review', 'We study drawings, previous reports and your logs before arriving, so site time is spent inspecting — not reading.'],
          ['Walkthrough', 'A room-by-room survey with sample tests, photographs and immediate verbal feedback on critical issues.'],
          ['Analysis', 'Findings mapped against current codes and ranked by likelihood and consequence, with practical remedies.'],
          ['Report & review', 'A clear written report and a call to walk through it — including an honest view of what does not need doing.']
        ],
        deliverablesTitle: 'What lands on', deliverablesAccent: 'your desk.',
        deliverablesIntro: 'Every assessment produces a package designed to be used — by your facilities team, your insurers and your auditors.',
        deliverables: ['Prioritised findings register with photographs', 'Code gap analysis and commentary', 'Costed remediation roadmap with phasing', 'Signed inspection certificate'],
        deliverablesImage: 11142768, deliverablesAlt: 'Industrial pipe system with pressure gauges and valves',
        faqs: [
          ['How long does an inspection take?', 'A typical small commercial site takes half a day; larger industrial premises may require two or more days with a small team.'],
          ['Do we need to close the site?', 'Rarely. We work around occupancy and can attend out of hours. Only sampled testing of sounders ever needs a short notice period.'],
          ['Will you quote the remedial work?', 'Yes, as a separate fixed-price proposal with clear options — do the minimum, or take the opportunity to upgrade.'],
          ['Is the report accepted by insurers?', 'Our reports are structured around recognised codes and include signed certification, so they are routinely accepted by insurers and authorities.']
        ],
        cta: { eyebrow: 'Book your survey', title: 'Get a clear picture of your risk.', text: 'A senior engineer, a documented findings list and a plan you can actually act on.', points: ['Senior engineer', 'Documented findings'], button: 'Arrange an inspection', time: '09:00', day: 'MONDAY · 48H', mark: '09:00' }
      },
      'extinguisher-servicing': {
        name: 'Extinguisher', accent: 'Servicing', eyebrow: 'Service detail · 04',
        summary: 'Monthly checks, annual servicing, hydrostatic testing and refills with a live digital asset register.',
        hero: 19107333,
        overviewTitle: 'Every extinguisher', overviewAccent: 'accounted for.',
        overviewLead: 'No more clipboards going missing. Each unit is tagged, tracked and serviced on a schedule your insurer will accept.',
        overviewBody: 'Technicians record every inspection against the asset, close defects on the day where possible and give you a register that stays current across the whole estate.',
        badges: [['Annual servicing', 'hot'], ['Hydro testing', 'green'], ['Digital register', '']],
        overviewImage: 33533879, overviewAlt: 'Red fire extinguisher mounted on a concrete wall',
        examine: [
          ['Asset register', 'Every unit tagged with location, type, due date and full service history.'],
          ['Service & refill', 'Checks, seals, gauges and refills completed to the manufacturer schedule.'],
          ['Hydrostatic test', 'Cylinders tested at the correct interval with certificates filed against the asset.']
        ],
        steps: [
          ['Register', 'We audit the estate and tag anything missing from the current list.'],
          ['Schedule', 'Due dates are grouped by site so visits are efficient and predictable.'],
          ['Service', 'Technicians inspect, refill and replace as needed, recording evidence on site.'],
          ['Report', 'A compliance summary highlights overdue units and upcoming test dates.']
        ],
        deliverablesTitle: 'What lands on', deliverablesAccent: 'your desk.',
        deliverablesIntro: 'A register that makes the next audit a short conversation.',
        deliverables: ['Tagged digital asset register', 'Service record per unit', 'Hydro test certificates', 'Annual compliance summary'],
        deliverablesImage: 15067757, deliverablesAlt: 'Illuminated emergency exit sign above a doorway',
        faqs: [
          ['How often do extinguishers need servicing?', 'Annual servicing is standard, with monthly visual checks and hydro tests at the interval printed on the cylinder.'],
          ['Can you take over our existing units?', 'Yes. We inspect each unit first and only carry forward equipment that is fit and correctly sited.'],
          ['Do you issue certificates?', 'Every serviced unit gets a record and the site receives a consolidated servicing certificate.'],
          ['Is the register digital?', 'Yes. You get a live register with due dates, photographs and a complete history per asset.']
        ],
        cta: { eyebrow: 'Book a survey', title: 'Get every unit under control.', text: 'An asset audit, a clear servicing schedule and a fixed price within 48 hours.', points: ['Asset audit', 'Fixed price'], button: 'Book a survey', time: '11:00', day: 'WEDNESDAY · 48H', mark: '11:00' }
      },
      'emergency-lighting-signage': {
        name: 'Emergency Lighting', accent: '& Signage', eyebrow: 'Service detail · 05',
        summary: 'Wayfinding that works in the dark — route lighting, maintained signs and three-hour duration testing.',
        hero: 15067757,
        overviewTitle: 'Escape routes', overviewAccent: 'that stay clear.',
        overviewLead: 'A sign on the wall is not a strategy. We walk the route in darkness conditions and specify lighting and signage people can actually follow.',
        overviewBody: 'From photoluminescent markings to maintained fittings, every position is justified by the route, the occupancy and the test duration your auditor expects.',
        badges: [['Route survey', 'hot'], ['3-hour duration', 'green'], ['Maintained + photoluminescent', '']],
        overviewImage: 1871343, overviewAlt: 'Green emergency exit sign with directional arrow',
        examine: [
          ['Route survey', 'Every escape route walked and checked for contrast, obstructions and decision points.'],
          ['Illumination', 'Lux levels and duration verified against the route geometry and occupancy.'],
          ['Signage', 'Direction and wording checked so people reach the exit without hesitation.']
        ],
        steps: [
          ['Walk', 'We trace each route in normal and simulated failure conditions.'],
          ['Specify', 'Fittings, signs and mounting positions are set out on a route drawing.'],
          ['Install', 'Work is phased to keep corridors clear and occupancies safe.'],
          ['Test', 'Duration tests are recorded and any failed fitting replaced before handover.']
        ],
        deliverablesTitle: 'What lands on', deliverablesAccent: 'your desk.',
        deliverablesIntro: 'Evidence that the route works when the lights go out.',
        deliverables: ['Route-by-route survey drawing', 'Lux and duration test records', 'Sign schedule and locations', 'Commissioning certificate'],
        deliverablesImage: 1871343, deliverablesAlt: 'Green emergency exit sign with directional arrow',
        faqs: [
          ['How long must emergency lighting last?', 'Three hours is the common requirement for escape routes, though the exact duty depends on the risk assessment.'],
          ['Can you test out of hours?', 'Yes. We schedule duration tests around occupancy and issue short notice where a route must be closed.'],
          ['Do you supply the signs?', 'We supply and install maintained and photoluminescent signs to suit the route and the building finish.'],
          ['Will this satisfy auditors?', 'The survey, test records and commissioning certificate provide a clear evidence trail for audit and insurance.'],
        ],
        cta: { eyebrow: 'Book a survey', title: 'Make every exit obvious.', text: 'A route walk, a written specification and a fixed price within 48 hours.', points: ['Route walk', 'Fixed price'], button: 'Book a survey', time: '12:00', day: 'THURSDAY · 48H', mark: '12:00' }
      }
    };

    const slug = new URLSearchParams(location.search).get('s');
    const service = serviceCatalog[slug] || serviceCatalog['inspection-risk-audit'];
    const setText = (key, value) => {
      const el = $(`[data-detail="${key}"]`);
      if (el) el.textContent = value;
    };
    const splitTitle = (key, first, accent, cls) => {
      const el = $(`[data-detail="${key}"]`);
      if (!el) return;
      el.textContent = '';
      el.append(document.createTextNode(`${first} `));
      const span = document.createElement('span');
      span.className = cls;
      span.textContent = accent;
      el.append(span);
    };
    const setImage = (key, id, alt, w) => {
      const img = $(`[data-detail="${key}"]`);
      if (img) { img.src = photo(id, w); img.alt = alt; }
    };

    document.title = `${service.name} ${service.accent} | SafeFlame`;
    const desc = $('meta[name="description"]');
    if (desc) desc.content = service.summary;
    const hero = $('[data-detail="hero"]');
    if (hero) hero.style.setProperty('--hero-image', `url('${photo(service.hero, 1600)}')`);
    setText('eyebrow', service.eyebrow);
    splitTitle('title', service.name, service.accent, 'accent-orange');
    setText('summary', service.summary);
    splitTitle('overview-title', service.overviewTitle, service.overviewAccent, 'accent');
    setText('overview-lead', service.overviewLead);
    setText('overview-body', service.overviewBody);

    const badges = $('[data-detail="badges"]');
    if (badges) {
      badges.textContent = '';
      service.badges.forEach(([label, cls]) => {
        const badge = document.createElement('span');
        badge.className = cls ? `badge ${cls}` : 'badge';
        badge.textContent = label;
        badges.append(badge);
      });
    }
    setImage('overview-image', service.overviewImage, service.overviewAlt, 1000);

    service.examine.forEach(([heading, text], i) => {
      setText(`examine-${i}-title`, heading);
      setText(`examine-${i}-text`, text);
    });
    service.steps.forEach(([heading, text], i) => {
      setText(`step-${i}-title`, heading);
      setText(`step-${i}-text`, text);
    });
    splitTitle('deliverables-title', service.deliverablesTitle, service.deliverablesAccent, 'accent-orange');
    setText('deliverables-intro', service.deliverablesIntro);
    service.deliverables.forEach((text, i) => setText(`deliverable-${i}`, text));
    setImage('deliverables-image', service.deliverablesImage, service.deliverablesAlt, 1000);
    service.faqs.forEach(([q, a], i) => {
      setText(`faq-${i}-q`, q);
      setText(`faq-${i}-a`, a);
    });

    const ctaBand = $('[data-detail="cta-band"]');
    if (ctaBand) ctaBand.dataset.mark = service.cta.mark;
    setText('cta-eyebrow', service.cta.eyebrow);
    setText('cta-title', service.cta.title);
    setText('cta-text', service.cta.text);
    setText('cta-point-0', service.cta.points[0]);
    setText('cta-point-1', service.cta.points[1]);
    setText('cta-button', service.cta.button);
    setText('cta-time', service.cta.time);
    setText('cta-day', service.cta.day);
  }

  if ($('[data-resource-page]')) {
    const resourcePhoto = (id, w) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
    const defaultRelated = ['exit-routes-under-pressure', 'stairwell-monthly-check', 'photoluminescent-vs-maintained'];
    const defaultDownloads = [['Companion checklist', 'PDF · 1 page · Print friendly', 'daily-escape-route'], ['Fire drill record template', 'PDF · 640 KB · Editable', 'fire-drill-record']];
    const resourceCatalog = {
      'emergency-planning-real-buildings': {
        tag: 'Guide', meta: '8 MIN READ · EVACUATION', title: ['Emergency planning for', 'real buildings.'],
        summary: 'Why the best fire plan is the one your people can remember at 2am — and how to build one that survives contact with reality.',
        hero: 36731054, article: 36731054, articleAlt: 'Emergency exit sign and alarm in an indoor corridor',
        badges: [['Featured guide', 'hot'], ['8 min read', ''], ['Updated 2026', 'green']],
        intro: ['Most emergency plans fail for a mundane reason: they were written for a building as designed, not the building as used. Doors get propped open, storage migrates into escape routes and staff rotate faster than the plan is updated.', 'This guide sets out the approach our engineers use when helping clients build plans that work in practice — short enough to remember, specific enough to act on and robust enough to change as the building changes.'],
        points: [
          ['How people move', 'Start with how people actually move', 'Walk the building at its busiest and quietest times. Note where people genuinely go, which exits they favour and where they hesitate, then formalise the routes people already trust.', null, null, 'A plan that depends on people reading a notice in an emergency is not a plan. It is a hope.'],
          ['Clear instructions', 'Make instructions impossible to misread', 'Use short, imperative sentences and place them where the decision happens: beside the call point, at the exit and near the assembly point.', ['Identify two routes from every occupied area', 'Name a responsible person and deputy per floor', 'Show the assembly point physically', 'State who calls the fire service and what to say']],
          ['First sixty seconds', 'Design for the first sixty seconds', 'Train for the first minute specifically. People should know the nearest call point without thinking, understand not to investigate a fire, and know that closing a door protects the corridor behind them.', null, { title: 'Practical note', body: 'Only tackle a fire if trained, the fire is small, escape is clear behind you and the correct extinguisher is to hand. In every other case, get out and raise the alarm.' }],
          ['Practise and adapt', 'Practise, then change the plan', 'A drill is the only reliable way to discover that the assembly point floods or a marshal is stationed behind a secured door. Time it, record surprises and issue a one-page change note.', ['Announce a drill without warning the marshals', 'Time the full evacuation to assembly', 'Ask three people to explain what they did', 'Update the plan within seven days']],
          ['Keep the evidence', 'Keep the evidence', 'Insurers and authorities want to see that the plan is live. Keep dated versions, drill records, training attendance and remedial actions together in one maintained place.']
        ],
        takeaways: ['Write for people under stress, not for a filing cabinet.', 'Place instructions where decisions happen.', 'Drills are for discovering problems, not proving perfection.'],
        faqs: [['How often should we run a drill?', 'Most jurisdictions expect at least annual drills; higher-risk sites benefit from twice yearly. Short unannounced walk-throughs are useful between full drills.'], ['Who should be a fire marshal?', 'Choose people present on site, confident speaking to others and willing to take responsibility. Always appoint a deputy for each area.'], ['Can you review our existing plan?', 'Yes. Send it to us and an engineer will mark it up with practical comments, usually within two working days.']],
        cta: { eyebrow: 'Put it into practice', title: 'Want us to run a drill with your team?', text: 'We design, observe and debrief practical evacuation exercises tailored to your building.', points: ['Drill design', 'Debrief included'], button: 'Arrange a drill', art: 'DRILL DEBRIEF', mark: 'DRILL' },
        downloads: [['Emergency plan self-review', 'PDF · 1.1 MB · 2 pages', 'daily-escape-route'], ['Fire drill record template', 'PDF · 640 KB · Editable', 'fire-drill-record']]
      },
      'monthly-fire-system-walk-round': {
        tag: 'Checklist', meta: '5 MIN READ · SYSTEMS', title: ['Monthly fire system', 'walk-round'],
        summary: 'Twelve checks any facility team can complete in under twenty minutes — and what to escalate when something looks wrong.',
        hero: 8297856, article: 8297856, articleAlt: 'Air duct and ventilation system in a building ceiling',
        badges: [['Field checklist', 'hot'], ['5 min read', ''], ['12 checks', 'green']],
        intro: ['A walk-round is not a full inspection. It is a short, disciplined look at the things that change between engineer visits: blocked routes, damaged fittings, tampered valves and missing records.', 'The checks below are written for facilities teams. Anything outside normal condition should be logged and passed to your service provider the same day.'],
        points: [
          ['Route first', 'Start at the exit', 'Walk from the most remote workspace to the final exit. Check that corridors, stairwells and fire doors are clear, closed and free of improvised storage.'],
          ['Alarm devices', 'Prove the call points', 'Confirm call points are visible and unobstructed, sounders are audible and the panel shows no unresolved faults. Never silence a fault without recording it.'],
          ['Suppression', 'Look beyond the panel', 'Check valve positions, gauge pressures and accessible sprinkler heads. A healthy panel does not guarantee a healthy water supply.'],
          ['Access', 'Clear the plant and risers', 'Keep plant rooms, risers and access panels reachable. A system that cannot be serviced cannot be relied on.'],
          ['Record', 'Log it while it is fresh', 'Date each check, name the checker and attach photographs to defects. A log with no dates is no evidence at all.']
        ],
        takeaways: ['Walk the route, not the checklist.', 'Record defects with date, location and photograph.', 'Escalate panel faults the same day.'],
        faqs: [['Who should do the walk-round?', 'A trained member of the facilities team, with a nominated deputy so the routine survives holidays and staff changes.'], ['Is this a replacement for annual servicing?', 'No. It sits between engineer visits and catches change before it becomes a compliance problem.'], ['What should be escalated immediately?', 'Panel faults, closed valves, blocked escape routes, damaged heads and any extinguisher with a pressure or seal defect.']],
        cta: { eyebrow: 'Make it routine', title: 'Want a walk-round your team can repeat?', text: 'We will set out a simple route, a defect threshold and a record format that suits your site.', points: ['Site-specific route', 'Defect thresholds'], button: 'Build my checklist', art: 'WALK-ROUND', mark: '05 MIN' },
        downloads: [['Monthly walk-round sheet', 'PDF · 1 page · A4', 'daily-escape-route'], ['Fire drill record template', 'PDF · 640 KB · Editable', 'fire-drill-record']]
      },
      'first-60-seconds': {
        tag: 'Emergency', meta: '4 MIN READ · RESPONSE', title: ['What to do in the', 'first 60 seconds'],
        summary: 'A clear sequence for raising the alarm, evacuating and accounting for people — written for the moment when nobody has time to think.',
        hero: 39183053, article: 39183053, articleAlt: 'Red manual fire alarm switch with operating instructions',
        badges: [['Emergency sequence', 'hot'], ['4 min read', ''], ['Pocket guide', 'green']],
        intro: ['The first minute determines the outcome more than any later action. People do not rise to the occasion; they fall back on what they have rehearsed.', 'This sequence is deliberately short. Teach it, post it near call points and include it in induction so the right action becomes the automatic one.'],
        points: [
          ['Raise the alarm', 'Break the glass, then shout', 'Operate the nearest call point and give a clear verbal alarm as you move. Do not investigate the source of smoke or heat.'],
          ['Get out', 'Use the nearest safe exit', 'Follow the route you know, not the route you hope will be clearer. Do not use lifts and do not return for belongings.'],
          ['Contain', 'Close doors behind you', 'A closed fire door can hold smoke and heat for a valuable period. Close it without locking it and without delaying your escape.'],
          ['Assemble', 'Account for people at the muster point', 'Move well clear of the building, report yourself and help your area marshal identify anyone missing. Give the fire service accurate information.'],
          ['Hand over', 'Tell the fire service what you know', 'State the address, the location of the fire, the involved floor, any trapped persons and the hazards likely to be present.']
        ],
        takeaways: ['Alarm first, evacuate second.', 'Never re-enter for possessions.', 'Give the fire service location and hazards, not guesses.'],
        faqs: [['Should we try to tackle the fire?', 'Only if trained, the fire is small, escape is clear behind you and the correct extinguisher is to hand. Otherwise leave immediately.'], ['What if the known route is blocked?', 'Use the alternative route in your plan. Do not push through smoke or assume a lift is available.'], ['Who counts people at the assembly point?', 'The area marshal or deputy, using the last known occupancy list rather than memory alone.']],
        cta: { eyebrow: 'Practise the sequence', title: 'Want a drill that tests the real first minute?', text: 'We observe unannounced exercises and report the decisions people actually made, not just the evacuation time.', points: ['Unannounced option', 'Decision debrief'], button: 'Arrange a drill', art: '60 SECONDS', mark: '01:00' }
      },
      'inspection-duties': {
        tag: 'Compliance', meta: '10 MIN READ · CODES', title: ['Understanding your', 'inspection duties'],
        summary: 'Who must inspect what, how often, and what evidence you need to keep — without the jargon that buries the useful bits.',
        hero: 12018108, article: 12018108, articleAlt: 'Industrial pipework and gauges on a building exterior',
        badges: [['Compliance guide', 'hot'], ['10 min read', ''], ['Evidence-led', 'green']],
        intro: ['Most fire safety duties are simpler than the paperwork around them. Someone responsible, a defined interval, a competent inspection and a record of what happened — that is the core of it.', 'The difficulty is consistency. This guide turns the duty into a repeatable cycle your team can defend to an insurer or authority.'],
        points: [
          ['Know the assets', 'List what can fail', 'Inventory detection, suppression, extinguishers, emergency lighting, signage and fire doors with location, type and due date.'],
          ['Set intervals', 'Match frequency to risk', 'Weekly visual checks, monthly walk-rounds and annual servicing are common starting points, but occupancy and hazard change the duty.'],
          ['Keep evidence', 'Record the check, not the intention', 'A dated record with the checker name, result and photograph is worth more than a perfect policy nobody executed.'],
          ['Rank defects', 'Fix by risk, not by noise', 'Separate life-safety failures from cosmetic issues, assign owners and dates, and close each item with evidence.'],
          ['Review annually', 'Let the building change the plan', 'Revisit the inventory after refits, tenancy changes or process changes, then update intervals and responsibilities.']
        ],
        takeaways: ['Duty without a record is hard to prove.', 'Rank defects by consequence and likelihood.', 'Review the inventory after every material building change.'],
        faqs: [['Who is legally responsible?', 'The responsible person for the premises, often the owner or employer, though duties can be delegated in writing to a competent manager.'], ['How often are inspections required?', 'It depends on the system and jurisdiction. Weekly, monthly and annual intervals are common, with risk assessments setting the final frequency.'], ['What evidence should we keep?', 'Dated check records, defect logs, certificates, service reports and training attendance for the people performing checks.']],
        cta: { eyebrow: 'Make duties manageable', title: 'Want a duty register you can actually use?', text: 'We map your assets, intervals and evidence into a single register with clear ownership.', points: ['Asset register', 'Clear ownership'], button: 'Ask an engineer', art: 'DUTY REGISTER', mark: 'MAP' }
      },
      'choosing-detection': {
        tag: 'Guide', meta: '7 MIN READ · DETECTION', title: ['Choosing detection for', 'your building'],
        summary: 'Conventional, addressable and wireless — a plain-language comparison that starts with the building, not the brochure.',
        hero: 24503710, article: 24503710, articleAlt: 'Connected safety sensors and control devices',
        badges: [['Detection guide', 'hot'], ['7 min read', ''], ['Plain language', 'green']],
        intro: ['Detection choices are often made backwards: a panel is selected first and the building is made to fit it. The better order is occupancy, risk, compartmentation and future growth.', 'This guide compares the three common approaches and explains where each one earns its keep.'],
        points: [
          ['Occupancy', 'Start with how the building is used', 'A care facility, a warehouse and an office block fail in different ways. Occupant vulnerability and response time drive detector choice.'],
          ['Conventional', 'Simple zones for simple sites', 'Conventional systems are economical where a fault only needs to be traced to a zone and future changes are unlikely.'],
          ['Addressable', 'Precision when every minute counts', 'Addressable loops identify the exact device, support cause-and-effect logic and make phased changes far easier to document.'],
          ['Wireless', 'Useful where cable is disruptive', 'Wireless devices suit listed buildings, temporary sites and retrofits, provided battery management and signal survey are part of the design.'],
          ['Handover', 'Buy the documentation too', 'A device schedule, coverage drawing, cause-and-effect matrix and training record are part of the system, not optional extras.']
        ],
        takeaways: ['Design for occupancy before technology.', 'Addressable systems pay off in complex or changing buildings.', 'Wireless needs a battery and signal plan.'],
        faqs: [['Is wireless reliable enough?', 'Yes when surveyed and managed properly. Batteries, signal paths and supervision must be included in the maintenance plan.'], ['Can we mix conventional and addressable?', 'Usually through gateways or separate panels, but the cause-and-effect strategy must be designed as one system.'], ['What documentation should we receive?', 'As-installed drawings, device schedule, cause-and-effect matrix, test records and engineer training sign-off.']],
        cta: { eyebrow: 'Compare options', title: 'Want a detection design that fits?', text: 'A senior engineer will walk the site and set out conventional, addressable and wireless options with fixed prices.', points: ['Coverage drawing', 'Fixed options'], button: 'Book a survey', art: 'DETECTION', mark: '03' }
      },
      'supplier-pre-visit-checklist': {
        tag: 'Checklist', meta: '6 MIN READ · MAINTENANCE', title: ['Annual supplier', 'pre-visit checklist'],
        summary: 'Prepare your records and site access so the visit delivers maximum value instead of becoming a discovery exercise.',
        hero: 12238026, article: 12238026, articleAlt: 'Industrial boiler pipework and control equipment',
        badges: [['Pre-visit checklist', 'hot'], ['6 min read', ''], ['6 steps', 'green']],
        intro: ['An engineer spending the morning finding panel keys, previous reports and isolated valves is an engineer not testing your system.', 'A short preparation routine before the visit turns a compliance appointment into a genuinely useful review.'],
        points: [
          ['Records', 'Put previous reports in one place', 'Have the last service record, defect log, drawings and certificates available before the engineer arrives.'],
          ['Access', 'Confirm plant and riser access', 'Arrange keys, permits and safe access to plant rooms, ceiling voids and external equipment.'],
          ['Outstanding work', 'Flag changes since the last visit', 'List refits, new tenancies, damaged fittings and any work carried out by other contractors.'],
          ['Operations', 'Plan around occupancy', 'Agree short sounder isolation windows or out-of-hours testing where a live site cannot be disrupted.'],
          ['Debrief', 'Book the conversation afterwards', 'Reserve twenty minutes for findings, priorities and a written summary while the visit is fresh.']
        ],
        takeaways: ['Prepare access before the engineer arrives.', 'Flag every change since the last visit.', 'Always book the debrief.'],
        faqs: [['How long should we allow?', 'Allow the agreed visit duration plus a twenty-minute debrief with the responsible person or facilities lead.'], ['Do we need to shut down the site?', 'Rarely. Most tests are zoned and short notice is given where sounders or routes are affected.'], ['What if records are missing?', 'Say so before the visit. The engineer can reconstruct a baseline and set up a register going forward.']],
        cta: { eyebrow: 'Prepare properly', title: 'Want a visit that delivers value?', text: 'We will send a pre-visit checklist tailored to your systems and site before the engineer attends.', points: ['Tailored checklist', 'Debrief included'], button: 'Request a visit', art: 'PRE-VISIT', mark: 'READY' }
      },
      'sprinkler-activation': {
        tag: 'Emergency', meta: '3 MIN READ · RESPONSE', title: ['When a sprinkler', 'activates'],
        summary: 'Isolation, water damage control and what to tell the fire service on arrival — in the order that matters.',
        hero: 11930572, article: 11930572, articleAlt: 'Weathered red fire sprinkler control valve',
        badges: [['Response note', 'hot'], ['3 min read', ''], ['Suppression', 'green']],
        intro: ['A sprinkler operating is a fire event, not a plumbing fault. The system has done its job; the next decisions are about life safety, control and evidence.', 'Keep this short sequence near the riser and make sure the responsible person knows who is allowed to isolate the system.'],
        points: [
          ['Alarm', 'Treat the alarm as real', 'Evacuate and call the fire service first. Do not assume a sprinkler activation is a false alarm.'],
          ['Isolate', 'Only when safe and authorised', 'If isolation is necessary to stop water after the fire is controlled, use the designated valve and record who operated it and when.'],
          ['Protect', 'Limit water damage without delaying escape', 'Protect electrical areas and stock where it can be done safely, but never re-enter a fire-affected area to salvage goods.'],
          ['Hand over', 'Tell the fire service about the system', 'State the sprinkler zone, whether flow is continuing, the location of isolation valves and any hazards on site.'],
          ['Restore', 'Reinstate through your supplier', 'Only a competent contractor should replace heads, recharge the system and return valves to their supervised position.']
        ],
        takeaways: ['Evacuate and call first.', 'Only authorised people isolate.', 'Reinstatement is a contractor task.'],
        faqs: [['Can we shut the sprinklers off ourselves?', 'Only if a trained, authorised person decides it is safe after the fire is controlled. Unauthorised isolation removes protection from the rest of the building.'], ['Will every head discharge?', 'No. Normally only the head operating at the fire discharges, which is why automatic suppression limits water damage.'], ['What records are needed afterwards?', 'Time of activation, zone, who attended, isolation details, fire service attendance and the contractor reinstatement certificate.']],
        cta: { eyebrow: 'After an activation', title: 'Need help restoring the system?', text: 'Our suppression team can attend, document the event and reinstate the system with a clear certificate.', points: ['Rapid attendance', 'Reinstatement certificate'], button: 'Call the team', art: 'RESTORE', mark: '24/7' }
      },
      'suppression-documentation': {
        tag: 'Compliance', meta: '9 MIN READ · INDUSTRIAL', title: ['Suppression system', 'documentation guide'],
        summary: 'The drawings, logs and certificates an auditor will expect to see — and how to keep them useful between visits.',
        hero: 37352142, article: 37352142, articleAlt: 'Industrial fire sprinkler pipe network on a factory wall',
        badges: [['Audit guide', 'hot'], ['9 min read', ''], ['Industrial', 'green']],
        intro: ['Suppression systems are judged as much on evidence as on hardware. An auditor cannot see hydraulic performance in a corridor; they read the file.', 'A good documentation set is current, indexed and easy to reconcile with what is actually installed.'],
        points: [
          ['Drawings', 'Keep as-installed plans current', 'Store zone drawings, pipe routes and valve locations where the facilities team can reach them, not in a locked drawing office.'],
          ['Calculations', 'Retain the design basis', 'Hydraulic calculations, agent quantities and discharge assumptions explain why the system is sized as it is.'],
          ['Certificates', 'File commissioning and acceptance evidence', 'Keep discharge test certificates, valve lock records, warranties and contractor sign-offs together.'],
          ['Logs', 'Show the routine, not the promise', 'Weekly, monthly and annual records with dates and checker names demonstrate that the system is maintained in practice.'],
          ['Change control', 'Update the file after every modification', 'A moved head or new tenancy must appear on the drawing and in the maintenance schedule before the next audit.']
        ],
        takeaways: ['As-installed drawings beat design drawings.', 'Evidence must be dated and attributable.', 'Change control keeps the file honest.'],
        faqs: [['What will an auditor ask for first?', 'Usually the current drawings, last service report, defect log and proof that outstanding items were closed.'], ['Do warehouse systems need different records?', 'Hazard classification, storage arrangement and sprinkler spacing records become especially important in warehouses.'], ['Who owns the documentation?', 'The responsible person, though a facilities manager or contracted provider often maintains the file day to day.']],
        cta: { eyebrow: 'Check your file', title: 'Want an audit-ready document set?', text: 'We compare your drawings, certificates and logs against the installed system and list the gaps in plain language.', points: ['Gap list', 'Plain language'], button: 'Request a review', art: 'AUDIT FILE', mark: 'DOC' }
      },
      'exit-signage-basics': {
        tag: 'Guide', meta: '6 MIN READ · EGRESS', title: ['Exit signage: getting', 'the basics right'],
        summary: 'Visibility, mounting, direction and the small mistakes that cost you in an audit — and confuse people in an emergency.',
        hero: 15067757, article: 15067757, articleAlt: 'Illuminated emergency exit sign above a doorway',
        badges: [['Egress guide', 'hot'], ['6 min read', ''], ['Audit-ready', 'green']],
        intro: ['Exit signs are only useful when a person under stress can see, read and obey them at the moment of decision.', 'Most failures are mundane: a sign hidden behind a door, an arrow pointing to a corridor that changes direction, or a fitting mounted too high to notice.'],
        points: [
          ['Visibility', 'Put the sign in the sightline', 'Signs should be visible from the approach, not only from directly beneath them. Check sightlines at eye level and in smoke-free conditions.'],
          ['Mounting', 'Fix at a consistent height', 'Keep mounting heights consistent across a route so people do not have to search for the next sign.'],
          ['Direction', 'Point to the next decision, not the final door', 'Arrows should direct people to the immediate route. Reassess after refits that move a corridor or add a partition.'],
          ['Illumination', 'Pair signs with route lighting', 'A sign without adequate escape lighting can be invisible when it is needed most. Test duration and lux together.'],
          ['Audit', 'Walk the route with fresh eyes', 'Walk each route once as an occupant and once as an auditor. Confusion at a junction is a design defect, not a user error.']
        ],
        takeaways: ['Signs belong in the approach sightline.', 'Arrows must match the immediate route.', 'Test lighting and signage together.'],
        faqs: [['How high should exit signs be mounted?', 'Requirements vary by jurisdiction and ceiling height, but consistency along the route matters as much as the exact figure.'], ['Do photoluminescent signs replace maintained signs?', 'Often no. They can complement them, but the risk assessment and route conditions decide what is acceptable.'], ['When should signs be replaced?', 'After a layout change, on failed illumination tests, or when wording and arrows no longer match the current route.']],
        cta: { eyebrow: 'Check the route', title: 'Want a signage route survey?', text: 'We walk each escape route, mark decision points and issue a sign schedule your installer can follow.', points: ['Route survey', 'Sign schedule'], button: 'Get a survey', art: 'EGRESS', mark: 'EXIT' }
      },
      'facility-fire-safety-handbook': {
        tag: 'Guide', meta: '60 PAGES · HANDBOOK', title: ["The facility manager's", 'fire safety handbook.'],
        summary: 'Sixty pages of plain-language guidance covering detection, suppression, egress, inspections, records and emergency response.',
        hero: 15513841, article: 15513841, articleAlt: 'Emergency exit door in an industrial building',
        badges: [['Free download', 'hot'], ['Updated 2026', 'green'], ['PDF · 8.2 MB', '']],
        intro: ['Written by our senior engineers and updated annually, this is the reference we hand to new clients — and the one our own technicians use.', 'It is deliberately practical: short chapters, clear decision points and checklists you can copy into your own procedures.'],
        points: [
          ['Detection', 'Choose coverage before devices', 'Understand occupancy, compartmentation and response time before comparing panels and detectors.'],
          ['Suppression', 'Match the agent to the hazard', 'Water, pre-action and clean-agent systems each solve a different problem. The building and assets decide which one fits.'],
          ['Egress', 'Design for the route people know', 'Clear routes, consistent signs and tested lighting beat complex diagrams nobody can read under stress.'],
          ['Inspections', 'Turn duties into a repeatable cycle', 'Inventory, interval, competent check, dated record and closed defect — repeated consistently across the estate.'],
          ['Response', 'Rehearse the first minute', 'Drills should reveal confusion, not prove perfection. Record surprises and update the plan within seven days.']
        ],
        takeaways: ['One reference for the whole estate.', 'Plain language, not code jargon.', 'Checklists you can put straight into use.'],
        faqs: [['Is the handbook free?', 'Yes. Request a copy and we will send the current edition as a print-ready file.'], ['Is it specific to one jurisdiction?', 'It is written around recognised practice, with local requirements called out where they commonly differ.'], ['Can we brand it for our sites?', 'Yes. Ask us about a site-specific version with your contacts, asset list and assembly points.']],
        cta: { eyebrow: 'Get your copy', title: 'Want the handbook for your team?', text: 'Request the current edition and we will send a print-ready file with a short onboarding guide.', points: ['Print-ready file', 'Updated annually'], button: 'Request the guide', art: 'HANDBOOK', mark: 'PDF' },
        downloads: [['Fire safety handbook index', 'PDF · 2 pages · Print friendly', 'daily-escape-route'], ['Fire drill record template', 'PDF · 640 KB · Editable', 'fire-drill-record']]
      },
      'technical-datasheet': {
        tag: 'Datasheet', meta: 'PRODUCT · TECHNICAL', title: ['Technical datasheet', 'library'],
        summary: 'Ratings, coverage, approvals and installation notes for SafeFlame systems — kept current and ready for your design file.',
        hero: 24503710, article: 24503710, articleAlt: 'Connected safety sensors and control devices',
        badges: [['Technical reference', 'hot'], ['Current edition', 'green'], ['PDF', '']],
        intro: ['A datasheet is useful only when it matches the exact device, variant and installation condition on your drawing.', 'This reference explains how to read the numbers and which documents to request before specifying a product.'],
        points: [
          ['Identify the model', 'Confirm the exact variant', 'Check the part number and revision. Similar-looking devices can have different ratings or approvals.'],
          ['Ratings', 'Read the operating envelope', 'Voltage, current, temperature range and ingress rating matter as much as the headline detection specification.'],
          ['Coverage', 'Use the design limits', 'Spacing and mounting figures assume specific ceiling heights and airflow conditions. Do not extrapolate beyond them.'],
          ['Approvals', 'Match the certificate to the market', 'Ask for the current certificate and confirm it covers the jurisdiction and application you are designing for.'],
          ['Documentation', 'Request the whole pack', 'Datasheet, installation instructions, maintenance schedule and declaration of conformity should travel together.']
        ],
        takeaways: ['Confirm the revision before specifying.', 'Design limits are not suggestions.', 'Request the full document pack.'],
        faqs: [['Do you supplyBIM files?', 'Yes. Ask for the relevant device family and we will send the current model files with the datasheet.'], ['Can you approve an alternative device?', 'Send the part number and we will confirm equivalence against the specification and approvals.'], ['How often are datasheets updated?', 'Whenever a product revision, approval or installation instruction changes. Always check the edition date.']],
        cta: { eyebrow: 'Need a document?', title: 'Want the current datasheet pack?', text: 'Tell us the product family and application, and we will send the matching documents in one file.', points: ['Current revision', 'Complete pack'], button: 'Request documents', art: 'DATASHEET', mark: 'PDF' }
      },
      'designing-exit-route': {
        tag: 'Guide', meta: '6 MIN READ · EVACS', title: ['Designing an exit route', 'people actually follow'],
        summary: 'Signage, lighting and human behaviour — what most evacuation plans overlook until the drill exposes it.',
        hero: 29398063, article: 29398063, articleAlt: 'Illuminated green emergency exit signs in a building hallway',
        badges: [['Egress design', 'hot'], ['6 min read', ''], ['Behaviour-led', 'green']],
        intro: ['People follow routes that feel obvious, not routes that look correct on a drawing. The best design starts by watching how a building is really used.', 'This guide turns observed behaviour into signs, lighting and instructions that hold up under pressure.'],
        points: [
          ['Observe', 'Watch the building at peak time', 'Note which exits people choose, where they slow down and which junctions cause hesitation.'],
          ['Sign', 'Make the next decision obvious', 'Place signs at the decision point with arrows that match the immediate direction of travel.'],
          ['Light', 'Support the route in failure conditions', 'Check lux and duration along the whole route, including turns and changes of level.'],
          ['Simplify', 'Remove choices that need reading', 'A single clear line at the right place beats a wall of procedure nobody can absorb.'],
          ['Test', 'Validate with an unannounced drill', 'Ask people afterwards what they saw and where they hesitated, then change the route accordingly.']
        ],
        takeaways: ['Design for observed behaviour.', 'Signs belong at decision points.', 'Drills reveal hesitation, not just time.'],
        faqs: [['Should we sign every door?', 'No. Sign the decision points and exits that matter. Too many signs can create uncertainty.'], ['What causes most hesitation?', 'A direction change immediately after a sign, poor lighting and doors that do not match the expected route.'], ['Can you review an existing route?', 'Yes. We walk it with your team and issue a marked route drawing with priority changes.']],
        cta: { eyebrow: 'Test the route', title: 'Want an exit route walk?', text: 'We observe real movement, mark decision points and give you a short, costed change list.', points: ['Observed walk', 'Costed changes'], button: 'Book a walk', art: 'ROUTE', mark: 'EXIT' }
      },
      'suppression-health-check': {
        tag: 'Checklist', meta: '4 MIN READ · SYSTEMS', title: ['The 12-point suppression', 'system health check'],
        summary: 'A practical monthly routine for facility teams, with clear thresholds for what to escalate to the service provider.',
        hero: 7241774, article: 7241774, articleAlt: 'Fire sprinkler control valve with red emergency buttons',
        badges: [['Monthly routine', 'hot'], ['4 min read', ''], ['12 points', 'green']],
        intro: ['Most suppression failures are visible before they become serious: a gauge drift, a closed valve, a blocked head or a record that stopped being kept.', 'This monthly routine takes the pulse of the system without pretending to replace annual servicing.'],
        points: [
          ['Gauges', 'Read and record pressures', 'Compare against the normal range and investigate any drift rather than waiting for an alarm condition.'],
          ['Valves', 'Confirm supervised positions', 'Check that valves are open, locked or supervised as designed, and that no recent work left one shut.'],
          ['Heads', 'Look for damage and obstruction', 'Check accessible heads for paint, corrosion, stock storage or ceiling changes that affect discharge.'],
          ['Pump', 'Listen and inspect', 'Check the pump room for leaks, unusual noise, correct controls and a clear access path.'],
          ['Records', 'Close the loop', 'Log each point, attach photographs to defects and confirm who closed each item and when.']
        ],
        takeaways: ['Pressure drift is an early warning.', 'Valves must be supervised.', 'Every defect needs an owner and date.'],
        faqs: [['Is this a full inspection?', 'No. It is a monthly health check between engineer visits and should be recorded as such.'], ['Who may operate valves?', 'Only trained, authorised people. Any deliberate isolation must be logged and reinstated promptly.'], ['What needs urgent escalation?', 'Closed valves, low pressure, damaged heads, pump faults and any obstruction to discharge or access.']],
        cta: { eyebrow: 'Make it monthly', title: 'Want a suppression health check your team can run?', text: 'We will set the twelve points against your actual system and define clear escalation thresholds.', points: ['Site-specific', 'Escalation rules'], button: 'Build the routine', art: '12 POINTS', mark: 'MONTHLY' }
      },
      'conventional-vs-addressable': {
        tag: 'Explainer', meta: '8 MIN READ · DETECTION', title: ['Conventional vs addressable:', 'choosing correctly'],
        summary: 'How to decide based on building size, risk profile and future growth — not on which panel looks newest.',
        hero: 3958649, article: 3958649, articleAlt: 'Red fire alarm panel in a commercial building',
        badges: [['Detection explainer', 'hot'], ['8 min read', ''], ['Decision guide', 'green']],
        intro: ['Conventional and addressable systems both detect fire. The difference is how quickly your team can understand where it is and how easily the system adapts.', 'Use this comparison to decide what the building actually needs before a supplier decides for you.'],
        points: [
          ['Size', 'Count zones, not just devices', 'Small single-zone sites may be well served conventionally. Larger or segmented buildings benefit from device-level identification.'],
          ['Diagnostics', 'Value the fault detail', 'Addressable systems show which device failed. Conventional systems narrow it to a zone and cost engineer time.'],
          ['Logic', 'Match cause and effect to complexity', 'Where HVAC shutdown, access control or phased evacuation is involved, addressable logic is usually easier to manage.'],
          ['Growth', 'Design for the next refit', 'Addressable loops make adding or moving devices simpler and better documented over the life of the building.'],
          ['Cost', 'Compare whole-life cost', 'Include servicing, fault finding and future changes, not only the initial panel price.']
        ],
        takeaways: ['Small and simple can be conventional.', 'Complex logic favours addressable.', 'Compare whole-life cost, not sticker price.'],
        faqs: [['Is addressable always better?', 'No. It is better where diagnostics, logic or future change justify the additional cost and commissioning effort.'], ['Can one panel cover a large site?', 'Often through networked panels, but cable runs, zoning and risk assessment decide the architecture.'], ['What about wireless devices?', 'Wireless can be conventional or addressable. The same decision logic applies once signal and battery management are proven.']],
        cta: { eyebrow: 'Compare properly', title: 'Want both options priced for your site?', text: 'We will survey the building and present conventional and addressable schemes with whole-life notes.', points: ['Two clear options', 'Whole-life notes'], button: 'Compare options', art: 'A / B', mark: 'COMPARE' }
      },
      'exit-routes-under-pressure': {
        tag: 'Guide', meta: '7 MIN READ · EGRESS', title: ['Exit routes that work', 'under pressure'],
        summary: 'Signage, lighting and the human factors behind successful evacuation — including the mistakes a drawing will never reveal.',
        hero: 15513841, article: 15513841, articleAlt: 'Emergency exit door in an industrial building',
        badges: [['Egress guide', 'hot'], ['7 min read', ''], ['Human factors', 'green']],
        intro: ['A route that works on paper can still fail when people hesitate at a junction, ignore a sign or follow the crowd the wrong way.', 'The answer is not more signage. It is a route designed around how people make decisions under stress.'],
        points: [
          ['Clarity', 'Reduce the number of choices', 'Every unmarked junction adds hesitation. Keep the primary route legible and remove misleading alternatives.'],
          ['Signage', 'Put direction where decisions happen', 'Use consistent arrows and wording at each decision point, not only above the final door.'],
          ['Lighting', 'Keep the route visible in failure', 'Test illumination and duration along turns, stairs and level changes as well as straight corridors.'],
          ['Obstructions', 'Walk the route after every refit', 'Temporary storage, new partitions and relocated desks can change a route faster than the drawings are updated.'],
          ['People', 'Ask what occupants actually saw', 'Post-drill questions reveal confusion that a stopwatch hides. Change the route when the answer surprises you.']
        ],
        takeaways: ['Fewer choices mean faster decisions.', 'Refits change routes silently.', 'Ask occupants what they saw.'],
        faqs: [['Why do people ignore signs?', 'Usually because the sign is outside the sightline, ambiguous after a turn, or contradicts what the route appears to do.'], ['How often should routes be reviewed?', 'At least annually and after any layout, tenancy or occupancy change.'], ['Can marshal positions help?', 'Yes, when marshals are placed at genuine decision points with clear instructions and a deputy.']],
        cta: { eyebrow: 'Review the route', title: 'Want an egress review with real occupants?', text: 'We observe movement, identify hesitation points and issue a short list of changes that make the route obvious.', points: ['Occupant observation', 'Short change list'], button: 'Book a review', art: 'EGRESS', mark: 'ROUTE' }
      },
      'stairwell-monthly-check': {
        tag: 'Checklist', meta: '5 MIN READ · ACCESS', title: ['Stairwell safety:', 'the monthly check'],
        summary: 'Seven points that keep your primary escape route dependable between engineer visits.',
        hero: 5294222, article: 5294222, articleAlt: 'Exit sign lighting a building staircase',
        badges: [['Monthly check', 'hot'], ['5 min read', ''], ['7 points', 'green']],
        intro: ['A stairwell is the last defence when lifts are unavailable and corridors fill with smoke. It deserves a short, disciplined monthly check.', 'This routine focuses on the things facilities teams can see and fix quickly.'],
        points: [
          ['Doors', 'Check closing and latching', 'Open each fire door and let it close fully. Report warped doors, missing seals or defective closers.'],
          ['Treads', 'Look for trip hazards', 'Check nosings, loose tiles, damaged carpet and temporary cables on landings.'],
          ['Lighting', 'Confirm escape lighting', 'Check fittings on every landing and record any dark or flickering unit.'],
          ['Signage', 'Confirm floor and exit identity', 'Floor signs and exit direction must remain visible from the stair landing.'],
          ['Storage', 'Keep the stairwell empty', 'No storage, deliveries or waste on landings, even temporarily during busy periods.']
        ],
        takeaways: ['A fire door must close by itself.', 'Landings are not storage areas.', 'Record each check with a date.'],
        faqs: [['How long does the check take?', 'Around ten minutes for a small stairwell, longer where the building has several cores.'], ['Who should sign off the check?', 'A trained facilities operative with a nominated reviewer who sees the completed record each month.'], ['What is urgent?', 'A door that will not close, failed escape lighting or anything blocking the stair width.']],
        cta: { eyebrow: 'Keep it clear', title: 'Want a stairwell walk-through?', text: 'We will walk every core with your team and mark defects against floor and landing.', points: ['Every core', 'Marked defects'], button: 'Book a walk-through', art: 'STAIR', mark: '07' }
      },
      'photoluminescent-vs-maintained': {
        tag: 'Explainer', meta: '6 MIN READ · SIGNAGE', title: ['Photoluminescent vs', 'maintained signage'],
        summary: 'How to choose the right system for each part of your building, with the charging, power and maintenance realities explained.',
        hero: 1871343, article: 1871343, articleAlt: 'Illuminated green emergency exit sign with arrow',
        badges: [['Signage explainer', 'hot'], ['6 min read', ''], ['Selection guide', 'green']],
        intro: ['Both systems point to the exit, but they behave very differently when the lights fail. The right choice depends on route conditions and what the risk assessment expects.', 'This comparison avoids the brochure claims and focuses on charging, visibility and maintenance.'],
        points: [
          ['How they work', 'Charged glow or powered illumination', 'Photoluminescent signs store light and release it in darkness; maintained signs use a power supply and lamp or LED.'],
          ['Where they suit', 'Match the sign to the route', 'Photoluminescent signs work well where charging light is reliable. Maintained signs suit routes needing consistent brightness.'],
          ['Power', 'Account for supply and monitoring', 'Maintained signs need a suitable supply and fault monitoring. Photoluminescent signs need adequate charging illumination.'],
          ['Duration', 'Test against the escape requirement', 'Check brightness and duration against the agreed escape strategy rather than relying on the product headline.'],
          ['Maintenance', 'Inspect both types', 'Clean photoluminescent faces and test maintained signs on the same schedule. A dirty sign fails either way.']
        ],
        takeaways: ['Charging matters as much as glow.', 'Maintained signs need fault monitoring.', 'Clean signs are visible signs.'],
        faqs: [['Are photoluminescent signs allowed everywhere?', 'It depends on the jurisdiction, route and risk assessment. They are often accepted where charging conditions are reliable.'], ['Do maintained signs need a backup supply?', 'Usually they are connected to the emergency lighting supply or have an integral battery, depending on the system design.'], ['Can we mix both types?', 'Yes. Many buildings use maintained signs at exits and photoluminescent markings at low-level route markers.']],
        cta: { eyebrow: 'Choose with confidence', title: 'Want a signage recommendation for each route?', text: 'We assess charging conditions, route lighting and audit expectations before recommending a sign type.', points: ['Route-by-route advice', 'Audit-ready schedule'], button: 'Ask a specialist', art: 'SIGNAGE', mark: 'A / B' }
      }
    };

    const resourceSlug = new URLSearchParams(location.search).get('r');
    const resource = resourceCatalog[resourceSlug] || resourceCatalog['emergency-planning-real-buildings'];
    const resourceSetText = (key, value) => {
      const el = $(`[data-detail="${key}"]`);
      if (el) el.textContent = value;
    };
    const resourceSetAttr = (key, attr, value) => {
      const el = $(`[data-detail="${key}"]`);
      if (el) el.setAttribute(attr, value);
    };
    const resourceSplitTitle = (key, first, accent) => {
      const el = $(`[data-detail="${key}"]`);
      if (!el) return;
      el.textContent = '';
      el.append(document.createTextNode(`${first} `));
      const span = document.createElement('span');
      span.className = 'accent-orange';
      span.textContent = accent;
      el.append(span);
    };
    const resourceSetImage = (key, id, alt, w) => {
      const img = $(`[data-detail="${key}"]`);
      if (img) { img.src = resourcePhoto(id, w); img.alt = alt; }
    };

    document.title = `${resource.title.join(' ')} | SafeFlame`;
    const resourceDesc = $('meta[name="description"]');
    if (resourceDesc) resourceDesc.content = resource.summary;
    const resourceHero = $('[data-detail="hero"]');
    if (resourceHero) resourceHero.style.setProperty('--hero-image', `url('${resourcePhoto(resource.hero, 1600)}')`);
    const resourceBadges = $('[data-detail="badges"]');
    if (resourceBadges) {
      resourceBadges.textContent = '';
      resource.badges.forEach(([label, cls]) => {
        const badge = document.createElement('span');
        badge.className = cls ? `badge ${cls}` : 'badge';
        badge.textContent = label;
        resourceBadges.append(badge);
      });
    }
    resourceSplitTitle('title', resource.title[0], resource.title[1]);
    resourceSetText('summary', resource.summary);
    resourceSetImage('article-image', resource.article, resource.articleAlt, 1200);
    resource.intro.forEach((text, i) => resourceSetText(`intro-${i}`, text));
    resource.points.forEach((point, i) => {
      resourceSetText(`section-${i}-nav`, point[0]);
      resourceSetText(`section-${i}-heading`, point[1]);
      resourceSetText(`section-${i}-body`, point[2]);
      const list = $(`[data-detail="section-${i}-list"]`);
      if (list) {
        list.textContent = '';
        if (Array.isArray(point[3])) {
          point[3].forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            list.append(li);
          });
          list.hidden = false;
        } else {
          list.hidden = true;
        }
      }
      const note = $(`[data-detail="section-${i}-note"]`);
      if (note) {
        note.hidden = !point[4];
        resourceSetText(`section-${i}-note-title`, point[4] ? point[4].title : '');
        resourceSetText(`section-${i}-note-body`, point[4] ? point[4].body : '');
      }
      const quote = $(`[data-detail="section-${i}-quote"]`);
      if (quote) {
        quote.hidden = !point[5];
        quote.textContent = point[5] || '';
      }
    });
    resource.takeaways.forEach((text, i) => resourceSetText(`takeaway-${i}`, text));
    (resource.downloads || defaultDownloads).forEach(([title, sub, key], i) => {
      resourceSetText(`download-${i}-title`, title);
      resourceSetText(`download-${i}-sub`, sub);
      resourceSetAttr(`download-${i}`, 'data-download', key);
    });
    (resource.related || defaultRelated).forEach((relatedSlug, i) => {
      const item = resourceCatalog[relatedSlug] || resourceCatalog['emergency-planning-real-buildings'];
      resourceSetAttr(`related-${i}-link`, 'href', `safety-resource-details.html?r=${relatedSlug}`);
      resourceSetImage(`related-${i}-image`, item.hero, item.articleAlt, 900);
      resourceSetText(`related-${i}-tag`, item.tag);
      resourceSetText(`related-${i}-title`, item.title.join(' '));
      resourceSetText(`related-${i}-text`, item.summary);
    });
    resource.faqs.forEach(([q, a], i) => {
      resourceSetText(`faq-${i}-q`, q);
      resourceSetText(`faq-${i}-a`, a);
    });
    const resourceCtaBand = $('[data-detail="cta-band"]');
    if (resourceCtaBand) resourceCtaBand.dataset.mark = resource.cta.mark;
    resourceSetText('cta-eyebrow', resource.cta.eyebrow);
    resourceSetText('cta-title', resource.cta.title);
    resourceSetText('cta-text', resource.cta.text);
    resourceSetText('cta-point-0', resource.cta.points[0]);
    resourceSetText('cta-point-1', resource.cta.points[1]);
    resourceSetText('cta-button', resource.cta.button);
    resourceSetText('cta-art', resource.cta.art);
  }

  if ($('[data-download]')) {
    const downloads = {
      'daily-escape-route': {
        title: 'Daily escape route walk',
        subtitle: 'One page · A4 · Print friendly',
        sections: [
          ['Route check', ['Corridors, stairwells and exits are clear', 'Fire doors close fully and latch', 'Emergency lighting and exit signs are working', 'Assembly point route is signed and unobstructed']],
          ['Record', ['Date and time:', 'Checked by:', 'Area / floor:', 'Defects logged and reported to']]
        ]
      },
      'extinguisher-log': {
        title: 'Extinguisher monthly log',
        subtitle: 'One page · A4 · 12-month grid',
        sections: [
          ['Monthly record', [
            'January — date / initials / pressure / seal', 'February — date / initials / pressure / seal',
            'March — date / initials / pressure / seal', 'April — date / initials / pressure / seal',
            'May — date / initials / pressure / seal', 'June — date / initials / pressure / seal',
            'July — date / initials / pressure / seal', 'August — date / initials / pressure / seal',
            'September — date / initials / pressure / seal', 'October — date / initials / pressure / seal',
            'November — date / initials / pressure / seal', 'December — date / initials / pressure / seal'
          ]],
          ['Asset', ['Location / asset tag:', 'Type and capacity:', 'Defects found:', 'Signed by:']]
        ]
      },
      'fire-drill-record': {
        title: 'Fire drill record template',
        subtitle: 'Two pages · A4 · Editable',
        sections: [
          ['Drill details', ['Date and time:', 'Scenario and area:', 'Evacuation time:', 'Observed by:']],
          ['Follow-up', ['All persons accounted for', 'Problems logged with location', 'Action owner and due date', 'Signed by:']]
        ]
      },
      'contractor-access': {
        title: 'Contractor site access checklist',
        subtitle: 'One page · A4 · Hot-work ready',
        sections: [
          ['Before arrival', ['Method statement received', 'Risk assessment reviewed', 'Permits issued', 'PPE and site induction confirmed']],
          ['Hot work', ['Hot-work permit number:', 'Fire watch assigned', 'Extinguisher available', 'Area cleared and reinspection completed']]
        ]
      }
    };

    const escapeHtml = value => String(value).replace(/[&<>]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char]));
    const buildDoc = item => {
      const sections = item.sections.map(([heading, rows]) => `
        <section><h2>${escapeHtml(heading)}</h2><ul>${rows.map(row => `<li><span class="box"></span>${escapeHtml(row)}</li>`).join('')}</ul></section>`).join('');
      return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(item.title)}</title><style>@page{size:A4;margin:16mm}body{font-family:Arial,sans-serif;color:#1D2E40;margin:0}header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #C63832;padding-bottom:8px}header strong{font-size:20px;letter-spacing:-.04em}header span{font-size:10px;letter-spacing:.16em;color:#6B7785}h1{font-size:26px;margin:26px 0 4px}.sub{color:#526174;margin:0 0 26px;font-size:13px}section{break-inside:avoid;margin-bottom:24px}h2{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#C63832;border-bottom:1px solid #DDE3E9;padding-bottom:6px}ul{list-style:none;padding:0;margin:0}li{display:flex;gap:10px;align-items:flex-start;padding:9px 0;border-bottom:1px dashed #D8DEE5;font-size:14px}.box{width:14px;height:14px;border:2px solid #1D2E40;flex:none;margin-top:2px}footer{margin-top:34px;font-size:11px;color:#6B7785;border-top:1px solid #DDE3E9;padding-top:8px}@media print{body{background:#fff}}</style></head><body><header><strong>SafeFlame</strong><span>FIRE PROTECTION</span></header><h1>${escapeHtml(item.title)}</h1><p class="sub">${escapeHtml(item.subtitle)}</p>${sections}<footer>SafeFlame · ${escapeHtml(item.title)} · Printed ${new Date().toLocaleDateString()}</footer></body></html>`;
    };

    $$('[data-download]').forEach(btn => btn.addEventListener('click', () => {
      const item = downloads[btn.dataset.download];
      if (!item) return;
      const blob = new Blob([buildDoc(item)], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${btn.dataset.download}.html`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }));
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
