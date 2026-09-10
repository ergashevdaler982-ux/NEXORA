/* ============================================================
   NEXORA WebApp — Soft UI • UZ / RU / EN • Telegram WebApp
   ============================================================ */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtMoney = (n) => Number(n || 0).toLocaleString('ru-RU');
const fmtDate = (s) => { try { return new Date(String(s).replace(' ', 'T')).toLocaleString(S.lang === 'ru' ? 'ru-RU' : S.lang === 'en' ? 'en-US' : 'uz-UZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return s || ''; } };

/* ---------------- i18n ---------------- */
const I18N = {
  uz: {
    nav_games: 'O‘yinlar', nav_orders: 'Buyurtmalar', nav_profile: 'Profil', nav_support: 'Yordam',
    boot_loading: 'Yuklanmoqda…',
    hero_kicker: 'Rasmiy donat markazi', hero_t1: 'Sevimli o‘yining uchun', hero_t2: 'donat ol',
    hero_sub: 'Robux • UC • FC Points — bir necha daqiqada hisobingda.',
    hb_fast: 'Tez yetkazish', hb_safe: 'Xavfsiz to‘lov', hb_nopass: 'Parol so‘ralmaydi',
    games_title: 'O‘yinni tanlang', games_sub: '3 ta o‘yin • rasmiy paketlar',
    pkgs: '{n} ta paket', from: 'dan',
    back: 'Orqaga', buy: 'Sotib olish', next: 'Davom etish', close: 'Yopish',
    step1: 'Paket', step2: 'Ma’lumot', step3: 'To‘lov', step4: 'Chek', step5: 'Tayyor',
    info_title: 'Ma’lumotlaringiz', f_first: 'Ism', f_last: 'Familiya', f_player: 'O‘yin ID / Nickname',
    f_player_hint: 'Masalan: PUBG ID 5123456789 yoki Roblox nick. Parolingizni HECH QAYERGA yozmang.',
    ph_first: 'Ismingiz', ph_last: 'Familiyangiz', ph_player: 'Player ID / username',
    pay_title: 'To‘lov qiling', pay_amount: 'To‘lov summasi', pay_choose: 'To‘lov usulini tanlang',
    pay_copy: 'Nusxalash', copied: 'Nusxalandi!', pay_go: 'To‘lov qildim — davom etish',
    rc_title: 'Chekni yuklang', rc_hint: 'To‘lov cheki skrinshotini yuklang (JPG/PNG/WebP, 8MB gacha)',
    rc_btn: 'Buyurtmani yuborish', rc_change: 'Boshqa rasm', rc_later: 'Keyinroq yuklayman',
    done_title: 'Buyurtma qabul qilindi!', done_sub: 'Admin to‘lovingizni tekshirib, paketni tez orada faollashtiradi. Holatni «Buyurtmalar» bo‘limida kuzating.',
    done_orders: 'Buyurtmalarim', done_menu: 'Bosh menyu',
    ord_title: 'Buyurtmalarim', ord_sub: 'Barcha xaridlar tarixi',
    ord_empty_t: 'Hali buyurtmalar yo‘q', ord_empty_s: 'O‘yin tanlab, birinchi donatingizni oling!',
    ord_go: 'O‘yinlarga o‘tish',
    d_game: 'O‘yin', d_pkg: 'Paket', d_price: 'Narx', d_date: 'Sana', d_status: 'Holat', d_code: 'Buyurtma ID',
    d_player: 'Player ID', d_name: 'Mijoz', d_receipt: 'Chek', d_history: 'Holat tarixi', d_note: 'Admin izohi',
    d_reupload: 'Chekni qayta yuklash', d_view: 'Chekni ko‘rish',
    st_pending: 'Kutilmoqda', st_paid: 'To‘langan', st_processing: 'Jarayonda', st_completed: 'Bajarildi', st_cancelled: 'Bekor qilindi',
    pr_title: 'Mening profilim', pr_orders: 'Buyurtmalar', pr_spent: 'Jami xarid', pr_lang: 'Til / Язык / Language',
    pr_theme: 'Mavzu', th_dark: 'Tun', th_light: 'Kun', pr_id: 'Telegram ID', pr_uname: 'Username',
    pr_save: 'Saqlash', pr_saved: 'Profil saqlandi!',
    sup_title: 'Yordam markazi', sup_btn: 'Adminga yozish', sup_info_t: 'Qanday ishlaydi?',
    sup_1: 'Paketni tanlang va ma’lumotlarni kiriting', sup_2: 'Karta orqali to‘lov qiling va chekni yuklang', sup_3: 'Admin tasdiqlagach, donat hisobingizga tushadi',
    secure_note: 'Xavfsizlik: biz o‘yin parolingizni hech qachon so‘ramaymiz va saqlamaymiz. Faqat ochiq Player ID / nick kerak.',
    lang_title: 'Tilni tanlang', v_first: 'Ismingizni kiriting', v_player: 'Player ID / nick kiriting (min 2 belgi)',
    v_file: 'Avval chek rasmini tanlang', v_method: 'To‘lov usulini tanlang',
    err_net: 'Internet xatosi. Qayta urining.', t_created: 'Buyurtma yaratildi!', t_receipt: 'Chek yuborildi!',
    pay_note: 'To‘lovdan so‘ng chekni yuklashni unutmang — aks holda buyurtma tekshirilmaydi.',
  },
  ru: {
    nav_games: 'Игры', nav_orders: 'Заказы', nav_profile: 'Профиль', nav_support: 'Помощь',
    boot_loading: 'Загрузка…',
    hero_kicker: 'Официальный центр доната', hero_t1: 'Донат для твоей', hero_t2: 'любимой игры',
    hero_sub: 'Robux • UC • FC Points — на счету за пару минут.',
    hb_fast: 'Быстрая доставка', hb_safe: 'Безопасная оплата', hb_nopass: 'Пароль не нужен',
    games_title: 'Выбери игру', games_sub: '3 игры • официальные пакеты',
    pkgs: 'Пакетов: {n}', from: 'от',
    back: 'Назад', buy: 'Купить', next: 'Продолжить', close: 'Закрыть',
    step1: 'Пакет', step2: 'Данные', step3: 'Оплата', step4: 'Чек', step5: 'Готово',
    info_title: 'Ваши данные', f_first: 'Имя', f_last: 'Фамилия', f_player: 'ID игры / Ник',
    f_player_hint: 'Например: PUBG ID 5123456789 или ник Roblox. НИКОГДА не пишите свой пароль.',
    ph_first: 'Ваше имя', ph_last: 'Ваша фамилия', ph_player: 'Player ID / username',
    pay_title: 'Оплатите заказ', pay_amount: 'Сумма оплаты', pay_choose: 'Выберите способ оплаты',
    pay_copy: 'Копировать', copied: 'Скопировано!', pay_go: 'Я оплатил — продолжить',
    rc_title: 'Загрузите чек', rc_hint: 'Загрузите скриншот чека (JPG/PNG/WebP, до 8MB)',
    rc_btn: 'Отправить заказ', rc_change: 'Другое фото', rc_later: 'Загружу позже',
    done_title: 'Заказ принят!', done_sub: 'Админ проверит оплату и скоро активирует пакет. Статус смотрите в разделе «Заказы».',
    done_orders: 'Мои заказы', done_menu: 'Главное меню',
    ord_title: 'Мои заказы', ord_sub: 'История всех покупок',
    ord_empty_t: 'Заказов пока нет', ord_empty_s: 'Выбери игру и получи первый донат!',
    ord_go: 'К играм',
    d_game: 'Игра', d_pkg: 'Пакет', d_price: 'Цена', d_date: 'Дата', d_status: 'Статус', d_code: 'ID заказа',
    d_player: 'Player ID', d_name: 'Клиент', d_receipt: 'Чек', d_history: 'История статусов', d_note: 'Комментарий',
    d_reupload: 'Загрузить чек заново', d_view: 'Смотреть чек',
    st_pending: 'Ожидает', st_paid: 'Оплачен', st_processing: 'В обработке', st_completed: 'Выполнен', st_cancelled: 'Отменён',
    pr_title: 'Мой профиль', pr_orders: 'Заказы', pr_spent: 'Всего потрачено', pr_lang: 'Til / Язык / Language',
    pr_theme: 'Тема', th_dark: 'Ночь', th_light: 'День', pr_id: 'Telegram ID', pr_uname: 'Username',
    pr_save: 'Сохранить', pr_saved: 'Профиль сохранён!',
    sup_title: 'Центр помощи', sup_btn: 'Написать админу', sup_info_t: 'Как это работает?',
    sup_1: 'Выбери пакет и введи данные', sup_2: 'Оплати на карту и загрузи чек', sup_3: 'После проверки админом донат придёт на аккаунт',
    secure_note: 'Безопасность: мы никогда не просим и не храним пароль от игры. Нужен только открытый Player ID / ник.',
    lang_title: 'Выберите язык', v_first: 'Введите имя', v_player: 'Введите Player ID / ник (мин. 2 символа)',
    v_file: 'Сначала выберите фото чека', v_method: 'Выберите способ оплаты',
    err_net: 'Ошибка сети. Попробуй ещё раз.', t_created: 'Заказ создан!', t_receipt: 'Чек отправлен!',
    pay_note: 'Не забудь загрузить чек после оплаты — иначе заказ не будет проверен.',
  },
  en: {
    nav_games: 'Games', nav_orders: 'My Orders', nav_profile: 'Profile', nav_support: 'Support',
    boot_loading: 'Loading…',
    hero_kicker: 'Official top-up center', hero_t1: 'Top up your', hero_t2: 'favourite game',
    hero_sub: 'Robux • UC • FC Points — on your account in minutes.',
    hb_fast: 'Fast delivery', hb_safe: 'Secure payment', hb_nopass: 'No password needed',
    games_title: 'Choose a game', games_sub: '3 games • official packs',
    pkgs: '{n} packs', from: 'from',
    back: 'Back', buy: 'Buy', next: 'Continue', close: 'Close',
    step1: 'Pack', step2: 'Info', step3: 'Payment', step4: 'Receipt', step5: 'Done',
    info_title: 'Your details', f_first: 'First name', f_last: 'Last name', f_player: 'Game ID / Nickname',
    f_player_hint: 'E.g. PUBG ID 5123456789 or Roblox nick. NEVER share your password.',
    ph_first: 'Your first name', ph_last: 'Your last name', ph_player: 'Player ID / username',
    pay_title: 'Make payment', pay_amount: 'Amount to pay', pay_choose: 'Choose a payment method',
    pay_copy: 'Copy', copied: 'Copied!', pay_go: 'I have paid — continue',
    rc_title: 'Upload receipt', rc_hint: 'Upload the payment receipt screenshot (JPG/PNG/WebP, up to 8MB)',
    rc_btn: 'Submit order', rc_change: 'Choose another', rc_later: 'Upload later',
    done_title: 'Order received!', done_sub: 'Admin will verify your payment and activate the pack soon. Track status in «My Orders».',
    done_orders: 'My orders', done_menu: 'Main menu',
    ord_title: 'My orders', ord_sub: 'Full purchase history',
    ord_empty_t: 'No orders yet', ord_empty_s: 'Pick a game and grab your first top-up!',
    ord_go: 'Browse games',
    d_game: 'Game', d_pkg: 'Package', d_price: 'Price', d_date: 'Date', d_status: 'Status', d_code: 'Order ID',
    d_player: 'Player ID', d_name: 'Customer', d_receipt: 'Receipt', d_history: 'Status history', d_note: 'Admin note',
    d_reupload: 'Re-upload receipt', d_view: 'View receipt',
    st_pending: 'Pending', st_paid: 'Paid', st_processing: 'Processing', st_completed: 'Completed', st_cancelled: 'Cancelled',
    pr_title: 'My profile', pr_orders: 'Orders', pr_spent: 'Total spent', pr_lang: 'Til / Язык / Language',
    pr_theme: 'Theme', th_dark: 'Night', th_light: 'Day', pr_id: 'Telegram ID', pr_uname: 'Username',
    pr_save: 'Save', pr_saved: 'Profile saved!',
    sup_title: 'Help center', sup_btn: 'Message admin', sup_info_t: 'How it works?',
    sup_1: 'Pick a pack and enter your details', sup_2: 'Pay to the card and upload the receipt', sup_3: 'After admin approval the top-up lands on your account',
    secure_note: 'Security: we never ask for or store your game password. Only a public Player ID / nick is needed.',
    lang_title: 'Choose language', v_first: 'Enter your first name', v_player: 'Enter Player ID / nick (min 2 chars)',
    v_file: 'Choose the receipt photo first', v_method: 'Choose a payment method',
    err_net: 'Network error. Try again.', t_created: 'Order created!', t_receipt: 'Receipt sent!',
    pay_note: 'Don’t forget to upload the receipt after paying — otherwise the order won’t be verified.',
  },
};

/* ---------------- state ---------------- */
const S = {
  lang: localStorage.getItem('nx_lang') || '',
  theme: localStorage.getItem('nx_theme') || 'dark',
  user: null, tg_id: null, settings: {}, games: [],
  tab: 'games', gameId: null, game: null, packages: [],
  orders: [], methods: [], buy: null, profile: null,
};
const t = (k) => (I18N[S.lang] && I18N[S.lang][k]) || I18N.uz[k] || k;
const hap = (kind = 'light') => { try { tg && tg.HapticFeedback && tg.HapticFeedback.impactOccurred(kind); } catch { } };
const hapOk = (kind = 'success') => { try { tg && tg.HapticFeedback && tg.HapticFeedback.notificationOccurred(kind); } catch { } };

/* ---------------- api ---------------- */
async function api(path, { method = 'GET', body = null, form = null } = {}) {
  const url = new URL(path, location.origin);
  const opt = { method, credentials: 'include', headers: {} };
  if (form) { form.append('telegram_id', S.tg_id || ''); opt.body = form; }
  else if (body) { body.telegram_id = body.telegram_id || S.tg_id; opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
  else if (method === 'GET' && S.tg_id) url.searchParams.set('telegram_id', S.tg_id);
  let res;
  try { res = await fetch(url, opt); }
  catch { throw new Error('net'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error((data && data.error) || ('http_' + res.status));
  return data;
}

/* ---------------- toast / sheet ---------------- */
function toast(msg, kind = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  el.innerHTML = `<svg><use href="#${kind === 'err' ? 'i-x' : kind === 'ok' ? 'i-check' : 'i-spark'}"/></svg><span>${esc(msg)}</span>`;
  $('#toastRoot').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, 2600);
}
function openSheet(html, { onClose = null } = {}) {
  closeSheet();
  const ov = document.createElement('div');
  ov.className = 'overlay'; ov.id = 'sheetOv';
  ov.innerHTML = `<div class="sheet" role="dialog"><div class="grab"></div>${html}</div>`;
  ov.addEventListener('click', (e) => { if (e.target === ov) closeSheet(); });
  ov._onClose = onClose;
  $('#sheetRoot').appendChild(ov);
  document.body.style.overflow = 'hidden';
  return ov;
}
function closeSheet() {
  const ov = $('#sheetOv');
  if (ov) { ov.remove(); document.body.style.overflow = ''; if (ov._onClose) ov._onClose(); }
}

/* ---------------- theme / lang ---------------- */
function setTheme(th, silent) {
  S.theme = th === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = S.theme;
  localStorage.setItem('nx_theme', S.theme);
  const use = $('#themeUse'); if (use) use.setAttribute('href', S.theme === 'dark' ? '#i-moon' : '#i-sun');
  $('meta[name="theme-color"]').content = S.theme === 'dark' ? '#071233' : '#e7f1ff';
  try {
    tg && tg.setHeaderColor && tg.setHeaderColor(S.theme === 'dark' ? '#071233' : '#e7f1ff');
    tg && tg.setBackgroundColor && tg.setBackgroundColor(S.theme === 'dark' ? '#060d20' : '#e7f1ff');
  } catch { }
  if (!silent) { hap(); renderTab(); }
}
function setLang(lng, silent) {
  if (!I18N[lng]) lng = 'uz';
  S.lang = lng;
  localStorage.setItem('nx_lang', lng);
  document.documentElement.lang = lng;
  $('#langCode').textContent = lng.toUpperCase();
  $$('#tabbar [data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $('#bootText').textContent = t('boot_loading');
  if (!silent) {
    hap(); closeSheet();
    if (S.user) api('/api/profile', { method: 'PUT', body: { language: lng } }).catch(() => { });
    renderTab();
  }
}

/* ---------------- settings ---------------- */
function applySettings() {
  const st = S.settings;
  document.documentElement.style.setProperty('--primary', st.theme_primary || '#1d4ed8');
  document.documentElement.style.setProperty('--accent', st.theme_accent || '#38bdf8');
  $('#brandName').textContent = st.app_name || 'NEXORA';
  $('#brandTag').textContent = st['app_tagline_' + S.lang] || st.app_tagline_uz || '';
  if (st.logo_url) $('#brandLogo').innerHTML = `<img src="${esc(st.logo_url)}" alt="logo">`;
  const ann = st['announcement_' + S.lang];
  if (ann) { $('#announce').hidden = false; $('#announceText').textContent = ann; }
  else $('#announce').hidden = true;
}

/* ---------------- coins & cards ---------------- */
function coinLetters(game) {
  const cur = (game.currency_name || '').toUpperCase();
  if (game.code === 'roblox') return 'R';
  if (game.code === 'pubg') return 'UC';
  if (game.code === 'easports') return 'FC';
  return (cur.replace(/[^A-Z]/g, '').slice(0, 2) || game.name.slice(0, 2).toUpperCase());
}
function coinSVG(game, cls = '') {
  if (game.currency_icon_url) return `<img class="g-coin ${cls}" src="${esc(game.currency_icon_url)}" alt="" loading="lazy">`;
  const L = coinLetters(game);
  const fs = L.length > 1 ? 19 : 26;
  return `<svg class="g-coin ${cls}" viewBox="0 0 64 64" aria-hidden="true">
    <circle cx="32" cy="32" r="30" fill="url(#nxg)"/>
    <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2"/>
    <circle cx="32" cy="32" r="23.5" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="1.6" stroke-dasharray="4 4"/>
    <ellipse cx="23" cy="18" rx="10" ry="5" fill="rgba(255,255,255,.4)" transform="rotate(-25 23 18)"/>
    <text x="32" y="32" text-anchor="middle" dominant-baseline="central" font-family="Unbounded,sans-serif"
      font-weight="800" font-size="${fs}" fill="#fff" style="text-shadow:0 2px 6px rgba(0,0,0,.4)">${esc(L)}</text>
  </svg>`;
}
function gameDesc(g) { return g['description_' + S.lang] || g.description_uz || ''; }

/* ---------------- boot ---------------- */
async function boot() {
  if (tg) { try { tg.ready(); tg.expand(); } catch { } }
  if (!S.lang) {
    const code = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.language_code) || 'uz';
    S.lang = code === 'ru' ? 'ru' : code === 'en' ? 'en' : 'uz';
  }
  setTheme(S.theme, true);
  setLang(S.lang, true);
  $('#langCode').textContent = S.lang.toUpperCase();

  // auth
  const qs = new URLSearchParams(location.search);
  let authBody;
  if (tg && tg.initData) authBody = { init_data: tg.initData };
  else authBody = { telegram_id: qs.get('dev_id') || '1', first_name: 'Guest', username: 'guest' };
  try {
    const a = await api('/api/auth', { method: 'POST', body: authBody });
    S.user = a.user; S.tg_id = a.user.telegram_id;
    if (a.user.language && !localStorage.getItem('nx_lang')) setLang(a.user.language, true);
  } catch (e) { return bootFail(); }
  try {
    const [st, gm] = await Promise.all([api('/api/settings/public'), api('/api/games')]);
    S.settings = st.settings; S.games = gm.games;
    if (!localStorage.getItem('nx_lang') && st.settings.default_lang) setLang(st.settings.default_lang, true);
    applySettings();
  } catch (e) { return bootFail(); }
  bindChrome();
  renderTab();
}
function bootFail() {
  $('#view').innerHTML = `<div class="empty rise">
    <div class="e-ic"><svg><use href="#i-bolt"/></svg></div>
    <b>${esc(t('err_net'))}</b><p>NEXORA</p>
    <button class="btn primary" style="margin-top:14px" onclick="location.reload()">↻</button></div>`;
}
function bindChrome() {
  $$('#tabbar .tab').forEach((b) => b.addEventListener('click', () => {
    hap(); S.tab = b.dataset.tab; S.gameId = null;
    $$('#tabbar .tab').forEach((x) => x.classList.toggle('active', x === b));
    renderTab();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }));
  $('#themeBtn').addEventListener('click', () => setTheme(S.theme === 'dark' ? 'light' : 'dark'));
  $('#langBtn').addEventListener('click', () => { hap(); langSheet(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });
}
function setTab(name) {
  S.tab = name;
  $$('#tabbar .tab').forEach((x) => x.classList.toggle('active', x.dataset.tab === name));
}

/* ---------------- router ---------------- */
function renderTab() {
  $$('#tabbar [data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  applySettings();
  tgBack(false);
  if (S.tab === 'games') S.gameId ? vGameDetail(S.gameId) : vGames();
  else if (S.tab === 'orders') vOrders();
  else if (S.tab === 'profile') vProfile();
  else vSupport();
}
function tgBack(show, fn) {
  try {
    if (!tg || !tg.BackButton) return;
    tg.BackButton.offClick(tgBack._fn || (() => { }));
    if (show) { tgBack._fn = fn; tg.BackButton.onClick(fn); tg.BackButton.show(); }
    else tg.BackButton.hide();
  } catch { }
}

/* ---------------- GAMES ---------------- */
function vGames() {
  const st = S.settings;
  const cards = S.games.map((g, i) => `
    <button class="game-card rise rise-${(i % 5) + 1}" data-game="${g.id}"
      style="background:linear-gradient(135deg,${esc(g.color_from || '#38bdf8')},${esc(g.color_to || '#1d4ed8')})">
      <span class="g-img">${g.image_url ? `<img src="${esc(g.image_url)}" alt="${esc(g.name)}" loading="lazy" onerror="this.remove()">` : ''}</span>
      <span class="g-shade"></span>
      <span class="g-body">
        ${coinSVG(g)}
        <span class="g-info"><h3>${esc(g.name)}</h3><p>${esc(gameDesc(g))}</p>
          <span class="g-meta">
            <span class="g-price">${esc(t('from'))} ${fmtMoney(g.min_price || 0)}</span>
            <span class="g-count">${esc(t('pkgs').replace('{n}', g.package_count || 0))}</span>
          </span>
        </span>
        <span class="g-go"><svg><use href="#i-back"/></svg></span>
      </span>
    </button>`).join('');
  $('#view').innerHTML = `
    <section class="hero rise">
      ${st.hero_banner_url ? `<img src="${esc(st.hero_banner_url)}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.35">` : ''}
      <h1 style="position:relative">${esc(t('hero_t1'))} <span>${esc(t('hero_t2'))}</span></h1>
      <p style="position:relative">${esc(t('hero_sub'))}</p>
      <div class="hero-badges">
        <span class="hbadge"><svg class="bob"><use href="#i-bolt"/></svg>${esc(t('hb_fast'))}</span>
        <span class="hbadge"><svg class="pulse"><use href="#i-shield"/></svg>${esc(t('hb_safe'))}</span>
        <span class="hbadge"><svg class="spin-slow"><use href="#i-check"/></svg>${esc(t('hb_nopass'))}</span>
      </div>
    </section>
    <div class="sec-head rise rise-1"><div><h2>${esc(t('games_title'))}</h2><p>${esc(t('games_sub'))}</p></div></div>
    <div class="games">${cards || `<div class="empty"><div class="e-ic"><svg><use href="#i-game"/></svg></div><b>NEXORA</b></div>`}</div>`;
  $$('#view [data-game]').forEach((b) => b.addEventListener('click', () => {
    hap(); S.gameId = +b.dataset.game; vGameDetail(S.gameId);
  }));
}

async function vGameDetail(id) {
  $('#view').innerHTML = `<div class="backrow"><button class="icon-btn" id="bkBtn"><svg class="ic"><use href="#i-back"/></svg></button>
    <h2>…</h2></div><div class="sk" style="height:150px"></div><div class="sk" style="height:86px;margin-top:11px"></div><div class="sk" style="height:86px;margin-top:11px"></div>`;
  $('#bkBtn').onclick = () => { hap(); S.gameId = null; renderTab(); };
  tgBack(true, () => { S.gameId = null; renderTab(); });
  let d;
  try { d = await api('/api/games/' + id); }
  catch { toast(t('err_net'), 'err'); S.gameId = null; return renderTab(); }
  S.game = d.game; S.packages = d.packages;
  const g = d.game;
  $('#view').innerHTML = `
    <div class="backrow rise"><button class="icon-btn" id="bkBtn"><svg class="ic"><use href="#i-back"/></svg></button><h2>${esc(g.name)}</h2></div>
    <div class="game-hero rise rise-1" style="background:linear-gradient(135deg,${esc(g.color_from)},${esc(g.color_to)})">
      ${g.image_url ? `<img src="${esc(g.image_url)}" alt="" onerror="this.remove()">` : ''}<span class="g-shade"></span>
      <div class="gh-in">${coinSVG(g)}<div><h2>${esc(g.name)}</h2><p>${esc(gameDesc(g))}</p></div></div>
    </div>
    <div class="sec-head rise rise-2"><div><h2>${esc(g.currency_name || '')}</h2><p>${esc(t('pkgs').replace('{n}', d.packages.length))}</p></div></div>
    <div id="pkgList">${d.packages.map((p, i) => `
      <div class="pkg rise rise-${(i % 5) + 1}">
        ${coinSVG(g, 'pkg-coin')}
        <div class="pkg-info"><h4>${esc(p.name)}${p.bonus ? `<span class="pkg-bonus">${esc(p.bonus)}</span>` : ''}</h4>
          <span class="pkg-amt">${esc(p.amount || '')}</span>
          <div class="pkg-price">${fmtMoney(p.price)} ${esc(p.currency || '')}</div>
        </div>
        <button class="btn primary buy-btn" data-buy="${p.id}">${esc(t('buy'))}</button>
      </div>`).join('') || `<div class="empty"><b>NEXORA</b></div>`}
    </div>`;
  $('#bkBtn').onclick = () => { hap(); S.gameId = null; renderTab(); };
  $$('#view [data-buy]').forEach((b) => b.addEventListener('click', () => {
    hap('medium');
    startBuy(S.packages.find((p) => p.id === +b.dataset.buy));
  }));
}

/* ---------------- BUY WIZARD ---------------- */
function stepsBar(active) {
  const names = [t('step1'), t('step2'), t('step3'), t('step4'), t('step5')];
  return `<div class="steps">${names.map((n, i) => {
    const n1 = i + 1;
    const cls = n1 < active ? 'done' : n1 === active ? 'now' : '';
    return `<div class="step ${cls}"><i></i>${esc(n)}</div>`;
  }).join('')}</div>`;
}
function startBuy(pkg) {
  if (!pkg) return;
  S.buy = { pkg, game: S.game, order: null, methodIdx: 0, file: null };
  buyInfoStep();
}
function buyInfoStep() {
  const { pkg, game } = S.buy;
  openSheet(`
    <div class="sheet-head"><h3>${esc(t('info_title'))}</h3>
      <button class="x-btn" onclick="closeSheet()"><svg><use href="#i-x"/></svg></button></div>
    ${stepsBar(2)}
    <div class="pkg" style="margin-bottom:14px">${coinSVG(game, 'pkg-coin')}
      <div class="pkg-info"><h4>${esc(pkg.name)}</h4><span class="pkg-amt">${esc(pkg.amount || '')}</span>
      <div class="pkg-price">${fmtMoney(pkg.price)} ${esc(pkg.currency || '')}</div></div></div>
    <div class="field"><label>${esc(t('f_first'))} *</label>
      <input id="fFirst" value="${esc(S.user.first_name || '')}" placeholder="${esc(t('ph_first'))}" maxlength="100"></div>
    <div class="field"><label>${esc(t('f_last'))}</label>
      <input id="fLast" value="${esc(S.user.last_name || '')}" placeholder="${esc(t('ph_last'))}" maxlength="100"></div>
    <div class="field"><label>${esc(t('f_player'))} *</label>
      <input id="fPlayer" placeholder="${esc(t('ph_player'))}" maxlength="150" autocomplete="off">
      <div class="hint">${esc(t('f_player_hint'))}</div></div>
    <p class="form-err" id="buyErr" hidden></p>
    <div class="secure-note"><svg><use href="#i-shield"/></svg><span>${esc(t('secure_note'))}</span></div>
    <div class="sheet-foot"><button class="btn primary" id="toPay">${esc(t('next'))}</button></div>`);
  $('#toPay').onclick = async () => {
    const first = $('#fFirst').value.trim(), last = $('#fLast').value.trim(), player = $('#fPlayer').value.trim();
    const err = $('#buyErr');
    if (first.length < 2) { err.textContent = t('v_first'); err.hidden = false; hapOk('error'); return; }
    if (player.length < 2) { err.textContent = t('v_player'); err.hidden = false; hapOk('error'); return; }
    err.hidden = true;
    const btn = $('#toPay'); btn.disabled = true; btn.textContent = '…';
    try {
      const d = await api('/api/orders', { method: 'POST', body: { game_id: game.id, package_id: pkg.id, first_name: first, last_name: last, game_username: player } });
      S.buy.order = d.order; hapOk(); toast(t('t_created'), 'ok');
      buyPayStep();
    } catch (e) { btn.disabled = false; btn.textContent = t('next'); err.textContent = t('err_net'); err.hidden = false; hapOk('error'); }
  };
}
async function buyPayStep() {
  const { pkg, order } = S.buy;
  openSheet(`<div class="sheet-head"><h3>${esc(t('pay_title'))}</h3>
    <button class="x-btn" onclick="closeSheet()"><svg><use href="#i-x"/></svg></button></div>${stepsBar(3)}
    <div class="pay-sum"><small>${esc(t('pay_amount'))}</small><b>${fmtMoney(order.price)} ${esc(order.currency)}</b>
    <span>${esc(order.game_name)} • ${esc(order.package_name)} (${esc(order.package_amount)})</span></div>
    <div id="pmList"><div class="sk" style="height:70px"></div><div class="sk" style="height:70px;margin-top:10px"></div></div>
    <div class="sheet-foot"><button class="btn primary" id="toRc">${esc(t('pay_go'))}</button></div>`);
  try { S.methods = (await api('/api/payment-methods')).methods; } catch { S.methods = []; }
  const box = $('#pmList');
  if (!box) return;
  if (!S.methods.length) box.innerHTML = `<div class="empty"><b>…</b></div>`;
  box.innerHTML = `<div class="sec-head" style="margin-top:2px"><div><h2 style="font-size:15px">${esc(t('pay_choose'))}</h2></div></div>` +
    S.methods.map((m, i) => `
    <div class="pay-method ${i === S.buy.methodIdx ? 'sel' : ''}" data-pm="${i}">
      <div class="pm-top"><span class="pm-ic"><svg><use href="#i-card"/></svg></span><b>${esc(m.name)}</b>
        <span class="pm-check"><svg><use href="#i-check"/></svg></span></div>
      <div class="pm-details">${esc(m.details || '').replace(/\n/g, '<br>')}
        <button class="pm-copy" data-copy="${esc(m.details || '')}" title="${esc(t('pay_copy'))}"><svg><use href="#i-copy"/></svg></button></div>
      ${m['instructions_' + S.lang] ? `<div class="pm-inst">${esc(m['instructions_' + S.lang])}</div>` : ''}
    </div>`).join('') +
    `<div class="secure-note"><svg><use href="#i-clock"/></svg><span>${esc(t('pay_note'))}</span></div>`;
  $$('#pmList [data-pm]').forEach((el) => el.addEventListener('click', (e) => {
    if (e.target.closest('.pm-copy')) return;
    hap(); S.buy.methodIdx = +el.dataset.pm;
    $$('#pmList [data-pm]').forEach((x) => x.classList.toggle('sel', x === el));
  }));
  $$('#pmList [data-copy]').forEach((b) => b.addEventListener('click', async (e) => {
    e.stopPropagation(); hap();
    const txt = b.dataset.copy;
    try { await navigator.clipboard.writeText(txt); } catch {
      const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); ta.remove();
    }
    toast(t('copied'), 'ok');
  }));
  $('#toRc').onclick = () => {
    if (!S.methods.length) { toast(t('v_method'), 'err'); hapOk('error'); return; }
    hap(); buyReceiptStep();
  };
}
function buyReceiptStep() {
  S.buy.file = null;
  openSheet(`
    <div class="sheet-head"><h3>${esc(t('rc_title'))}</h3>
      <button class="x-btn" onclick="closeSheet()"><svg><use href="#i-x"/></svg></button></div>
    ${stepsBar(4)}
    <div class="drop" id="drop">
      <div class="d-ic"><svg><use href="#i-upload"/></svg></div>
      <b>${esc(t('rc_hint'))}</b><p>JPG / PNG / WebP</p>
      <div id="prevBox"></div>
    </div>
    <input type="file" id="rcFile" accept="image/jpeg,image/png,image/webp" hidden>
    <p class="form-err" id="rcErr" hidden></p>
    <div class="sheet-foot" style="flex-direction:column">
      <button class="btn primary block" id="sendRc">${esc(t('rc_btn'))}</button>
      <button class="btn ghost block" id="laterRc">${esc(t('rc_later'))}</button>
    </div>`);
  const drop = $('#drop'), inp = $('#rcFile');
  drop.onclick = () => inp.click();
  inp.onchange = () => {
    const f = inp.files[0]; if (!f) return;
    S.buy.file = f;
    const rd = new FileReader();
    rd.onload = () => {
      drop.classList.add('sel');
      $('#prevBox').innerHTML = `<img class="preview" src="${rd.result}" alt="" style="margin-top:12px">`;
      hap();
    };
    rd.readAsDataURL(f);
  };
  $('#sendRc').onclick = async () => {
    if (!S.buy.file) { const e = $('#rcErr'); e.textContent = t('v_file'); e.hidden = false; hapOk('error'); return; }
    const btn = $('#sendRc'); btn.disabled = true; btn.textContent = '…';
    const fd = new FormData(); fd.append('receipt', S.buy.file);
    try {
      await api(`/api/orders/${S.buy.order.order_code}/receipt`, { method: 'POST', form: fd });
      hapOk(); toast(t('t_receipt'), 'ok'); buyDoneStep();
    } catch (e) { btn.disabled = false; btn.textContent = t('rc_btn'); const x = $('#rcErr'); x.textContent = t('err_net'); x.hidden = false; hapOk('error'); }
  };
  $('#laterRc').onclick = () => { hap(); closeSheet(); setTab('orders'); renderTab(); };
}
function buyDoneStep() {
  const o = S.buy.order;
  openSheet(`${stepsBar(5)}
    <div class="done-wrap pop">
      <div class="done-ring"><svg><use href="#i-check"/></svg></div>
      <h3>${esc(t('done_title'))}</h3><p>${esc(t('done_sub'))}</p>
      <div><span class="done-code">${esc(o.order_code)}</span></div>
    </div>
    <div class="sheet-foot"><button class="btn ghost" id="dMenu">${esc(t('done_menu'))}</button>
      <button class="btn primary" id="dOrders">${esc(t('done_orders'))}</button></div>`,
    { onClose: () => { S.buy = null; } });
  $('#dMenu').onclick = () => { hap(); closeSheet(); S.gameId = null; setTab('games'); renderTab(); };
  $('#dOrders').onclick = () => { hap(); closeSheet(); setTab('orders'); renderTab(); };
}

/* ---------------- ORDERS ---------------- */
async function vOrders() {
  $('#view').innerHTML = `<div class="sec-head"><div><h2>${esc(t('ord_title'))}</h2><p>${esc(t('ord_sub'))}</p></div></div>
    <div class="sk" style="height:110px"></div><div class="sk" style="height:110px;margin-top:11px"></div>`;
  try { S.orders = (await api('/api/orders/mine')).orders; } catch { toast(t('err_net'), 'err'); S.orders = []; }
  if (!S.orders.length) {
    $('#view').innerHTML = `<div class="sec-head"><div><h2>${esc(t('ord_title'))}</h2><p>${esc(t('ord_sub'))}</p></div></div>
      <div class="empty rise"><div class="e-ic float"><svg><use href="#i-box"/></svg></div>
      <b>${esc(t('ord_empty_t'))}</b><p>${esc(t('ord_empty_s'))}</p>
      <button class="btn primary" style="margin-top:16px" id="goGames">${esc(t('ord_go'))}</button></div>`;
    $('#goGames').onclick = () => { hap(); S.gameId = null; setTab('games'); renderTab(); };
    return;
  }
  $('#view').innerHTML = `<div class="sec-head rise"><div><h2>${esc(t('ord_title'))}</h2><p>${esc(t('ord_sub'))}</p></div></div>` +
    S.orders.map((o, i) => `
    <div class="order rise rise-${(i % 5) + 1}" data-ord="${esc(o.order_code)}">
      <div class="o-top">${coinSVG({ code: '', name: o.game_name, currency_name: o.currency_name }, 'o-coin')}
        <div class="o-info"><span class="o-code">${esc(o.order_code)}</span>
          <b>${esc(o.game_name)} • ${esc(o.package_name)}</b>
          <small>${esc(o.package_amount || '')} • ${esc(o.game_username || '')}</small></div>
        <span class="st st-${esc(o.status)}">${esc(t('st_' + o.status))}</span></div>
      <div class="o-bottom"><span class="o-price">${fmtMoney(o.price)} ${esc(o.currency)}</span>
        <span class="o-date">${esc(fmtDate(o.created_at))}</span></div>
    </div>`).join('');
  $$('#view [data-ord]').forEach((el) => el.addEventListener('click', () => { hap(); orderSheet(el.dataset.ord); }));
}
async function orderSheet(code) {
  openSheet(`<div class="sk" style="height:220px"></div>`);
  let d;
  try { d = await api('/api/orders/' + encodeURIComponent(code)); } catch { closeSheet(); toast(t('err_net'), 'err'); return; }
  const o = d.order, h = d.history || [];
  const tl = h.length ? `<ul class="tl">${h.map((x) => `
    <li class="${x.new_status === o.status ? 'on' : ''}">${esc(t('st_' + (x.new_status || 'pending')))}
    <small>${esc(fmtDate(x.created_at))}${x.note ? ' • ' + esc(x.note) : ''}</small></li>`).join('')}</ul>`
    : `<ul class="tl"><li class="on">${esc(t('st_' + o.status))}<small>${esc(fmtDate(o.created_at))}</small></li></ul>`;
  openSheet(`
    <div class="sheet-head"><h3>${esc(o.order_code)}</h3>
      <button class="x-btn" onclick="closeSheet()"><svg><use href="#i-x"/></svg></button></div>
    <div style="margin-bottom:10px"><span class="st st-${esc(o.status)}">${esc(t('st_' + o.status))}</span></div>
    <div class="kv"><span>${esc(t('d_game'))}</span><b>${esc(o.game_name)}</b></div>
    <div class="kv"><span>${esc(t('d_pkg'))}</span><b>${esc(o.package_name)} (${esc(o.package_amount || '')})</b></div>
    <div class="kv"><span>${esc(t('d_player'))}</span><b>${esc(o.game_username || '')}</b></div>
    <div class="kv"><span>${esc(t('d_price'))}</span><b>${fmtMoney(o.price)} ${esc(o.currency)}</b></div>
    <div class="kv"><span>${esc(t('d_date'))}</span><b>${esc(fmtDate(o.created_at))}</b></div>
    ${o.admin_note ? `<div class="kv"><span>${esc(t('d_note'))}</span><b>${esc(o.admin_note)}</b></div>` : ''}
    ${o.receipt_url ? `<img class="receipt-img" src="${esc(o.receipt_url)}" alt="receipt" loading="lazy">` : ''}
    <div class="sec-head" style="margin-top:14px"><div><h2 style="font-size:15px">${esc(t('d_history'))}</h2></div></div>
    ${tl}
    ${o.status === 'pending' ? `<div class="sheet-foot"><button class="btn primary block" id="reUp">${esc(o.receipt_url ? t('d_reupload') : t('rc_title'))}</button></div>
    <input type="file" id="reFile" accept="image/jpeg,image/png,image/webp" hidden>` : ''}`);
  const re = $('#reUp');
  if (re) re.onclick = () => $('#reFile').click();
  const rf = $('#reFile');
  if (rf) rf.onchange = async () => {
    if (!rf.files[0]) return;
    re.disabled = true; re.textContent = '…';
    const fd = new FormData(); fd.append('receipt', rf.files[0]);
    try { await api(`/api/orders/${o.order_code}/receipt`, { method: 'POST', form: fd }); hapOk(); toast(t('t_receipt'), 'ok'); orderSheet(code); vOrders(); }
    catch { re.disabled = false; toast(t('err_net'), 'err'); hapOk('error'); }
  };
}

/* ---------------- PROFILE ---------------- */
async function vProfile() {
  $('#view').innerHTML = `<div class="sk" style="height:100px"></div><div class="sk" style="height:80px;margin-top:11px"></div>`;
  try { S.profile = await api('/api/profile'); } catch { toast(t('err_net'), 'err'); return; }
  const u = S.profile.user;
  const av = esc((u.first_name || 'N')[0].toUpperCase());
  $('#view').innerHTML = `
    <div class="sec-head rise"><div><h2>${esc(t('pr_title'))}</h2></div></div>
    <div class="prof-head rise rise-1"><span class="avatar">${av}</span>
      <div><b>${esc(u.first_name || '')} ${esc(u.last_name || '')}</b>
      <small>${u.username ? '@' + esc(u.username) + ' • ' : ''}ID: ${esc(u.telegram_id)}</small></div></div>
    <div class="stat-row rise rise-2">
      <div class="stat"><b>${S.profile.orders}</b><span>${esc(t('pr_orders'))}</span></div>
      <div class="stat"><b>${fmtMoney(S.profile.spent)}</b><span>${esc(t('pr_spent'))}</span></div>
    </div>
    <div class="menu rise rise-3">
      <div class="field"><label>${esc(t('pr_lang'))}</label>
        <div class="seg" id="langSeg">
          <button data-l="uz" class="${S.lang === 'uz' ? 'on' : ''}">O‘zbek</button>
          <button data-l="ru" class="${S.lang === 'ru' ? 'on' : ''}">Русский</button>
          <button data-l="en" class="${S.lang === 'en' ? 'on' : ''}">English</button>
        </div></div>
      <div class="field"><label>${esc(t('pr_theme'))}</label>
        <div class="seg" id="thSeg">
          <button data-th="dark" class="${S.theme === 'dark' ? 'on' : ''}">${esc(t('th_dark'))}</button>
          <button data-th="light" class="${S.theme === 'light' ? 'on' : ''}">${esc(t('th_light'))}</button>
        </div></div>
      <div class="field"><label>${esc(t('f_first'))}</label><input id="pFirst" value="${esc(u.first_name || '')}" maxlength="100"></div>
      <div class="field"><label>${esc(t('f_last'))}</label><input id="pLast" value="${esc(u.last_name || '')}" maxlength="100"></div>
      <button class="btn primary block" id="pSave">${esc(t('pr_save'))}</button>
    </div>
    <div class="secure-note rise rise-4"><svg><use href="#i-shield"/></svg><span>${esc(t('secure_note'))}</span></div>`;
  $$('#langSeg button').forEach((b) => b.onclick = () => setLang(b.dataset.l));
  $$('#thSeg button').forEach((b) => b.onclick = () => setTheme(b.dataset.th));
  $('#pSave').onclick = async () => {
    const btn = $('#pSave'); btn.disabled = true;
    try {
      const d = await api('/api/profile', { method: 'PUT', body: { first_name: $('#pFirst').value.trim(), last_name: $('#pLast').value.trim() } });
      S.user = d.user; hapOk(); toast(t('pr_saved'), 'ok'); vProfile();
    } catch { btn.disabled = false; toast(t('err_net'), 'err'); }
  };
}

/* ---------------- SUPPORT ---------------- */
function vSupport() {
  const st = S.settings;
  const txt = st['support_text_' + S.lang] || st.support_text_uz || '';
  const uname = (st.support_username || '').replace('@', '');
  $('#view').innerHTML = `
    <div class="support-hero rise">
      <div class="s-ic"><svg><use href="#i-chat"/></svg></div>
      <h3>${esc(t('sup_title'))}</h3><p>${esc(txt)}</p>
    </div>
    <div class="menu rise rise-1">
      ${uname ? `<button class="btn primary big" id="supBtn"><svg class="ic"><use href="#i-send"/></svg>${esc(t('sup_btn'))} (@${esc(uname)})</button>` : ''}
      <div class="card rise rise-2" style="padding:17px">
        <b style="font-size:14.5px">${esc(t('sup_info_t'))}</b>
        <ul class="tl" style="margin-top:12px">
          <li class="on">${esc(t('sup_1'))}</li><li class="on">${esc(t('sup_2'))}</li><li class="on">${esc(t('sup_3'))}</li>
        </ul>
      </div>
    </div>
    <div class="secure-note rise rise-3"><svg><use href="#i-shield"/></svg><span>${esc(t('secure_note'))}</span></div>`;
  const b = $('#supBtn');
  if (b) b.onclick = () => {
    hap();
    const url = 'https://t.me/' + uname;
    if (tg && tg.openTelegramLink) tg.openTelegramLink(url); else window.open(url, '_blank');
  };
}

/* ---------------- language sheet ---------------- */
function langSheet() {
  const langs = [['uz', 'UZ', 'O‘zbek tili'], ['ru', 'RU', 'Русский язык'], ['en', 'EN', 'English']];
  openSheet(`<div class="sheet-head"><h3>${esc(t('lang_title'))}</h3>
    <button class="x-btn" onclick="closeSheet()"><svg><use href="#i-x"/></svg></button></div>
    ${langs.map(([c, short, full]) => `
      <button class="lang-it ${S.lang === c ? 'on' : ''}" data-lang="${c}">
        <span class="flag">${short}</span><span>${esc(full)}<small>${c === 'uz' ? 'O‘zbek' : c === 'ru' ? 'Русский' : 'English'}</small></span>
        <span class="tick"><svg><use href="#i-check"/></svg></span>
      </button>`).join('')}`);
  $$('#sheetOv [data-lang]').forEach((b) => b.onclick = () => setLang(b.dataset.lang));
}

window.closeSheet = closeSheet;
document.addEventListener('DOMContentLoaded', boot);
