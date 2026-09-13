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
})();
