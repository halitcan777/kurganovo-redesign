// Сборка прототипа «Курганово»: node src/build.mjs → *.html в корне сайта
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site, nav, phones, clients, docs, territory, prices, rooms, poolSessions } from './data.mjs';
import { icons } from './icons.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://halitcan777.github.io/kurganovo-redesign/';
const V = Date.now().toString(36);

// ––– помощники –––
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ic = (name, cls = '') => `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
const P = Object.fromEntries(prices.map(p => [p.id, p]));
const photo = (name, alt, { eager = false, cls = '', pos = '' } = {}) =>
  `<img src="assets/img/${name}.webp" alt="${esc(alt)}"${cls ? ` class="${cls}"` : ''}${pos ? ` style="object-position:${pos}"` : ''}${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;
const slot = (label, cls = 'ar43') => `<div class="ph imgph ${cls}"><span>${esc(label)}</span></div>`;
const checks = items => `<ul class="facts">${items.map(t => `<li>${ic('check')}<span>${t}</span></li>`).join('')}</ul>`;
const plist = items => `<ul class="plist">${items.map(([a, b]) => `<li><span>${a}</span><span>${b}</span></li>`).join('')}</ul>`;
const PRICE_NOTE = `Цены из прайса комплекса на ${site.priceValid}.`;
const privacy = docs.find(d => /персональных/.test(d.title)).href;

// ––– таблицы цен –––
const NUMCELL = /^(–|[\d\s /–.,]+)$/;
const table = t => {
  const keep = t.head.map((h, j) => h !== '' || t.rows.some(r => (r[j] ?? '') !== ''));
  const head = t.head.filter((_, j) => keep[j]);
  const rows = t.rows.map(r => r.filter((_, j) => keep[j]));
  const num = head.map((_, j) => j > 0 && (j >= 2 || rows.every(r => NUMCELL.test(r[j] ?? ''))));
  const cell = (c, j) => `<td data-l="${esc(head[j])}"${num[j] ? ' class="num"' : ''}>${esc(c)}</td>`;
  return `${t.caption ? `<h3 class="tcap">${esc(t.caption)}</h3>` : ''}<div class="twrap"><table class="ptable"><thead><tr>${head.map((h, j) => `<th${num[j] ? ' class="num"' : ''}>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(cell).join('')}</tr>`).join('')}</tbody></table></div>`;
};
const priceBlock = (p, level = 2) => `<section class="pblock" id="${p.id}"><h${level} class="ptitle">${esc(p.title)}</h${level}>${p.note ? `<p class="pnote">${esc(p.note)} Цены в рублях.</p>` : ''}${p.tables.map(table).join('')}</section>`;

// ––– каркас –––
const head = ({ title, desc, file }) => `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="noindex">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Курганово">
<meta property="og:url" content="${BASE}${file === 'index.html' ? '' : file}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${BASE}assets/img/og.jpg">
<meta name="theme-color" content="#003631">
<link rel="preload" href="assets/fonts/onest-cyrillic.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/site.css?v=${V}">
<script>document.documentElement.classList.add('js');if(/[?&]still/.test(location.search))document.documentElement.classList.add('still')</script>
</head>`;

const wordmark = () => `<a class="wordmark" href="index.html" aria-label="Курганово, на главную"><small>спортивный комплекс</small><b>Курганово</b></a>`;

const header = file => `<div class="progress" aria-hidden="true"></div>
<div class="proto">Прототип нового сайта. Тексты, цены и фото взяты с kurganovo.com 13.09.2026</div>
<header class="hdr">
  <div class="wrap hdr-in">
    ${wordmark()}
    <nav class="nav" aria-label="Разделы">${nav.map(n => `<a href="${n.href}"${n.href === file ? ' aria-current="page"' : ''}>${n.label}</a>`).join('')}</nav>
    <a class="hdr-phone" href="${site.phoneHref}"><span class="ph-long">${site.phone}</span><span class="ph-short">${site.phoneShort}</span><small>администратор, круглосуточно</small></a>
    <button class="burger" type="button" aria-label="Меню" aria-expanded="false" aria-controls="drawer">${ic('menu', 'i-menu')}${ic('x', 'i-x')}</button>
  </div>
  <nav class="drawer" id="drawer" hidden aria-label="Меню">${nav.map(n => `<a href="${n.href}"${n.href === file ? ' aria-current="page"' : ''}>${n.label}</a>`).join('')}<a class="btn" href="${site.phoneHref}">${ic('phone')}Позвонить: ${site.phoneShort}</a></nav>
</header>`;

const footer = () => `<footer class="ftr">
  <div class="wrap">
    <div class="ftr-main">
      <div>${wordmark()}<p class="ftr-addr">${esc(site.address)}<br>${esc(site.addressNote)}</p><p class="ftr-addr">${esc(site.office)}</p></div>
      <nav class="ftr-col" aria-label="Разделы сайта"><b>Разделы</b>${nav.map(n => `<a href="${n.href}">${n.label}</a>`).join('')}</nav>
      <div><b>Прямые телефоны</b><div class="ftr-ph">${phones.slice(1, 4).map(p => `<div><a href="${p.href}">${p.num}</a><span>${esc(p.topic)}</span></div>`).join('')}</div></div>
      <div class="ftr-col"><b>Гостям</b>${docs.filter(d => /Правила|Политика/.test(d.title)).map(d => `<a href="${d.href}" target="_blank" rel="noopener">${esc(d.title)}</a>`).join('')}<a href="kontakty.html#dokumenty">Документы и лицензии</a><a href="${site.vk}" target="_blank" rel="noopener">ВКонтакте</a></div>
    </div>
    <div class="ftr-bot"><span>ООО «СК Курганово» · ООО «Комфорт»</span><span>Прототип редизайна kurganovo.com, сентябрь 2026</span></div>
  </div>
</footer>`;

const TOPICS = ['Проживание', 'Спорт и сборы', 'Мероприятие', 'Бассейн и фитнес', 'Другое'];
const form = topic => `<form class="form" data-demo novalidate>
  <h3>Оставить заявку</h3>
  <p class="form-sub">Администратор перезвонит и уточнит детали.</p>
  <div class="row2"><label>Имя<input name="name" autocomplete="name"></label><label>Телефон<input name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="+7"></label></div>
  <div class="row2"><label>Что планируете<select name="topic">${TOPICS.map(t => `<option${t === topic ? ' selected' : ''}>${t}</option>`).join('')}</select></label><label>Дата<input name="date" type="date"></label></div>
  <label>Комментарий<textarea name="msg" placeholder="Сколько гостей и какие услуги нужны"></textarea></label>
  <button class="btn" type="submit">${ic('send')}Отправить заявку</button>
  <p class="consent">Нажимая кнопку, вы соглашаетесь с <a href="${privacy}" target="_blank" rel="noopener">политикой обработки персональных данных</a>.</p>
</form>`;

const cta = (title, topic = '') => `<section class="sec cta" id="zayavka">
  <div class="wrap g">
    <div class="s6 rv">
      <p class="kicker">На связи круглосуточно</p>
      <h2>${title}</h2>
      <a class="cta-phone" href="${site.phoneHref}">${site.phone}</a>
      <ul class="cta-list">
        <li>${ic('map-pin')}<span>${esc(site.address)}, ${esc(site.addressNote)}</span></li>
        <li>${ic('car')}<span>На машине: по Полевскому тракту до села Курганово, дальше по указателям</span></li>
        <li>${ic('bus')}<span>На автобусе: рейсовый от Южного автовокзала, ул. 8 Марта, 145</span></li>
      </ul>
    </div>
    <div class="s6 rv">${form(topic)}</div>
  </div>
</section>`;

const phero = ({ crumb, kicker, h1, lead, image, alt, pos }) => `<section class="phero">
  ${photo(image, alt, { eager: true, cls: 'hero-img', pos })}
  <div class="wrap">
    <nav class="crumbs" aria-label="Навигация"><a href="index.html">Главная</a><span>/</span><span>${crumb}</span></nav>
    ${kicker ? `<p class="kicker">${kicker}</p>` : ''}
    <h1>${h1}</h1>
    <p class="hero-lead">${lead}</p>
  </div>
</section>`;

const lhero = ({ crumb, h1, lead, extra = '' }) => `<section class="lhero">
  <div class="wrap">
    <nav class="crumbs" aria-label="Навигация"><a href="index.html">Главная</a><span>/</span><span>${crumb}</span></nav>
    <h1>${h1}</h1>
    <p class="hero-lead">${lead}</p>
    ${extra}
  </div>
</section>`;

const mapSpots = [
  { n: 1, cat: 'stay sport food family', title: 'Главный корпус', meta: 'Центр комплекса', text: 'Здесь начинается знакомство с Курганово: ресепшн, две ледовые арены, зал игровых видов спорта и все основные сервисы.', features: 'Ресепшн|Олимпийская и Канадская арены|Спортбар|Гостиница|Детская комната|Прокат', href: 'sport.html', link: 'Спорт и арены', x: 650, y: 230 },
  { n: 2, cat: 'stay sport', title: 'Корпус «Европа»', meta: 'Проживание и фитнес', text: 'Гостиничный корпус рядом с главным зданием. Удобен для команд, семей и гостей длительных сборов.', features: 'Номера разных категорий|Зал фитнеса|Бильярд|Корпус «Европа+»', href: 'prozhivanie.html', link: 'Выбрать номер', x: 370, y: 170 },
  { n: 3, cat: 'stay event food', title: 'Корпус «Азия»', meta: 'Проживание и деловые события', text: 'Отдельный гостиничный корпус со своей столовой и двумя конференц-залами. Подходит для сборов и корпоративных заездов.', features: 'Гостиница|Столовая|Конференц-зал на 60 мест|Конференц-зал на 50 мест', href: 'meropriyatiya.html', link: 'Конференции и события', x: 930, y: 315 },
  { n: 4, cat: 'service', title: 'Въезд и охрана', meta: 'Начало маршрута', text: 'Главный автомобильный въезд с постом охраны. Отсюда дорога ведёт к парковке и главному корпусу.', features: 'Пост охраны|Въезд к парковке|Пеший маршрут по территории', href: 'kontakty.html', link: 'Как добраться', x: 225, y: 520 },
  { n: 5, cat: 'service', title: 'Парковка', meta: 'Рядом с главным корпусом', text: 'Основная парковочная зона комплекса. Подходит для легковых машин и автобусов спортивных команд.', features: 'Легковые автомобили|Места для автобусов|Короткий путь до ресепшн', href: 'kontakty.html', link: 'Адрес и маршрут', x: 390, y: 355 },
  { n: 6, cat: 'food event', title: 'Гриль-бар «Овертайм»', meta: 'Еда и банкеты', text: 'Отдельный гриль-бар в зелёной части территории. Здесь можно поесть, забронировать стол или обсудить банкетное меню.', features: 'Гриль-меню|Зал до 40 гостей|Банкетное обслуживание|Бронь столов', href: 'meropriyatiya.html', link: 'Мероприятия и меню', x: 195, y: 260 },
  { n: 7, cat: 'stay family', title: 'Коттеджи', meta: 'Отдых отдельной компанией', text: 'Два дома из оцилиндрованного бревна в тихой части комплекса. Подходят для большой семьи или компании друзей.', features: 'До 15 гостей|10–12 спальных мест|Три спальни|Мини-кухня|Терраса с мангалом', href: 'prozhivanie.html', link: 'Коттеджи и цены', x: 215, y: 165 },
  { n: 8, cat: 'event family', title: 'Большая беседка', meta: 'Площадка до 50 гостей', text: 'Большая крытая беседка для праздников и встреч на свежем воздухе. Находится рядом с гриль-баром.', features: 'До 50 гостей|Мебель|Освещение|Крытая площадка', href: 'meropriyatiya.html', link: 'Все площадки', x: 280, y: 300 },
  { n: 9, cat: 'sport spa', title: 'Спортивная зона', meta: 'Бассейн, фитнес и SPA', text: 'Крупная крытая спортивная зона за главным корпусом. Здесь собраны водные, силовые и восстановительные направления.', features: 'Бассейн 25 м|Тренажёрный зал|Зал единоборств|Хоккейный тир|Велокласс|SPA-услуги', href: 'bassein.html', link: 'Бассейн и SPA', x: 845, y: 210 },
  { n: 10, cat: 'sport', title: 'Футбольное поле', meta: 'Открытая спортивная площадка', text: 'Поле с искусственным покрытием рядом со спортивной зоной. Используется для тренировок и сборов.', features: 'Искусственная трава|Размер 40 × 20 м|Почасовая аренда', href: 'sport.html', link: 'Спортивные площадки', x: 930, y: 245 },
  { n: 11, cat: 'sport', title: 'Волейбольная площадка', meta: 'Открытая спортивная площадка', text: 'Отдельная площадка для волейбола в восточной части территории.', features: 'Размер 18 × 9 м|Искусственное покрытие|Почасовая аренда', href: 'sport.html', link: 'Спортивные площадки', x: 1050, y: 300 },
  { n: 12, cat: 'sport event', title: 'Пейнтбол и лазертаг', meta: 'Лесная игровая зона', text: 'Отдельная лесная территория для командных игр и корпоративных программ.', features: 'Пейнтбол|Лазертаг|Командные сценарии|Лесная площадка', href: 'meropriyatiya.html', link: 'Программы для команд', x: 875, y: 82 },
  { n: 13, cat: 'event food', title: 'Шатёр', meta: 'Площадка до 100 гостей', text: 'Крупная крытая площадка в центре территории. Подходит для свадеб, корпоративов и больших семейных праздников.', features: 'До 100 гостей|Мебель|Бетонный пол|Банкетное обслуживание', href: 'meropriyatiya.html', link: 'Шатёр и другие площадки', x: 675, y: 420 },
  { n: 14, cat: 'family', title: 'Детский городок', meta: 'Игровая зона на улице', text: 'Открытая площадка для детей рядом с шатром и спортивными площадками.', features: 'Горки|Игровые элементы|Уличная зона', href: 'meropriyatiya.html', link: 'Детские праздники', x: 770, y: 455 },
  { n: 15, cat: 'sport', title: 'Стритбол', meta: 'Открытая спортивная площадка', text: 'Асфальтовая площадка для уличного баскетбола в южной части комплекса.', features: 'Площадка 30 × 30 м|Асфальтовое покрытие|Почасовая аренда', href: 'sport.html', link: 'Спортивные площадки', x: 920, y: 455 },
  ...[16,17,18,19].map((n, i) => ({ n, cat: 'event family', title: `Беседка №${i + 2}`, meta: 'Отдых у воды', text: 'Отдельная беседка в южной части территории. Подходит для небольшой компании и семейного отдыха.', features: 'До 10 гостей|Мангал|Освещение|Рядом с берегом', href: 'meropriyatiya.html', link: 'Беседки и цены', x: 600 + i * 82, y: 540 + i * 18 })),
  { n: 20, cat: 'spa stay family', title: 'Бани', meta: 'Три отдельных дома', text: 'Банная зона в лесной части комплекса. Каждая баня имеет свою парную и комнату отдыха.', features: '«Деревенька»|«Охотничья»|«Легенды хоккея»|Парные и зоны отдыха', href: 'prozhivanie.html', link: 'Бани и цены', x: 235, y: 405 },
  { n: 21, cat: 'family event', title: 'Пляж', meta: 'Берег водохранилища', text: 'Береговая зона на западной границе комплекса. Отсюда открывается вид на Верхне-Макаровское водохранилище.', features: 'Береговая зона|Вид на водохранилище|Рядом с лесом', href: 'meropriyatiya.html', link: 'Площадки у воды', x: 85, y: 120 },
];

const mapGraphic = interactive => `<svg class="tmap-svg" viewBox="0 0 1200 680" role="img" aria-label="Схема территории спортивного комплекса Курганово">
  <defs><pattern id="trees" width="48" height="48" patternUnits="userSpaceOnUse"><circle cx="12" cy="16" r="10" fill="#003631" fill-opacity=".14"/><circle cx="29" cy="32" r="14" fill="#003631" fill-opacity=".09"/><circle cx="43" cy="11" r="8" fill="#003631" fill-opacity=".22"/></pattern><pattern id="parking" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(22)"><path d="M0 2h22" stroke="#fff" stroke-width="3" opacity=".75"/></pattern></defs>
  <rect width="1200" height="680" rx="28" fill="#f3f3f3"/>
  <path d="M0 0H155L138 680H0Z" fill="#003631" fill-opacity=".07"/><path d="M0 58H152M0 105H148M0 152H145" stroke="#fff" stroke-opacity=".6" stroke-width="3"/>
  <path d="M25 180L205 190 170 650 25 660ZM770 10L1180 14 1175 192 825 165ZM985 500L1200 470V680H1030Z" fill="url(#trees)" opacity=".92"/>
  <g class="map-roads"><path d="M155 680C165 555 258 470 380 415C455 380 475 330 500 245L540 0"/><path d="M335 420C485 395 565 367 700 365H1200"/><path d="M420 286C585 315 725 340 860 357"/></g>
  <path class="map-parking" d="M300 295L466 319 438 397 270 374Z" fill="url(#parking)"/>
  <g class="map-buildings">
    <path d="M492 92L638 105 622 294 468 282Z"/><path d="M642 104L788 122 802 306 623 294Z"/><path class="admin" d="M570 292L754 305Q778 309 790 336L794 363 552 337Q556 307 570 292Z"/>
    <path d="M304 91L425 111 410 161 455 169 432 271 289 244Z"/>
    <path d="M805 126L934 151 916 321 798 298Z"/>
    <path d="M871 308L1014 337 996 430 851 401Z"/>
    <text x="550" y="190">АРЕНА</text><text x="686" y="208">АРЕНА</text><text x="340" y="210">ЕВРОПА</text><text x="836" y="255">СПОРТ</text><text x="895" y="385">АЗИЯ</text>
  </g>
  <g class="map-fields"><rect x="954" y="170" width="191" height="108" rx="10"/><rect x="1010" y="290" width="130" height="65" rx="8"/><rect x="864" y="430" width="145" height="72" rx="8"/><path d="M990 185v78M969 224h160M1024 185v78M1075 185v78M1110 185v78"/></g>
  <g class="map-small"><path d="M164 115l52 10 24 36-18 45-70-14-16-39z"/><rect x="145" y="224" width="82" height="55" rx="8"/><path d="M238 266l92 14-11 62-91-14z"/><path d="M176 367l128 18-11 69-127-18z"/>${[0,1,2,3].map(i => `<path d="M${565+i*82} ${520+i*18}l28-18 28 18v38h-56z"/>`).join('')}</g>
  <g class="map-labels" aria-hidden="true"><text x="46" y="340" transform="rotate(-88 46 340)">ВЕРХНЕ-МАКАРОВСКОЕ ВОДОХРАНИЛИЩЕ</text><text x="945" y="45">СОСНОВЫЙ ЛЕС</text><text x="172" y="586">ВЪЕЗД</text><path d="M190 565l28-28"/><path d="M211 538h9v9"/></g>
  <g class="map-compass" aria-hidden="true" transform="translate(1125 75)"><circle r="31"/><path d="M0-22L8 7 0 3-8 7Z"/><text y="22">С</text></g>
  <path class="map-route" data-map-route d=""/>
  ${mapSpots.map((s, i) => `<g class="map-pin${i === 0 ? ' active' : ''}" data-map-pin data-n="${s.n}" data-cat="${s.cat}" data-title="${esc(s.title)}" data-meta="${esc(s.meta)}" data-features="${esc(s.features)}" data-href="${s.href}" data-link="${esc(s.link)}" data-x="${s.x}" data-y="${s.y}" transform="translate(${s.x} ${s.y})"${interactive ? ` role="button" tabindex="0" aria-label="${s.n}. ${esc(s.title)}"` : ''}><circle r="24"/><text y="1">${s.n}</text></g>`).join('')}
</svg>`;

const planBlock = () => `<section class="sec bg2" id="plan">
  <div class="wrap">
    <div class="sec-head rv"><h2>21 объект на одной территории</h2><p>Новая схема показывает, где находятся корпуса, спортивные зоны, бани, беседки и пляж.</p></div>
    <a class="map-preview rv" href="territoriya.html">${mapGraphic(false)}<span class="btn btn-accent">Открыть интерактивную карту</span></a>
  </div>
</section>`;

const territoryPage = `${lhero({ crumb: 'Территория', h1: 'Всё Курганово на одной карте', lead: 'Выберите объект на схеме, чтобы узнать, что находится внутри или рядом.' })}
<section class="sec map-page"><div class="wrap">
  <div class="map-filters" aria-label="Фильтры карты"><button class="chip" data-map-filter="all" aria-pressed="true">Всё</button><button class="chip" data-map-filter="stay">Проживание</button><button class="chip" data-map-filter="sport">Спорт</button><button class="chip" data-map-filter="event">Мероприятия</button><button class="chip" data-map-filter="spa">SPA</button><button class="chip" data-map-filter="family">Для семьи</button></div>
  <div class="tmap-layout" data-territory-map><div class="tmap-canvas"><div class="map-tools" aria-label="Управление картой"><button type="button" data-map-zoom="out" aria-label="Уменьшить">−</button><button type="button" data-map-zoom="reset" aria-label="Исходный масштаб">100%</button><button type="button" data-map-zoom="in" aria-label="Увеличить">+</button><button type="button" class="map-route-toggle" data-map-route-toggle aria-pressed="false">Маршрут от въезда</button></div>${mapGraphic(true)}</div><aside class="map-detail" aria-live="polite"><span class="map-detail-num">1</span><p class="kicker">Объект на карте</p><p class="map-detail-meta" data-map-meta>${mapSpots[0].meta}</p><h2 data-map-title>${mapSpots[0].title}</h2><p data-map-text>${mapSpots[0].text}</p><ul class="map-detail-features" data-map-features>${mapSpots[0].features.split('|').map(x => `<li>${esc(x)}</li>`).join('')}</ul><a class="link" data-map-link href="${mapSpots[0].href}">${mapSpots[0].link}</a></aside></div>
  <div class="map-index">${mapSpots.map(s => `<button data-map-list data-n="${s.n}"><b>${s.n}</b><span>${esc(s.title)}</span></button>`).join('')}</div>
</div></section>${cta('Нужна помощь с маршрутом по комплексу?')}`;

const page = (file, meta, body) => writeFileSync(join(ROOT, file), `${head({ ...meta, file })}
<body>
${header(file)}
<main>
${body}
</main>
${footer()}
<div class="toast" role="status" aria-live="polite"></div>
<script src="assets/app.js?v=${V}" defer></script>
</body>
</html>
`);

page('territoriya.html', { title: 'Интерактивная карта территории – Курганово', desc: 'Корпуса, спортивные зоны, бани, беседки и пляж на интерактивной схеме Курганово.' }, territoryPage);

// ═════════ Главная ═════════
const tiles = [
  { href: 'prozhivanie.html', t: 'Проживание', p: 'Номера в четырёх корпусах, два коттеджа из бревна и три бани.', price: 'номер от 4 500 ₽', image: 'cottage', alt: 'Коттедж из оцилиндрованного бревна', pos: '60% 50%' },
  { href: 'sport.html', t: 'Спорт', p: 'Две ледовые арены, залы на 530 и 272 м², сборы с проживанием и питанием.', price: 'лёд 11 700 ₽ в час', image: 'hockey-2', alt: 'Хоккейный матч на арене комплекса', pos: '38% 50%' },
  { href: 'meropriyatiya.html', t: 'Мероприятия', p: 'Беседки у воды, шатёр, гриль-бар и конференц-залы. Свадьбы с регистрацией на берегу.', price: 'беседка от 800 ₽', image: 'wedding', alt: 'Выездная регистрация на берегу водохранилища', pos: '45% 50%' },
  { href: 'bassein.html', t: 'Бассейн и SPA', p: '25 метров, три дорожки, сауна входит в сеанс. Тренажёрный зал, массаж, соляная сауна.', price: 'сеанс 480 ₽', image: 'pool-swim', alt: 'Пловец на дорожке бассейна', pos: '50% 60%' },
];
const scenarios = [
  { t: 'Сборы команды', items: [['Многоместный номер', '2 500 ₽ за место'], ['Аренда льда', '11 700 ₽ в час'], ['Зал игровых видов, 530 м²', '2 800 ₽ в час'], ['Табло и судейская аппаратура', '2 500 ₽ за игру'], ['Питание в столовой', 'по заявке']], href: 'sport.html', more: 'Всё о сборах' },
  { t: 'Корпоратив на 100 гостей', items: [['Шатёр до 100 человек', '40 000 ₽'], ['Большая беседка до 50 человек', '25 000 ₽'], ['Квиз для компании, 100 минут', '42 000 ₽'], ['Конференц-зал на 60 мест', '1 800 ₽ в час'], ['Нахождение на территории', '170 ₽ с гостя']], href: 'meropriyatiya.html', more: 'Все площадки' },
  { t: 'Выходные с семьёй', items: [['Семейный номер-студия', '10 000 ₽ в сутки'], ['Баня «Деревенька»', 'от 2 500 ₽ в час'], ['Массовое катание', '300 ₽, детям 3–6 лет 200 ₽'], ['Бассейн', '480 ₽, детям 350 ₽'], ['Детская комната', '100 ₽ в час']], href: 'prozhivanie.html', more: 'Выбрать номер' },
];

page('index.html', {
  title: 'Курганово – спортивный комплекс и база отдыха на Полевском тракте',
  desc: 'Две ледовые арены, бассейн 25 м, гостиница, бани и площадки для праздников на берегу Верхне-Макаровского водохранилища.',
}, `<section class="hero">
  ${photo('hero-facade-v3', 'Главный корпус спортивного комплекса «Курганово»', { eager: true, cls: 'hero-img', pos: '58% 50%' })}
  <div class="wrap">
    <div class="hero-panel">
      <p class="kicker">Спорт и отдых у воды</p>
      <h1>Место, где хочется остаться</h1>
      <p class="hero-lead">Лёд, бассейн, гостиница и сосновый берег в одохранилища. Всё для сборов, выходных и больших событий в одном месте.</p>
      <div class="hero-cta">
        <a class="btn btn-accent" href="${site.phoneHref}">${ic('phone')}Позвонить: ${site.phoneShort}</a>
        <a class="hero-link" href="prozhivanie.html">Посмотреть варианты</a>
      </div>
    </div>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="sec-head rv"><h2>Четыре направления на одной территории</h2><p>Приезжайте на тренировку и оставайтесь на выходные: гостиница, бани и каток работают в одном комплексе.</p></div>
    <div class="tiles">${tiles.map(t => `<a class="tile rv" href="${t.href}">${photo(t.image, t.alt, { pos: t.pos })}<div class="tile-b"><h3>${t.t}</h3><p>${t.p}</p><span class="tile-price">${t.price}</span></div></a>`).join('')}</div>
  </div>
</section>

<section class="sec peak">
  <div class="wrap">
    <div class="g peak-g">
      <div class="s7 rv">
        <p class="kicker">Олимпийская арена</p>
        <div class="peak-num" data-count="1500">1 500</div>
        <p class="peak-lead">зрителей на трибунах. Здесь проходят турниры по хоккею, фигурному катанию и шорт-треку, а в свободные от аренды часы открыто массовое катание.</p>
      </div>
      <div class="s5 rv"><div class="ph ar45">${photo('skating', 'Синхронное катание на арене комплекса', { pos: '60% 50%' })}</div></div>
    </div>
    <div class="stats rv">
      <div><b data-count="500">500</b><small>зрителей на Канадской арене</small></div>
      <div><b><span data-count="530">530</span> м²</b><small>зал игровых видов спорта</small></div>
      <div><b><span data-count="25">25</span> м</b><small>бассейн на три дорожки</small></div>
      <div><b data-count="15">15</b><small>видов спорта для соревнований</small></div>
    </div>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="sec-head rv"><h2>С чем к нам обычно едут</h2><p>Три частых запроса и сколько стоит каждая часть. ${PRICE_NOTE}</p></div>
    <div class="g">${scenarios.map(s => `<article class="card s4 rv"><h3>${s.t}</h3>${plist(s.items)}<a class="link" href="${s.href}">${s.more}</a></article>`).join('')}</div>
  </div>
</section>

<section class="sec">
  <div class="wrap g rating">
    <div class="s5 rv">
      <p class="kicker">Отзывы гостей</p>
      <div class="rate-num">${site.rating.value}</div>
      <div class="stars" aria-label="Пять звёзд из пяти">${ic('star').repeat(5)}</div>
      <p class="rate-lead">${site.rating.ratings} оценок и ${site.rating.reviews} отзыва на Яндекс Картах. Комплекс получил знак «${site.rating.award}».</p>
      <p>Чаще всего гости отмечают персонал, чистоту и расположение.</p>
      <a class="btn btn-tint" href="${site.rating.url}" target="_blank" rel="noopener">${ic('star')}Читать отзывы на Яндекс Картах</a>
    </div>
    <div class="s7 rv">
      <div class="collage">
        <div class="ph c1">${photo('lake', 'Деревянный стол под соснами на берегу водохранилища')}</div>
        <div class="ph c2">${photo('facade', 'Главный корпус с ледовыми аренами')}</div>
      </div>
    </div>
  </div>
</section>

${planBlock()}

<section class="sec-tight clients">
  <div class="wrap"><p class="kicker">Наши клиенты и партнёры</p></div>
  <div class="marquee" aria-label="Клиенты: ${esc(clients.join(', '))}"><div class="marquee-track" aria-hidden="true">${[...clients, ...clients].map(c => `<span>${esc(c)}</span>`).join('')}</div></div>
</section>

${cta('Позвоните, и администратор подберёт номер, площадку или время на льду')}`);

// ═════════ Проживание ═════════
const corpLabel = c => (c === 'Главный' ? 'Главный корпус' : `Корпус «${c}»`);
const baths = [
  { name: 'Баня «Деревенька»', image: 'bania', alt: 'Гостевая комната в бане с самоваром', text: 'Русская парная из осины на берёзовых дровах. Гостевая комната с обеденной зоной, посудой и чайником.', guests: 'до 8 гостей', wd: '2 500 ₽', we: '3 000 ₽' },
  { name: 'Баня «Охотничья»', image: 'bania-2', alt: 'Вход в баню «Охотничья»', text: 'Парная из осины, берёзовые дрова и интерьер в охотничьем стиле.', guests: 'до 8 гостей', wd: '2 500 ₽', we: '3 000 ₽' },
  { name: 'Баня «Легенды хоккея»', image: null, text: 'Два этажа, кухня, две спальни с балконом и хоккейный интерьер. Можно снять на сутки за 23 000 ₽, выезд до 16:00.', guests: 'до 15 гостей', wd: '3 500 ₽', we: '5 000 ₽' },
];

page('prozhivanie.html', {
  title: 'Проживание: номера, коттеджи и бани – Курганово',
  desc: 'Номера от 4 500 ₽ в сутки в четырёх корпусах, коттеджи из бревна на 15 гостей и три русские бани.',
}, `${phero({ crumb: 'Проживание', kicker: 'Гостиница · коттеджи · бани', h1: 'Номера, коттеджи и бани у водохранилища', lead: 'Четыре корпуса: «Европа», «Европа Плюс», «Азия» и Главный. Цена за номер в сутки уже включает двух гостей.', image: 'cottage-hero-v2', alt: 'Коттедж из бревна в сосновом лесу', pos: '70% 55%' })}

<section class="sec" data-rooms>
  <div class="wrap">
    <div class="sec-head rv"><h2>Номера и цены</h2><p>Дополнительное место стоит 1 500 ₽. В дни хоккейных турниров цены назначает организатор. ${PRICE_NOTE}</p></div>
    <div class="filters">
      <div class="chips" role="group" aria-label="Сколько гостей">${[['all', 'Любое число гостей'], ['2', 'Вдвоём'], ['3', 'Втроём'], ['4', 'Семьёй, до 4 гостей'], ['team', 'Для команды']].map(([v, l], i) => `<button class="chip" type="button" data-fg="${v}" aria-pressed="${i === 0}">${l}</button>`).join('')}</div>
      <div class="chips" role="group" aria-label="Корпус">${[['all', 'Все корпуса'], ['Европа', '«Европа»'], ['Европа Плюс', '«Европа Плюс»'], ['Азия', '«Азия»'], ['Главный', 'Главный корпус']].map(([v, l], i) => `<button class="chip" type="button" data-fc="${v}" aria-pressed="${i === 0}">${l}</button>`).join('')}</div>
    </div>
    <p class="found">Подходит номеров: <b data-found>${rooms.length}</b></p>
    <div class="rooms">${rooms.map(r => `<div class="room" data-guests="${r.guests}" data-corp="${r.corp}" data-team="${r.perBed ? 1 : 0}">
      <div class="room-main"><b>${esc(r.name)}</b><span class="room-meta">${corpLabel(r.corp)}${r.area ? ` · ${r.area}` : ''} · ${r.perBed ? 'от 4 гостей' : r.guests === 1 ? '1 гость' : `до ${r.guests} гостей`}</span><p>${esc(r.note)}</p></div>
      <div class="room-price"><b>${r.price.toLocaleString('ru-RU')} ₽</b><small>${r.perBed ? 'за место в сутки' : 'за номер в сутки'}</small>${r.extra ? '<small>доп. место 1 500 ₽</small>' : ''}</div>
    </div>`).join('')}</div>
    <p class="rooms-empty" hidden>Под такой запрос номеров нет. Позвоните по номеру 282-90-10, администратор подберёт вариант.</p>
    <div class="g gal">
      <figure class="s4 rv"><div class="ph ar43">${photo('room', 'Номер-лофт с кирпичной стеной')}</div><figcaption class="cap">«Джуниор Сюит» в корпусе «Европа», номер-лофт</figcaption></figure>
      <figure class="s4 rv"><div class="ph ar43">${photo('room-2', 'Гостиная в номере «Джуниор Сюит»')}</div><figcaption class="cap">Гостиная в двухкомнатном номере</figcaption></figure>
      <figure class="s4 rv">${slot('Фото номера «Семейный панорамный»')}<figcaption class="cap">Нужен свежий кадр от комплекса</figcaption></figure>
    </div>
  </div>
</section>

<section class="sec dark">
  <div class="wrap g peak-g">
    <div class="s6 rv"><div class="ph ar43">${photo('cottage', 'Коттедж из оцилиндрованного бревна с зелёной крышей')}</div></div>
    <div class="s6 rv">
      <p class="kicker">Коттеджи</p>
      <h2>Два дома из бревна на 15 гостей</h2>
      <p class="big-price">23 000 ₽ <small>в сутки</small></p>
      ${checks(['Три спальни, 10–12 спальных мест', 'Гостиная с обеденной зоной на 10 человек', 'Мини-кухня: холодильник, СВЧ, чайник, посуда', 'Санузел и душевая', 'Терраса с мангалом'])}
      <a class="btn btn-light" href="${site.phoneHref}">${ic('phone')}Забронировать: ${site.phoneShort}</a>
    </div>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="sec-head rv"><h2>Три русские бани</h2><p>Минимум 2 часа. Простыня и шапка входят в стоимость, веник стоит 400 ₽. Горячее можно заказать прямо в баню из гриль-бара «Овертайм».</p></div>
    <div class="g">${baths.map(b => `<article class="s4 bcard rv">${b.image ? `<div class="ph ar43">${photo(b.image, b.alt)}</div>` : slot(`Фото бани «Легенды хоккея»`)}<h3>${b.name}</h3><p>${b.text}</p>${plist([['Понедельник – четверг', `${b.wd} в час`], ['Пятница – воскресенье', `${b.we} в час`], ['Вместимость', b.guests]])}</article>`).join('')}</div>
  </div>
</section>

<section class="sec-tight bg2">
  <div class="wrap">
    <h2 class="rv" style="margin-bottom:32px">Дополнительные услуги</h2>
    <div class="services rv">${[['150 ₽', 'стирка белья и спортивной формы, за кг'], ['1 500 ₽', 'проживание с питомцем, в сутки'], ['100 ₽', 'автостоянка, в сутки'], ['10 ₽', 'печать документов, за лист']].map(([a, b]) => `<div><b>${a}</b><span>${b}</span></div>`).join('')}</div>
  </div>
</section>

${cta('Позвоните, и администратор подберёт номер под ваши даты', 'Проживание')}`);

// ═════════ Спорт ═════════
const feats = [
  ['bed-double', 'Проживание', 'Многоместные номера для команд по 2 500 ₽ за место. Для тренеров и родителей – номера от 4 500 ₽.'],
  ['utensils', 'Питание', 'Комплексное питание в столовой корпуса «Азия». Перекусить между тренировками можно в спорт-баре.'],
  ['snowflake', 'Лёд', 'Две крытые арены, раздевалки на день, прокат и заточка коньков.'],
  ['dumbbell', 'Залы и поля', 'Зал игровых видов 530 м², спортзал 272 м², зал единоборств с пятью рингами, велокласс на 15 мест, футбольное поле.'],
  ['trophy', 'Соревнования', 'Электронное табло и судейская аппаратура, судейство на время турнира. Соревнования по 15 видам спорта.'],
  ['waves', 'Восстановление', 'Бассейн с сауной, массаж, соляная сауна и русские бани.'],
];

page('sport.html', {
  title: 'Спорт: ледовые арены, залы и сборы – Курганово',
  desc: 'Аренда льда 11 700 ₽ в час, залы 530 и 272 м², сборы с проживанием, питанием и судейством.',
}, `${phero({ crumb: 'Спорт', kicker: 'Лёд · залы · сборы', h1: 'Лёд, залы и сборы под ключ', lead: 'Две крытые арены, зал игровых видов 530 м² и открытые поля. Команду можно разместить, накормить и обеспечить судейством в одном месте.', image: 'hockey-hero-v2', alt: 'Хоккейный матч у борта с логотипом «Курганово»', pos: '40% 45%' })}

<section class="sec">
  <div class="wrap">
    <div class="sec-head rv"><h2>Две крытые ледовые арены</h2><p>Хоккей, фигурное катание и шорт-трек: от тренировки любительской команды до турнира с полными трибунами.</p></div>
    <div class="g">
      <article class="s6 acard rv"><div class="ph ar32">${photo('arena', 'Ледовая арена с трибунами, вид сверху')}</div><h3>Олимпийская арена</h3><p class="cap-num">1 500 зрителей</p><p>Турниры по хоккею, фигурному катанию и шорт-треку с электронным табло и судейской аппаратурой.</p></article>
      <article class="s6 acard rv"><div class="ph ar32">${photo('figure', 'Занятие по фигурному катанию на льду')}</div><h3>Канадская арена</h3><p class="cap-num">500 зрителей</p><p>Тренировки команд и массовое катание в часы, свободные от аренды.</p></article>
    </div>
    <div class="rv" style="margin-top:56px">${priceBlock(P.led, 3)}</div>
  </div>
</section>

<section class="sec dark">
  <div class="wrap">
    <div class="sec-head rv"><p class="kicker">Для спортивных команд</p><h2>Сборы: жильё, питание, лёд и залы на одной территории</h2></div>
    <div class="feats rv">${feats.map(([i, t, p]) => `<div class="feat">${ic(i)}<h3>${t}</h3><p>${p}</p></div>`).join('')}</div>
    <div class="feat-cta rv"><p>Для спортивных групп действует отдельный прайс. Его пришлёт отдел продаж под даты и состав команды.</p><a class="btn btn-light" href="tel:+73432829004">${ic('phone')}Отдел продаж: 282-90-04</a></div>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="sec-head rv"><h2>Залы и открытые площадки</h2><p>Аренда ежедневно с 8:00 до 22:00, у залов охраняемая парковка.</p></div>
    <div class="gallery rv">
      <figure><div class="ph">${photo('hall', 'Зал игровых видов спорта')}</div><figcaption class="cap">Зал игровых видов, 530 м²</figcaption></figure>
      <figure><div class="ph">${photo('boxing', 'Зал единоборств с грушами')}</div><figcaption class="cap">Зал единоборств: пять рингов, десять груш</figcaption></figure>
      <figure><div class="ph">${photo('field', 'Стритбольная площадка и беседка, вид сверху')}</div><figcaption class="cap">Стритбольная площадка</figcaption></figure>
    </div>
    <div class="rv" style="margin-top:56px">${priceBlock(P.zaly, 3)}</div>
  </div>
</section>

<section class="sec bg2">
  <div class="wrap">
    <div class="sec-head rv"><h2>Тренажёр, лагеря и школа фигурного катания</h2></div>
    <div class="g">
      <article class="card s4 rv"><h3>Хоккейный тренажёр Rapid Shot</h3><p>Компьютерная система для отработки точности и скорости броска. Подходит и профессионалам, и любителям.</p><p class="price-line">1 000 ₽ в час, 500 ₽ за 30 минут</p></article>
      <article class="card s4 rv"><h3>Детские спортивные лагеря</h3><p>Для детей 7–16 лет: хоккейные лагеря с тренерами из Северной Америки и Канады, лагерь по плаванию, лагеря активного отдыха.</p><span class="todo">Даты смен и цены на 2026 год уточняем у комплекса</span></article>
      <article class="card s4 rv"><h3>Школа фигурного катания «Золотой конёк»</h3><p>Детей берут с 3,5–4 лет и в любое время года. Начинающим советуют три тренировки на льду по 60 минут и одну в зале.</p><span class="todo">Расписание и тренеры на сезон 2026/27 уточняем</span></article>
    </div>
  </div>
</section>

${cta('Расскажите о команде и датах, отдел продаж соберёт программу сборов', 'Спорт и сборы')}`);

// ═════════ Мероприятия ═════════
const venues = [
  { n: 10, name: 'Беседка у воды', sub: 'Пять беседок с мангалом и светом', price: '800 ₽', unit: 'за час, 3 часа – 2 000 ₽' },
  { n: 12, name: 'Гриль-домик', sub: 'Домики на 8 и на 12 гостей', price: '2 000–3 000 ₽', unit: 'за 3 часа' },
  { n: 40, name: 'Гриль-бар «Овертайм»', sub: 'Кухня с грилем, банкетное меню', price: 'по меню', unit: 'служба питания 282-90-02' },
  { n: 50, name: 'Большая беседка', sub: 'Мебель и свет', price: '25 000 ₽', unit: 'за мероприятие' },
  { n: 60, name: 'Конференц-зал', sub: 'Проектор, флипчарт, кондиционер. Второй зал на 50 мест', price: '1 800 ₽', unit: 'за час, минимум 2 часа' },
  { n: 100, name: 'Шатёр', sub: 'Мебель и бетонный пол', price: '40 000 ₽', unit: 'за мероприятие' },
  { n: 100, name: 'Спорт-бар', sub: 'Закрытый зал для банкета в любую погоду', price: 'по запросу', unit: 'отдел продаж 282-90-04' },
];
const lw = n => `${Math.round((Math.log(n) / Math.log(1500)) * 100)}%`;
const formats = [
  { t: 'Корпоратив и спартакиада', image: 'tent', alt: 'Шатёр на поляне', p: 'Турниры по хоккею, мини-футболу и волейболу с судейством. Зимой лыжня, летом пляж и пейнтбол.', items: [['Квест 18+ для коллег', '1 800 ₽ с человека'], ['Квиз, 100 минут', '42 000 ₽'], ['Ведущий и диджей', '97 000 ₽']] },
  { t: 'Конференция и семинар', image: null, slot: 'Фото конференц-зала', p: 'Два зала на 50 и 60 мест в корпусе «Азия». Рядом номера для участников и столовая.', items: [['Зал №1, 60 мест', '1 800 ₽ в час'], ['Зал №2, 50 мест', '1 200 ₽ в час'], ['Аренда от 8 часов', 'скидка 10%']] },
  { t: 'Свадьба', image: 'wedding-2', alt: 'Украшенный шатёр для свадебного банкета', p: 'Регистрация на берегу, банкет в шатре или спорт-баре, номера для гостей. На второй день баня, каток и лодки.', items: [['Зона под регистрацию', 'от 5 000 ₽ в час'], ['Шатёр до 100 гостей', '40 000 ₽'], ['Ведущий и диджей', '97 000 ₽']] },
  { t: 'Детский праздник', image: 'kids', alt: 'Детский городок с горками', p: 'Квесты студии «Халва», детская комната и уличный городок с горками.', items: [['Квест 6–15 лет, от 15 детей', '1 600 ₽ с человека'], ['Детская комната под праздник', '2 000 ₽ в час'], ['Уличная площадка', '3 500 ₽ в день']] },
];

page('meropriyatiya.html', {
  title: 'Мероприятия: корпоративы, свадьбы, конференции – Курганово',
  desc: 'Площадки на 10, 50 и 100 гостей, конференц-залы и арена на 1 500 зрителей. Регистрация на берегу водохранилища.',
}, `${phero({ crumb: 'Мероприятия', kicker: 'Праздники · корпоративы · конференции', h1: 'Праздник на берегу или турнир на арене', lead: 'Площадки на 10, 50 и 100 гостей и арена на 1 500 зрителей. Банкет готовит своя служба питания.', image: 'wedding-hero-v3', alt: 'Выездная регистрация на берегу водохранилища', pos: '45% 60%' })}

<section class="sec">
  <div class="wrap">
    <div class="sec-head rv"><h2>Площадки по числу гостей</h2><p>От беседки на компанию друзей до трибун на полторы тысячи человек. ${PRICE_NOTE}</p></div>
    <ol class="ladder rv">
      ${venues.map(v => `<li><div class="lad-num">${v.n}<small>гостей</small></div><div class="lad-name"><b>${v.name}</b><span>${v.sub}</span><div class="lad-bar"><i style="--w:${lw(v.n)}"></i></div></div><div class="lad-price">${v.price}<small>${v.unit}</small></div></li>`).join('')}
      <li class="lad-top"><div class="lad-num">1 500<small>зрителей</small></div><div class="lad-name"><b>Олимпийская арена</b><span>Турниры, ледовые шоу и спартакиады с трибунами</span><div class="lad-bar"><i style="--w:100%"></i></div></div><div class="lad-price">11 700 ₽<small>аренда льда в час</small></div></li>
    </ol>
  </div>
</section>

<section class="sec bg2">
  <div class="wrap">
    <div class="sec-head rv"><h2>Что проводим чаще всего</h2></div>
    <div class="g">${formats.map(f => `<article class="s6 fcard rv">${f.image ? `<div class="ph ar32">${photo(f.image, f.alt)}</div>` : slot(f.slot, 'ar32')}<div class="fcard-b"><h3>${f.t}</h3><p>${f.p}</p>${plist(f.items)}</div></article>`).join('')}</div>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="sec-head rv"><h2>Как выглядят площадки</h2></div>
    <div class="gallery rv">${[['tent', 'Шатёр'], ['grill-terrace', 'Летняя веранда гриль-бара'], ['grillbar', 'Гриль-бар «Овертайм»'], ['besedka-big', 'Большая беседка'], ['besedki', 'Беседки с мангалом'], ['sportbar', 'Зал спорт-бара']].map(([i, c]) => `<figure><div class="ph">${photo(i, c)}</div><figcaption class="cap">${c}</figcaption></figure>`).join('')}</div>
  </div>
</section>

<section class="sec bg2">
  <div class="wrap">
    <div class="sec-head rv"><h2>Цены на площадки и программы</h2></div>
    <div class="event-price-groups rv">${[P.besedki, P.konferenc, P.kvesty].map(p => priceBlock(p, 3)).join('')}</div>
  </div>
</section>

${cta('Расскажите, какой праздник планируете, и мы предложим площадку и меню', 'Мероприятие')}`);

// ═════════ Бассейн и SPA ═════════
const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const hm = m => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;

page('bassein.html', {
  title: 'Бассейн, тренажёрный зал и SPA – Курганово',
  desc: 'Бассейн 25 м на три дорожки, сеанс 480 ₽ с сауной. Тренажёрный зал, массаж, соляная сауна и карты на месяц.',
}, `${phero({ crumb: 'Бассейн и SPA', kicker: 'Бассейн · тренажёрный зал · SPA', h1: 'Бассейн 25 метров, тренажёрный зал и SPA', lead: 'Три дорожки, глубина 1,5 м. Сеанс длится 45 минут, сауна входит в стоимость.', image: 'pool-hero-v3', alt: 'Бассейн на три дорожки', pos: '50% 60%' })}

<section class="sec">
  <div class="wrap g">
    <div class="s7 rv">
      <h2 style="margin-bottom:16px">Сеансы каждый день с 7:45</h2>
      <p class="status" data-status>Сеанс длится 45 минут, выбирайте удобное время.</p>
      <div class="sessions" data-sessions>${poolSessions.map(s => `<div class="ses" data-start="${toMin(s)}"><b>${s}</b><small>до ${hm(toMin(s) + 45)}</small></div>`).join('')}</div>
      <p class="note"><span class="todo">Технологический перерыв по будням 13:00–15:00 – уточняем, действует ли он сейчас</span></p>
    </div>
    <div class="s5 rv">
      <div class="infocard">
        <h3>Перед первым визитом</h3>
        ${checks(['Бассейн 25 × 6 м, глубина 1,5 м, не больше 8 человек на дорожке', 'Дети – с 7 лет. С 7 до 12 лет нужна справка от педиатра, она действует 3 месяца', 'С собой: шапочка, купальник, сменная обувь и мыльные принадлежности', 'Санитарный день раз в месяц. Дату подскажет администратор: 282-90-05'])}
      </div>
    </div>
    <div class="s12 rv" style="margin-top:32px">${priceBlock(P.bassein, 3)}</div>
  </div>
</section>

<section class="sec dark">
  <div class="wrap g peak-g">
    <div class="s6 rv"><div class="ph ar32">${photo('gym', 'Тренажёрный зал со свободными весами')}</div></div>
    <div class="s6 rv">
      <p class="kicker">Фитнес</p>
      <h2>Тренажёрный зал и зал единоборств</h2>
      ${checks(['Профессиональные тренажёры, TRX и кроссфит', 'Персональные тренировки и программа под вашу цель', 'Пять боксёрских рингов и десять груш', 'После тренировки сауна в подарок', 'В тренажёрный зал пускают с 15 лет'])}
      <a class="btn btn-light" href="tel:+73432829005">${ic('phone')}Спортивная зона: 282-90-05</a>
    </div>
  </div>
</section>

<section class="sec">
  <div class="wrap g">
    <div class="s6 rv">${priceBlock(P.trenazher, 3)}</div>
    <div class="s6 rv"><div class="ph ar32" style="margin-bottom:32px">${photo('salt-sauna', 'Соляная сауна с подсвеченными соляными блоками')}</div>${priceBlock(P.spa, 3)}<p class="note">В соляной сауне 55–65 °C и влажность 20–40%.</p></div>
  </div>
</section>

<section class="sec bg2">
  <div class="wrap">
    <div class="sec-head rv"><h2>Карты на месяц</h2><p>Бассейн, тренажёрный зал и зал бокса без ограничения посещений, не чаще раза в день. ${PRICE_NOTE}</p></div>
    <div class="rv">${priceBlock({ ...P.karty, note: '' }, 3)}</div>
  </div>
</section>

${cta('Запишитесь на сеанс или персональную тренировку', 'Бассейн и фитнес')}`);

// ═════════ Цены ═════════
const groups = [
  ['Проживание', ['evropa', 'azia', 'bani', 'kottedzhi']],
  ['Мероприятия', ['besedki', 'konferenc', 'kvesty']],
  ['Спорт', ['led', 'zaly']],
  ['Бассейн и фитнес', ['bassein', 'trenazher', 'spa', 'karty']],
  ['Досуг и реклама', ['dosug', 'reklama']],
];

page('ceny.html', {
  title: 'Цены – Курганово',
  desc: 'Все 16 прайсов спортивного комплекса «Курганово» текстом: номера, бани, лёд, залы, бассейн, мероприятия.',
}, `${lhero({ crumb: 'Цены', h1: 'Цены', lead: 'Все 16 прайсов комплекса текстом, без картинок. Их удобно искать и читать с телефона.', extra: `<p class="validity">${ic('info')}<span>Прайсы действовали с 1 февраля по 31 августа 2026 года. Новые цены уточняйте у администратора: <a class="link" href="${site.phoneHref}">${site.phoneShort}</a>.</span></p>` })}

<section class="sec">
  <div class="wrap g">
    <nav class="pnav s3" aria-label="Разделы прайса">${groups.map(([g, ids]) => `<p>${g}</p>${ids.map(id => `<a href="#${id}">${esc(P[id].title)}</a>`).join('')}`).join('')}</nav>
    <div class="s9">${groups.flatMap(([, ids]) => ids).map(id => priceBlock(P[id])).join('')}</div>
  </div>
</section>

${cta('Не нашли услугу? Позвоните, администратор подскажет цену')}`);

// ═════════ Контакты ═════════
page('kontakty.html', {
  title: 'Контакты и как добраться – Курганово',
  desc: 'Свердловская обл., с. Курганово, ул. Береговая, 2А. 30-й км Полевского тракта. Администратор круглосуточно: 282-90-10.',
}, `${lhero({ crumb: 'Контакты', h1: 'Как добраться и куда звонить', lead: `${esc(site.address)}. ${esc(site.addressNote)}.` })}

<section class="sec">
  <div class="wrap g">
    <div class="s5 rv">
      <div class="callcard">
        <p>Администратор гостиницы, круглосуточно</p>
        <a class="cta-phone" href="${site.phoneHref}">${site.phone}</a>
        <p style="margin-top:16px">Номера, коттеджи, бани и любые общие вопросы.</p>
      </div>
      <ul class="phones">${phones.slice(1).map(p => `<li><span>${esc(p.topic)}</span><a href="${p.href}">${p.num}</a><small>${esc(p.note)}</small></li>`).join('')}</ul>
    </div>
    <div class="s7 rv">
      <div class="map"><iframe src="${site.mapWidget}" title="Курганово на Яндекс Картах" loading="lazy" allowfullscreen></iframe></div>
      <ul class="facts">
        <li>${ic('car')}<span>На машине: по Полевскому тракту до села Курганово, дальше по указателям. Есть парковка, в том числе для автобусов.</span></li>
        <li>${ic('bus')}<span>На автобусе: рейсовый от Южного автовокзала Екатеринбурга, ул. 8 Марта, 145, до села Курганово.</span></li>
        <li>${ic('map-pin')}<span>${esc(site.office)}.</span></li>
      </ul>
    </div>
  </div>
</section>

${planBlock()}

<section class="sec" id="dokumenty">
  <div class="wrap g">
    <div class="s7 rv">
      <h2 style="margin-bottom:24px">Документы</h2>
      <ul class="docs">${docs.map(d => `<li><a href="${d.href}" target="_blank" rel="noopener">${ic('file-text')}<span>${esc(d.title)}</span></a></li>`).join('')}</ul>
    </div>
    <div class="s5 rv">
      <div class="infocard">
        <h3>Реквизиты</h3>
        ${checks(['ООО «СК Курганово»', 'ООО «Комфорт»'])}
        <p class="note"><span class="todo">ИНН, ОГРН и юрлицо для подвала запрашиваем у комплекса</span></p>
        <p class="note"><a class="link" href="${site.vk}" target="_blank" rel="noopener">Сообщество ВКонтакте</a></p>
      </div>
    </div>
  </div>
</section>

${cta('Оставьте заявку, и администратор перезвонит')}`);

console.log('Готово: 8 страниц');
