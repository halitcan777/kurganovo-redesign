// Курганово — интерактив прототипа
(() => {
  const d = document;
  const html = d.documentElement;
  const still = html.classList.contains('still') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ru = n => n.toLocaleString('ru-RU');

  // Прогресс прокрутки
  const bar = d.querySelector('.progress');
  const onScroll = () => {
    const h = html.scrollHeight - innerHeight;
    if (bar) bar.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Мобильное меню
  const burger = d.querySelector('.burger');
  const drawer = d.querySelector('.drawer');
  burger?.addEventListener('click', () => {
    const open = drawer.hidden;
    drawer.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
  });

  // Появление секций и счётчики
  const count = el => {
    const to = +el.dataset.count;
    if (still) { el.textContent = ru(to); return; }
    const t0 = performance.now();
    const step = t => {
      const k = Math.min(1, (t - t0) / 1400);
      el.textContent = ru(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const reveal = el => {
    el.classList.add('on');
    el.querySelectorAll('[data-count]').forEach(count);
  };
  const blocks = d.querySelectorAll('.rv');
  if (still || !('IntersectionObserver' in window)) {
    blocks.forEach(el => el.classList.add('on'));
  } else {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      reveal(e.target);
      io.unobserve(e.target);
    }), { rootMargin: '0px 0px -8% 0px' });
    blocks.forEach(el => {
      el.querySelectorAll('[data-count]').forEach(c => { c.textContent = '0'; });
      io.observe(el);
    });
  }

  // Фильтр номеров
  const rf = d.querySelector('[data-rooms]');
  if (rf) {
    const rows = [...rf.querySelectorAll('.room')];
    const out = rf.querySelector('[data-found]');
    const empty = rf.querySelector('.rooms-empty');
    const state = { g: 'all', c: 'all' };
    const apply = () => {
      let n = 0;
      rows.forEach(r => {
        const team = r.dataset.team === '1';
        const okG = state.g === 'all' || (state.g === 'team' ? team : !team && +r.dataset.guests >= +state.g);
        const okC = state.c === 'all' || r.dataset.corp === state.c;
        r.hidden = !(okG && okC);
        if (okG && okC) n++;
      });
      out.textContent = n;
      empty.hidden = n > 0;
    };
    rf.querySelectorAll('.chip').forEach(b => b.addEventListener('click', () => {
      const key = 'fg' in b.dataset ? 'g' : 'c';
      state[key] = b.dataset[key === 'g' ? 'fg' : 'fc'];
      b.parentElement.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      apply();
    }));
  }

  // Сеансы бассейна: время Екатеринбурга
  const ss = d.querySelector('[data-sessions]');
  if (ss) {
    const parts = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Asia/Yekaterinburg', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const hh = +parts.find(p => p.type === 'hour').value;
    const mm = +parts.find(p => p.type === 'minute').value;
    const now = hh * 60 + mm;
    const hm = m => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
    let next = null;
    let cur = null;
    ss.querySelectorAll('.ses').forEach(s => {
      const st = +s.dataset.start;
      if (st + 45 <= now) s.classList.add('past');
      else if (st <= now) { s.classList.add('now'); cur = cur ?? st; }
      else if (next === null) { s.classList.add('next'); next = st; }
    });
    const status = d.querySelector('[data-status]');
    if (status) {
      const clock = `Сейчас в Курганово <b>${hm(now)}</b>. `;
      status.innerHTML = next !== null
        ? clock + `Ближайший сеанс начнётся в <b>${hm(next)}</b>.`
        : clock + 'Сеансы на сегодня закончились, первый завтра в <b>7:45</b>.';
    }
  }

  // Навигация по прайсам
  const pnav = d.querySelector('.pnav');
  if (pnav && 'IntersectionObserver' in window) {
    const links = new Map([...pnav.querySelectorAll('a')].map(a => [a.hash.slice(1), a]));
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.classList.remove('on'));
      const a = links.get(e.target.id);
      if (!a) return;
      a.classList.add('on');
      if (pnav.scrollWidth > pnav.clientWidth) pnav.scrollTo({ left: a.offsetLeft - 16, behavior: still ? 'auto' : 'smooth' });
    }), { rootMargin: '-30% 0px -60% 0px' });
    d.querySelectorAll('.pblock').forEach(b => io.observe(b));
  }

  // Интерактивная карта территории
  const tm = d.querySelector('[data-territory-map]');
  if (tm) {
    const pins = [...tm.querySelectorAll('[data-map-pin]')];
    const lists = [...d.querySelectorAll('[data-map-list]')];
    const title = tm.querySelector('[data-map-title]');
    const text = tm.querySelector('[data-map-text]');
    const meta = tm.querySelector('[data-map-meta]');
    const features = tm.querySelector('[data-map-features]');
    const action = tm.querySelector('[data-map-link]');
    const cv = tm.querySelector('.tmap-canvas');
    if (cv && cv.scrollWidth > cv.clientWidth) cv.scrollLeft = (cv.scrollWidth - cv.clientWidth) / 2;
    const route = tm.querySelector('[data-map-route]');
    const routeToggle = tm.querySelector('[data-map-route-toggle]');
    const svg = tm.querySelector('.tmap-svg');
    const num = tm.querySelector('.map-detail-num');
    let zoom = 1;
    const drawRoute = pin => {
      const x = Number(pin.dataset.x), y = Number(pin.dataset.y);
      route.setAttribute('d', y > 440 && x < 320 ? `M320 680V440H${x}V${y}` : `M320 680V440H${x === 320 ? 321 : x}V${y}`);
    };
    const select = n => {
      const pin = pins.find(x => x.dataset.n === String(n));
      if (!pin || pin.classList.contains('dim')) return;
      pins.forEach(x => x.classList.toggle('active', x === pin));
      lists.forEach(x => x.classList.toggle('active', x.dataset.n === String(n)));
      title.textContent = pin.dataset.title;
      text.textContent = pin.dataset.text;
      meta.textContent = pin.dataset.meta;
      features.replaceChildren(...pin.dataset.features.split('|').map(value => { const li = d.createElement('li'); li.textContent = value; return li; }));
      action.href = pin.dataset.href;
      action.textContent = pin.dataset.link;
      num.textContent = pin.dataset.n;
      drawRoute(pin);
    };
    pins.forEach(pin => {
      pin.addEventListener('click', () => select(pin.dataset.n));
      pin.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(pin.dataset.n); } });
    });
    lists.forEach(b => b.addEventListener('click', () => select(b.dataset.n)));
    d.querySelectorAll('[data-map-filter]').forEach(b => b.addEventListener('click', () => {
      const cat = b.dataset.mapFilter;
      d.querySelectorAll('[data-map-filter]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      pins.forEach(pin => pin.classList.toggle('dim', cat !== 'all' && !pin.dataset.cat.split(' ').includes(cat)));
      const first = pins.find(pin => !pin.classList.contains('dim'));
      if (first) select(first.dataset.n);
    }));
    routeToggle.addEventListener('click', () => {
      const on = routeToggle.getAttribute('aria-pressed') !== 'true';
      routeToggle.setAttribute('aria-pressed', String(on));
      route.classList.toggle('on', on);
    });
    tm.querySelectorAll('[data-map-zoom]').forEach(button => button.addEventListener('click', () => {
      zoom = button.dataset.mapZoom === 'reset' ? 1 : Math.max(1, Math.min(1.6, zoom + (button.dataset.mapZoom === 'in' ? .2 : -.2)));
      svg.style.transform = `scale(${zoom})`;
      tm.querySelector('[data-map-zoom="reset"]').textContent = `${Math.round(zoom * 100)}%`;
    }));
    select(1);
  }

  // Демо-форма
  const toast = d.querySelector('.toast');
  let tt;
  d.querySelectorAll('form[data-demo]').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    const phone = f.querySelector('[name=phone]');
    if (!phone.value.replace(/\D/g, '').length) { phone.focus(); return; }
    toast.textContent = 'Это прототип: заявка никуда не ушла. Позвоните по номеру 282-90-10.';
    toast.classList.add('on');
    clearTimeout(tt);
    tt = setTimeout(() => toast.classList.remove('on'), 4200);
  }));

  // Просмотр фото на весь экран: фото внутри контента (не ссылки-плитки, не шапки)
  const zs = [...d.querySelectorAll('main .ph img')].filter(i => !i.closest('a'));
  if (zs.length) {
    const lb = d.createElement('div'); lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Просмотр фото');
    lb.innerHTML = '<figure style="margin:0;display:contents"><img alt=""><figcaption></figcaption></figure><button class="lb-x" aria-label="Закрыть">×</button><button class="lb-p" aria-label="Предыдущее фото">‹</button><button class="lb-n" aria-label="Следующее фото">›</button>';
    d.body.appendChild(lb);
    const im = lb.querySelector('img'), cap = lb.querySelector('figcaption');
    let k = 0;
    const show = i => { k = (i + zs.length) % zs.length; im.src = zs[k].currentSrc || zs[k].src; im.alt = zs[k].alt; cap.textContent = zs[k].alt; };
    const close = () => lb.classList.remove('on');
    zs.forEach((z, i) => { z.classList.add('zoomable'); z.addEventListener('click', () => { show(i); lb.classList.add('on'); lb.querySelector('.lb-x').focus(); }); });
    lb.querySelector('.lb-x').addEventListener('click', close);
    lb.querySelector('.lb-p').addEventListener('click', e => { e.stopPropagation(); show(k - 1); });
    lb.querySelector('.lb-n').addEventListener('click', e => { e.stopPropagation(); show(k + 1); });
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    d.addEventListener('keydown', e => { if (!lb.classList.contains('on')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(k - 1); if (e.key === 'ArrowRight') show(k + 1); });
  }
})();
