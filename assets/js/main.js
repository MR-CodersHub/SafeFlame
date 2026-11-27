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
