/* ============================================================
   NEXORA ADMIN — dashboard, charts, CRUD • UZ / RU / EN
   ============================================================ */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtMoney = (n) => Number(n || 0).toLocaleString('ru-RU');
const fmtDate = (s) => { try { return new Date(String(s).replace(' ', 'T')).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return s || ''; } };

const I18N = {
  uz: {
    m_dash: 'Dashboard', m_orders: 'Buyurtmalar', m_users: 'Foydalanuvchilar', m_games: "O‘yinlar", m_packages: 'Paketlar', m_payments: 'To‘lovlar', m_settings: 'Sozlamalar', m_theme: 'Mavzu', m_logout: 'Chiqish', m_view: 'WebApp',
    login_sub: 'Boshqaruv paneliga kirish', login_ph: 'Admin paroli', login_btn: 'Kirish', login_err: 'Parol noto‘g‘ri!',
    c_users: 'Foydalanuvchilar', c_orders: 'Buyurtmalar', c_revenue: 'Daromad', c_pending: 'Kutilayotgan', c_today: 'Bugun', c_completed: 'Bajarilgan', c_paid: 'Tasdiqlangan', c_cancelled: 'Bekor qilingan', c_processing: 'Jarayonda',
    ch_daily: 'Kunlik daromad (30 kun)', ch_daily_sub: 'So‘nggi 30 kunlik savdo dinamikasi', ch_monthly: 'Oylik daromad (12 oy)', ch_monthly_sub: 'Oylik savdo dinamikasi',
    ch_games: 'O‘yinlar kesimida', ch_games_sub: 'Qaysi o‘yin ko‘p sotilmoqda', ch_status: 'Holatlar bo‘yicha', ch_top: 'Top paketlar', ch_top_sub: 'Eng ko‘p sotilgan paketlar',
    recent: 'So‘nggi buyurtmalar', l_revenue: 'Daromad', l_orders: 'Buyurtmalar',
    f_search: 'Qidirish: ID, ism, player…', f_status: 'Holat', f_game: 'O‘yin', all: 'Barchasi',
    th_code: 'ID', th_client: 'Mijoz', th_game: 'O‘yin', th_pkg: 'Paket', th_price: 'Summa', th_date: 'Sana', th_status: 'Holat', th_act: 'Amal',
    th_user: 'Foydalanuvchi', th_tg: 'Telegram', th_lang: 'Til', th_seen: 'Faol', th_spent: 'Xarid',
    btn_add: 'Qo‘shish', btn_edit: 'Tahrirlash', btn_del: 'O‘chirish', btn_save: 'Saqlash', btn_cancel: 'Bekor qilish', btn_close: 'Yopish', btn_view: 'Ko‘rish',
    ask_del: 'Rostdan o‘chirmoqchimisiz?', yes: 'Ha', no: 'Yo‘q',
    o_detail: 'Buyurtma', o_player: 'Player ID', o_name: 'Mijoz', o_receipt: 'Chek', o_history: 'Holat tarixi', o_note: 'Admin izohi', o_note_ph: 'Izoh (mijozga ko‘rinadi)', o_status: 'Holat', no_receipt: 'Chek yuklanmagan',
    u_block: 'Bloklash', u_unblock: 'Blokdan chiqarish',
    g_add: 'Yangi o‘yin', g_edit: 'O‘yinni tahrirlash', g_name: 'Nomi', g_code: 'Kod (lotincha)', g_image: 'Rasm URL', g_currency: 'Valyuta nomi (mas: UC)', g_cicon: 'Valyuta ikonkasi URL', g_colors: 'Ranglar', g_active: 'Faol', g_order: 'Tartib', g_desc: 'Tavsif',
    p_add: 'Yangi paket', p_edit: 'Paketni tahrirlash', p_game: 'O‘yin', p_name: 'Paket nomi', p_amount: 'Miqdor (mas: 660 UC)', p_price: 'Narx', p_currency: 'Valyuta', p_bonus: 'Bonus belgisi', p_active: 'Faol', p_order: 'Tartib',
    pm_add: 'Yangi to‘lov usuli', pm_edit: 'To‘lov usulini tahrirlash', pm_name: 'Nomi (mas: Click)', pm_details: 'Rekvizitlar (karta, FIO)', pm_inst: 'Yo‘riqnoma', pm_active: 'Faol', pm_order: 'Tartib',
    s_app: 'Ilova nomi', s_tag: 'Shior (tagline)', s_logo: 'Logotip URL', s_hero: 'Banner rasmi URL', s_support: 'Support username (@siz)', s_suptext: 'Support matni', s_deflang: 'Standart til', s_colors: 'Mavzu ranglari', s_ann: 'E’lon (announcement)', s_pass: 'Yangi admin paroli', s_pass_ph: 'Bo‘sh qoldiring — o‘zgarmaydi', s_saved: 'Sozlamalar saqlandi!',
    upload: 'Yuklash', up_done: 'Rasm yuklandi!', up_game: 'O‘yin rasmini yuklash', up_logo: 'Logotip yuklash', up_icon: 'Valyuta ikonkasi yuklash', up_hero: 'Banner yuklash',
    t_saved: 'Saqlandi!', t_deleted: 'O‘chirildi!', t_err: 'Xatolik yuz berdi!', t_status: 'Holat yangilandi!', t_block: 'Foydalanuvchi bloklandi', t_unblock: 'Blokdan chiqarildi',
    empty: 'Ma’lumot topilmadi', prev: '‹ Oldingi', nextpg: 'Keyingi ›', of: 'jami', new_badge: 'YANGI',
    st_pending: 'Kutilmoqda', st_paid: 'To‘langan', st_processing: 'Jarayonda', st_completed: 'Bajarildi', st_cancelled: 'Bekor qilindi',
  },
  ru: {
    m_dash: 'Дашборд', m_orders: 'Заказы', m_users: 'Пользователи', m_games: 'Игры', m_packages: 'Пакеты', m_payments: 'Оплаты', m_settings: 'Настройки', m_theme: 'Тема', m_logout: 'Выйти', m_view: 'WebApp',
    login_sub: 'Вход в панель управления', login_ph: 'Пароль админа', login_btn: 'Войти', login_err: 'Неверный пароль!',
    c_users: 'Пользователи', c_orders: 'Заказы', c_revenue: 'Доход', c_pending: 'Ожидают', c_today: 'Сегодня', c_completed: 'Выполнено', c_paid: 'Подтверждено', c_cancelled: 'Отменено', c_processing: 'В работе',
    ch_daily: 'Доход по дням (30 дней)', ch_daily_sub: 'Динамика продаж за 30 дней', ch_monthly: 'Доход по месяцам (12)', ch_monthly_sub: 'Динамика продаж по месяцам',
    ch_games: 'По играм', ch_games_sub: 'Какая игра продаётся лучше', ch_status: 'По статусам', ch_top: 'Топ пакетов', ch_top_sub: 'Самые продаваемые пакеты',
    recent: 'Последние заказы', l_revenue: 'Доход', l_orders: 'Заказы',
    f_search: 'Поиск: ID, имя, player…', f_status: 'Статус', f_game: 'Игра', all: 'Все',
    th_code: 'ID', th_client: 'Клиент', th_game: 'Игра', th_pkg: 'Пакет', th_price: 'Сумма', th_date: 'Дата', th_status: 'Статус', th_act: 'Действия',
    th_user: 'Пользователь', th_tg: 'Telegram', th_lang: 'Язык', th_seen: 'Актив.', th_spent: 'Потратил',
    btn_add: 'Добавить', btn_edit: 'Изменить', btn_del: 'Удалить', btn_save: 'Сохранить', btn_cancel: 'Отмена', btn_close: 'Закрыть', btn_view: 'Открыть',
    ask_del: 'Точно удалить?', yes: 'Да', no: 'Нет',
    o_detail: 'Заказ', o_player: 'Player ID', o_name: 'Клиент', o_receipt: 'Чек', o_history: 'История статусов', o_note: 'Комментарий', o_note_ph: 'Комментарий (виден клиенту)', o_status: 'Статус', no_receipt: 'Чек не загружен',
    u_block: 'Заблокировать', u_unblock: 'Разблокировать',
    g_add: 'Новая игра', g_edit: 'Редактировать игру', g_name: 'Название', g_code: 'Код (латиница)', g_image: 'URL картинки', g_currency: 'Валюта (напр. UC)', g_cicon: 'URL иконки валюты', g_colors: 'Цвета', g_active: 'Активна', g_order: 'Порядок', g_desc: 'Описание',
    p_add: 'Новый пакет', p_edit: 'Редактировать пакет', p_game: 'Игра', p_name: 'Название пакета', p_amount: 'Количество (напр. 660 UC)', p_price: 'Цена', p_currency: 'Валюта', p_bonus: 'Метка бонуса', p_active: 'Активен', p_order: 'Порядок',
    pm_add: 'Новый способ оплаты', pm_edit: 'Редактировать способ', pm_name: 'Название (напр. Click)', pm_details: 'Реквизиты (карта, ФИО)', pm_inst: 'Инструкция', pm_active: 'Активен', pm_order: 'Порядок',
    s_app: 'Название приложения', s_tag: 'Слоган', s_logo: 'URL логотипа', s_hero: 'URL баннера', s_support: 'Username поддержки (без @)', s_suptext: 'Текст поддержки', s_deflang: 'Язык по умолчанию', s_colors: 'Цвета темы', s_ann: 'Объявление', s_pass: 'Новый пароль админа', s_pass_ph: 'Оставь пустым — не изменится', s_saved: 'Настройки сохранены!',
    upload: 'Загрузить', up_done: 'Фото загружено!', up_game: 'Загрузить картинку игры', up_logo: 'Загрузить логотип', up_icon: 'Загрузить иконку валюты', up_hero: 'Загрузить баннер',
    t_saved: 'Сохранено!', t_deleted: 'Удалено!', t_err: 'Произошла ошибка!', t_status: 'Статус обновлён!', t_block: 'Пользователь заблокирован', t_unblock: 'Пользователь разблокирован',
    empty: 'Ничего не найдено', prev: '‹ Назад', nextpg: 'Далее ›', of: 'из', new_badge: 'NEW',
    st_pending: 'Ожидает', st_paid: 'Оплачен', st_processing: 'В обработке', st_completed: 'Выполнен', st_cancelled: 'Отменён',
  },
  en: {
    m_dash: 'Dashboard', m_orders: 'Orders', m_users: 'Users', m_games: 'Games', m_packages: 'Packages', m_payments: 'Payments', m_settings: 'Settings', m_theme: 'Theme', m_logout: 'Logout', m_view: 'WebApp',
    login_sub: 'Sign in to control panel', login_ph: 'Admin password', login_btn: 'Sign in', login_err: 'Wrong password!',
    c_users: 'Users', c_orders: 'Orders', c_revenue: 'Revenue', c_pending: 'Pending', c_today: 'Today', c_completed: 'Completed', c_paid: 'Confirmed', c_cancelled: 'Cancelled', c_processing: 'Processing',
    ch_daily: 'Daily revenue (30 days)', ch_daily_sub: 'Sales dynamics for 30 days', ch_monthly: 'Monthly revenue (12)', ch_monthly_sub: 'Monthly sales dynamics',
    ch_games: 'By game', ch_games_sub: 'Which game sells best', ch_status: 'By status', ch_top: 'Top packages', ch_top_sub: 'Best-selling packs',
    recent: 'Recent orders', l_revenue: 'Revenue', l_orders: 'Orders',
    f_search: 'Search: ID, name, player…', f_status: 'Status', f_game: 'Game', all: 'All',
    th_code: 'ID', th_client: 'Client', th_game: 'Game', th_pkg: 'Package', th_price: 'Amount', th_date: 'Date', th_status: 'Status', th_act: 'Actions',
    th_user: 'User', th_tg: 'Telegram', th_lang: 'Lang', th_seen: 'Seen', th_spent: 'Spent',
    btn_add: 'Add', btn_edit: 'Edit', btn_del: 'Delete', btn_save: 'Save', btn_cancel: 'Cancel', btn_close: 'Close', btn_view: 'View',
    ask_del: 'Really delete?', yes: 'Yes', no: 'No',
    o_detail: 'Order', o_player: 'Player ID', o_name: 'Customer', o_receipt: 'Receipt', o_history: 'Status history', o_note: 'Admin note', o_note_ph: 'Note (visible to customer)', o_status: 'Status', no_receipt: 'No receipt uploaded',
    u_block: 'Block', u_unblock: 'Unblock',
    g_add: 'New game', g_edit: 'Edit game', g_name: 'Name', g_code: 'Code (latin)', g_image: 'Image URL', g_currency: 'Currency name (e.g. UC)', g_cicon: 'Currency icon URL', g_colors: 'Colors', g_active: 'Active', g_order: 'Order', g_desc: 'Description',
    p_add: 'New package', p_edit: 'Edit package', p_game: 'Game', p_name: 'Package name', p_amount: 'Amount (e.g. 660 UC)', p_price: 'Price', p_currency: 'Currency', p_bonus: 'Bonus badge', p_active: 'Active', p_order: 'Order',
    pm_add: 'New payment method', pm_edit: 'Edit method', pm_name: 'Name (e.g. Click)', pm_details: 'Details (card, holder)', pm_inst: 'Instructions', pm_active: 'Active', pm_order: 'Order',
    s_app: 'App name', s_tag: 'Tagline', s_logo: 'Logo URL', s_hero: 'Hero banner URL', s_support: 'Support username (no @)', s_suptext: 'Support text', s_deflang: 'Default language', s_colors: 'Theme colors', s_ann: 'Announcement', s_pass: 'New admin password', s_pass_ph: 'Leave empty — unchanged', s_saved: 'Settings saved!',
    upload: 'Upload', up_done: 'Image uploaded!', up_game: 'Upload game image', up_logo: 'Upload logo', up_icon: 'Upload currency icon', up_hero: 'Upload banner',
    t_saved: 'Saved!', t_deleted: 'Deleted!', t_err: 'Something went wrong!', t_status: 'Status updated!', t_block: 'User blocked', t_unblock: 'User unblocked',
    empty: 'Nothing found', prev: '‹ Prev', nextpg: 'Next ›', of: 'of', new_badge: 'NEW',
    st_pending: 'Pending', st_paid: 'Paid', st_processing: 'Processing', st_completed: 'Completed', st_cancelled: 'Cancelled',
  },
};
const MONTHS = {
  uz: ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'],
  ru: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};
const S = {
  lang: localStorage.getItem('nx_alang') || 'uz',
  theme: localStorage.getItem('nx_atheme') || 'dark',
  page: 'dash', authed: false,
  orders: { page: 1, q: '', status: '', game_id: '' },
  users: { page: 1, q: '' },
  games: [], settings: {},
};
let charts = [];
const t = (k) => (I18N[S.lang] && I18N[S.lang][k]) || I18N.uz[k] || k;

/* ---------------- api ---------------- */
async function api(path, { method = 'GET', body = null, form = null } = {}) {
  const opt = { method, credentials: 'include', headers: {} };
  if (form) opt.body = form;
  else if (body) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
  const res = await fetch(path, opt);
  if (res.status === 401) { showLogin(); throw new Error('unauthorized'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error((data && data.error) || 'http_' + res.status);
  return data;
}

/* ---------------- ui atoms ---------------- */
function toast(msg, kind = 'ok') {
  const el = document.createElement('div');
  el.className = 'atoast ' + kind;
  el.innerHTML = `<svg><use href="#${kind === 'err' ? 'a-x' : 'a-check'}"/></svg><span>${esc(msg)}</span>`;
  $('#atoastRoot').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, 2600);
}
function openModal(html, wide = false) {
  closeModal();
  const ov = document.createElement('div');
  ov.className = 'overlay'; ov.id = 'amOv';
  ov.innerHTML = `<div class="modal ${wide ? 'wide' : ''}">${html}</div>`;
  ov.addEventListener('click', (e) => { if (e.target === ov) closeModal(); });
  $('#amodalRoot').appendChild(ov);
}
function closeModal() { const ov = $('#amOv'); if (ov) ov.remove(); }
function askConfirm(text, onYes) {
  openModal(`<div class="m-head"><h3>${esc(text)}</h3></div>
    <div class="m-foot"><button class="btn ghost" id="cfNo">${esc(t('no'))}</button>
    <button class="btn danger" id="cfYes">${esc(t('yes'))}</button></div>`);
  $('#cfNo').onclick = closeModal;
  $('#cfYes').onclick = () => { closeModal(); onYes(); };
}
function setTheme(th) {
  S.theme = th === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = S.theme;
  localStorage.setItem('nx_atheme', S.theme);
  $('#aThemeUse').setAttribute('href', S.theme === 'dark' ? '#a-moon' : '#a-sun');
  renderPage();
}
function setLang(l) {
  S.lang = I18N[l] ? l : 'uz';
  localStorage.setItem('nx_alang', S.lang);
  document.documentElement.lang = S.lang;
  $('#aLangCode').textContent = S.lang.toUpperCase();
  $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $$('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
  if (S.authed) renderPage();
}
function applyThemeColors() {
  const st = S.settings || {};
  if (st.theme_primary) document.documentElement.style.setProperty('--primary', st.theme_primary);
  if (st.theme_accent) document.documentElement.style.setProperty('--accent', st.theme_accent);
}
function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
function stPill(s) { return `<span class="st st-${esc(s)}">${esc(t('st_' + s))}</span>`; }
function switchHtml(on) { return `<button type="button" class="switch ${on ? 'on' : ''}" data-sw="${on ? 1 : 0}"></button>`; }
function bindSwitches(root = document) {
  $$('[data-sw]', root).forEach((b) => b.onclick = () => {
    const on = b.dataset.sw !== '1';
    b.dataset.sw = on ? '1' : '0'; b.classList.toggle('on', on);
  });
}
async function uploadFile(file, target) {
  const fd = new FormData(); fd.append('file', file);
  const d = await api('/api/admin/upload?target=' + target, { method: 'POST', form: fd });
  return d.url;
}
function upFieldHTML(inputId, label, target) {
  return `<div class="field"><label>${esc(label)}</label><div class="up-row">
    <div class="field"><input id="${inputId}" placeholder="https://…"></div>
    <button type="button" class="btn ghost sm" data-up="${target}" data-for="${inputId}">
    <svg style="width:16px;height:16px"><use href="#a-upload"/></svg>${esc(t('upload'))}</button>
  </div></div><input type="file" data-upfile="${target}" accept="image/jpeg,image/png,image/webp" hidden>`;
}
function bindUploads(root = document) {
  $$('[data-up]', root).forEach((b) => b.onclick = () => {
    const f = document.querySelector(`[data-upfile="${b.dataset.up}"]`);
    if (f) { f.dataset.for = b.dataset.for; f.click(); }
  });
  $$('[data-upfile]', root).forEach((f) => f.onchange = async () => {
    if (!f.files[0]) return;
    try {
      const url = await uploadFile(f.files[0], f.dataset.upfile);
      const inp = document.getElementById(f.dataset.for);
      if (inp) inp.value = url;
      const prev = document.getElementById(f.dataset.for + '_prev');
      if (prev) { prev.src = url; prev.hidden = false; }
      toast(t('up_done'));
    } catch { toast(t('t_err'), 'err'); }
    f.value = '';
  });
}

/* ---------------- auth ---------------- */
function showLogin() {
  S.authed = false;
  $('#shell').hidden = true; $('#loginWrap').hidden = false;
}
function showShell() {
  S.authed = true;
  $('#loginWrap').hidden = true; $('#shell').hidden = false;
  renderPage();
}
async function boot() {
  document.documentElement.dataset.theme = S.theme;
  $('#aThemeUse').setAttribute('href', S.theme === 'dark' ? '#a-moon' : '#a-sun');
  $('#aLangCode').textContent = S.lang.toUpperCase();
  $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $$('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
  $('#loginBtn').onclick = doLogin;
  $('#loginPass').addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
  $$('#sideNav .sn').forEach((b) => b.onclick = () => {
    S.page = b.dataset.page;
    $$('#sideNav .sn').forEach((x) => x.classList.toggle('active', x === b));
    $('#side').classList.remove('open');
    renderPage();
  });
  $('#aThemeBtn').onclick = () => setTheme(S.theme === 'dark' ? 'light' : 'dark');
  $('#aLangBtn').onclick = () => setLang(S.lang === 'uz' ? 'ru' : S.lang === 'ru' ? 'en' : 'uz');
  $('#logoutBtn').onclick = async () => { await api('/api/admin/logout', { method: 'POST' }).catch(() => { }); showLogin(); };
  $('#burger').onclick = () => $('#side').classList.toggle('open');
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  try {
    const me = await api('/api/admin/me');
    if (me.is_admin) { showShell(); } else showLogin();
  } catch { showLogin(); }
}
async function doLogin() {
  const pass = $('#loginPass').value;
  const err = $('#loginErr');
  try {
    await api('/api/admin/login', { method: 'POST', body: { password: pass } });
    $('#loginPass').value = ''; err.hidden = true;
    showShell();
  } catch { err.textContent = t('login_err'); err.hidden = false; }
}

/* ---------------- router ---------------- */
const TITLES = { dash: 'm_dash', orders: 'm_orders', users: 'm_users', games: 'm_games', packages: 'm_packages', payments: 'm_payments', settings: 'm_settings' };
function renderPage() {
  charts.forEach((c) => { try { c.destroy(); } catch { } }); charts = [];
  $('#pageTitle').textContent = t(TITLES[S.page] || 'm_dash');
  $$('#sideNav .sn').forEach((x) => x.classList.toggle('active', x.dataset.page === S.page));
  ({ dash: pDash, orders: pOrders, users: pUsers, games: pGames, packages: pPackages, payments: pPayments, settings: pSettings })[S.page]();
}
function loading() { $('#apage').innerHTML = `<div class="loading-dots"><span></span><span></span><span></span></div>`; }

/* ---------------- DASHBOARD ---------------- */
async function pDash() {
  loading();
  let d;
  try { d = await api('/api/admin/stats'); } catch { $('#apage').innerHTML = `<div class="empty">${esc(t('t_err'))}</div>`; return; }
  const c = d.counts, bs = c.by_status;
  const badge = $('#navPending');
  if (bs.pending > 0) { badge.hidden = false; badge.textContent = bs.pending; } else badge.hidden = true;
  const hasChart = typeof Chart !== 'undefined';
  $('#apage').innerHTML = `
    <div class="cards rise">
      <div class="scard"><small>${esc(t('c_users'))} • +${c.today_users}</small><b class="count" data-n="${c.users}">0</b><span>Total</span></div>
      <div class="scard"><small>${esc(t('c_orders'))} • +${c.today_orders}</small><b class="count" data-n="${c.orders}">0</b><span>Total</span></div>
      <div class="scard good"><small>${esc(t('c_revenue'))}</small><b class="count" data-n="${Math.round(c.revenue)}">0</b><span>${esc(t('c_today'))}: ${fmtMoney(c.today_revenue)}</span></div>
      <div class="scard hot"><small>${esc(t('c_pending'))}</small><b class="count" data-n="${bs.pending}">0</b><span>${esc(t('m_orders'))} →</span></div>
    </div>
    <div class="cards rise" style="grid-template-columns:repeat(4,1fr)">
      <div class="scard"><small>${esc(t('c_paid'))}</small><b class="count" data-n="${bs.paid}">0</b></div>
      <div class="scard"><small>${esc(t('c_processing'))}</small><b class="count" data-n="${bs.processing}">0</b></div>
      <div class="scard"><small>${esc(t('c_completed'))}</small><b class="count" data-n="${bs.completed}">0</b></div>
      <div class="scard"><small>${esc(t('c_cancelled'))}</small><b class="count" data-n="${bs.cancelled}">0</b></div>
    </div>
    ${hasChart ? `
    <div class="grid2 rise">
      <div class="panel"><h3>${esc(t('ch_daily'))}</h3><div class="sub">${esc(t('ch_daily_sub'))}</div><canvas id="chDaily"></canvas></div>
      <div class="panel"><h3>${esc(t('ch_games'))}</h3><div class="sub">${esc(t('ch_games_sub'))}</div><canvas id="chGames"></canvas></div>
    </div>
    <div class="grid2 rise">
      <div class="panel"><h3>${esc(t('ch_monthly'))}</h3><div class="sub">${esc(t('ch_monthly_sub'))}</div><canvas id="chMonthly"></canvas></div>
      <div class="panel"><h3>${esc(t('ch_status'))}</h3><div class="sub">${esc(t('recent'))}</div><canvas id="chStatus"></canvas></div>
    </div>` : `<div class="panel rise"><h3>Charts</h3><div class="sub">Chart.js CDN offline</div></div>`}
    <div class="grid2 rise">
      <div class="panel"><h3>${esc(t('recent'))}</h3><div class="sub">TOP-8</div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${esc(t('th_code'))}</th><th>${esc(t('th_game'))}</th><th>${esc(t('th_price'))}</th><th>${esc(t('th_status'))}</th></tr></thead>
        <tbody>${d.recent.map((o) => `<tr><td class="code">${esc(o.order_code)}</td><td>${esc(o.game_name)}</td><td><b>${fmtMoney(o.price)}</b></td><td>${stPill(o.status)}</td></tr>`).join('') || `<tr><td colspan="4" class="empty">${esc(t('empty'))}</td></tr>`}</tbody></table></div></div>
      <div class="panel"><h3>${esc(t('ch_top'))}</h3><div class="sub">${esc(t('ch_top_sub'))}</div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>${esc(t('th_pkg'))}</th><th>${esc(t('l_orders'))}</th><th>${esc(t('l_revenue'))}</th></tr></thead>
        <tbody>${d.top_packages.map((p, i) => `<tr><td><b>${i + 1}</b></td><td>${esc(p.package_name)}<br><small style="color:var(--mut)">${esc(p.game_name)}</small></td><td><b>${p.orders}</b></td><td><b>${fmtMoney(p.revenue)}</b></td></tr>`).join('') || `<tr><td colspan="4" class="empty">${esc(t('empty'))}</td></tr>`}</tbody></table></div></div>
    </div>`;
  // count-up
  $$('.count').forEach((el) => {
    const target = +el.dataset.n, t0 = performance.now(), dur = 900;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmtMoney(Math.round(target * e));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  if (!hasChart) return;
  const grid = cssVar('--stroke-soft') || 'rgba(125,211,252,.08)';
  const tick = cssVar('--mut') || '#8fa6c9';
  Chart.defaults.font.family = 'Manrope,sans-serif';
  Chart.defaults.color = tick;
  const acc = cssVar('--accent') || '#38bdf8', prim = cssVar('--primary') || '#1d4ed8';
  // daily
  const dctx = $('#chDaily').getContext('2d');
  const grad = dctx.createLinearGradient(0, 0, 0, 280);
  grad.addColorStop(0, acc + '55'); grad.addColorStop(1, acc + '00');
  charts.push(new Chart(dctx, {
    type: 'line',
    data: { labels: d.daily.map((x) => x.date.slice(5)), datasets: [
      { label: t('l_revenue'), data: d.daily.map((x) => x.revenue), borderColor: acc, backgroundColor: grad, fill: true, tension: .45, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 5, yAxisID: 'y' },
      { label: t('l_orders'), data: d.daily.map((x) => x.orders), borderColor: '#818cf8', borderDash: [6, 5], tension: .45, borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, yAxisID: 'y1' },
    ]},
    options: { responsive: true, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { labels: { boxWidth: 12, usePointStyle: true } } },
      scales: { x: { grid: { color: grid } }, y: { grid: { color: grid }, ticks: { callback: (v) => v >= 1000 ? (v / 1000) + 'k' : v } }, y1: { position: 'right', grid: { display: false }, ticks: { precision: 0 } } } },
  }));
  // games doughnut
  charts.push(new Chart($('#chGames'), {
    type: 'doughnut',
    data: { labels: d.games.map((g) => g.game_name), datasets: [{ data: d.games.map((g) => g.revenue),
      backgroundColor: ['#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa'],
      borderWidth: 0, hoverOffset: 10 }]},
    options: { responsive: true, cutout: '62%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, usePointStyle: true, padding: 16 } } } },
  }));
  // monthly bar
  charts.push(new Chart($('#chMonthly'), {
    type: 'bar',
    data: { labels: d.monthly.map((x) => { const [y, m] = x.month.split('-'); return MONTHS[S.lang][+m - 1] + ' ' + y.slice(2); }),
      datasets: [{ label: t('l_revenue'), data: d.monthly.map((x) => x.revenue),
        backgroundColor: d.monthly.map((_, i, a) => i === a.length - 1 ? prim : acc + 'aa'),
        borderRadius: 8, borderSkipped: false }]},
    options: { responsive: true, plugins: { legend: { display: false } },
      scales: { x: { grid: { display: false } }, y: { grid: { color: grid }, ticks: { callback: (v) => v >= 1000 ? (v / 1000) + 'k' : v } } } },
  }));
  // status doughnut
  charts.push(new Chart($('#chStatus'), {
    type: 'doughnut',
    data: { labels: ['pending', 'paid', 'processing', 'completed', 'cancelled'].map((s) => t('st_' + s)),
      datasets: [{ data: ['pending', 'paid', 'processing', 'completed', 'cancelled'].map((s) => bs[s] || 0),
        backgroundColor: ['#fbbf24', '#38bdf8', '#818cf8', '#34d399', '#f87171'], borderWidth: 0, hoverOffset: 10 }]},
    options: { responsive: true, cutout: '62%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, usePointStyle: true, padding: 14 } } } },
  }));
}

/* ---------------- ORDERS ---------------- */
async function pOrders() {
  loading();
  try { S.games = (await api('/api/admin/games')).games; } catch { S.games = []; }
  const f = S.orders;
  const q = new URLSearchParams({ page: f.page, per_page: 15, q: f.q, status: f.status, game_id: f.game_id });
  let d;
  try { d = await api('/api/admin/orders?' + q); } catch { $('#apage').innerHTML = `<div class="empty">${esc(t('t_err'))}</div>`; return; }
  const pages = Math.max(1, Math.ceil(d.total / d.per_page));
  $('#apage').innerHTML = `
    <div class="page-head rise"><h3>${esc(t('m_orders'))}</h3><span class="cnt">${d.total} ${esc(t('of'))}</span></div>
    <div class="filters rise">
      <input id="fQ" value="${esc(f.q)}" placeholder="${esc(t('f_search'))}">
      <select id="fS"><option value="">${esc(t('f_status'))}: ${esc(t('all'))}</option>
        ${['pending', 'paid', 'processing', 'completed', 'cancelled'].map((s) => `<option value="${s}" ${f.status === s ? 'selected' : ''}>${esc(t('st_' + s))}</option>`).join('')}</select>
      <select id="fG"><option value="">${esc(t('f_game'))}: ${esc(t('all'))}</option>
        ${S.games.map((g) => `<option value="${g.id}" ${String(f.game_id) === String(g.id) ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select>
    </div>
    <div class="panel rise" style="padding:12px"><div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>${esc(t('th_code'))}</th><th>${esc(t('th_client'))}</th><th>${esc(t('th_game'))}</th><th>${esc(t('th_pkg'))}</th><th>${esc(t('th_price'))}</th><th>${esc(t('th_date'))}</th><th>${esc(t('th_status'))}</th><th>${esc(t('th_act'))}</th></tr></thead>
      <tbody>${d.orders.map((o) => `<tr>
        <td class="code">${esc(o.order_code)}${o.receipt_url && o.status === 'pending' ? ` <span class="st st-pending" style="font-size:9px">${esc(t('new_badge'))}</span>` : ''}</td>
        <td>${esc(o.first_name)} ${esc(o.last_name)}<br><small style="color:var(--mut)">${esc(o.game_username || '')}</small></td>
        <td>${esc(o.game_name)}</td><td>${esc(o.package_name)}<br><small style="color:var(--mut)">${esc(o.package_amount || '')}</small></td>
        <td><b>${fmtMoney(o.price)} ${esc(o.currency)}</b></td><td style="white-space:nowrap">${esc(fmtDate(o.created_at))}</td>
        <td>${stPill(o.status)}</td>
        <td><div class="row-actions"><button class="icon-btn" data-view="${o.id}" title="${esc(t('btn_view'))}"><svg><use href="#a-eye"/></svg></button></div></td>
      </tr>`).join('') || `<tr><td colspan="8" class="empty">${esc(t('empty'))}</td></tr>`}</tbody></table></div>
      <div class="pager"><button class="btn ghost sm" id="pgPrev" ${d.page <= 1 ? 'disabled' : ''}>${esc(t('prev'))}</button>
      <span>${d.page} / ${pages}</span>
      <button class="btn ghost sm" id="pgNext" ${d.page >= pages ? 'disabled' : ''}>${esc(t('nextpg'))}</button></div>
    </div>`;
  let deb;
  $('#fQ').oninput = (e) => { clearTimeout(deb); deb = setTimeout(() => { f.q = e.target.value; f.page = 1; pOrders(); }, 450); };
  $('#fS').onchange = (e) => { f.status = e.target.value; f.page = 1; pOrders(); };
  $('#fG').onchange = (e) => { f.game_id = e.target.value; f.page = 1; pOrders(); };
  $('#pgPrev').onclick = () => { if (f.page > 1) { f.page--; pOrders(); } };
  $('#pgNext').onclick = () => { if (f.page < pages) { f.page++; pOrders(); } };
  $$('#apage [data-view]').forEach((b) => b.onclick = () => orderModal(+b.dataset.view));
}
async function orderModal(id) {
  openModal(`<div class="loading-dots"><span></span><span></span><span></span></div>`, true);
  let d;
  try { d = await api('/api/admin/orders/' + id); } catch { closeModal(); toast(t('t_err'), 'err'); return; }
  const o = d.order, h = d.history || [];
  openModal(`
    <div class="m-head"><h3>${esc(t('o_detail'))} • ${esc(o.order_code)}</h3>
      <button class="icon-btn" onclick="closeModal()"><svg><use href="#a-x"/></svg></button></div>
    <div style="margin-bottom:8px">${stPill(o.status)}</div>
    <div class="kv"><span>${esc(t('th_game'))}</span><b>${esc(o.game_name)}</b></div>
    <div class="kv"><span>${esc(t('th_pkg'))}</span><b>${esc(o.package_name)} (${esc(o.package_amount || '')})</b></div>
    <div class="kv"><span>${esc(t('o_name'))}</span><b>${esc(o.first_name)} ${esc(o.last_name)}</b></div>
    <div class="kv"><span>${esc(t('o_player'))}</span><b>${esc(o.game_username || '')}</b></div>
    <div class="kv"><span>${esc(t('th_price'))}</span><b>${fmtMoney(o.price)} ${esc(o.currency)}</b></div>
    <div class="kv"><span>${esc(t('th_date'))}</span><b>${esc(fmtDate(o.created_at))}</b></div>
    <div class="kv"><span>Telegram ID</span><b>${esc(o.telegram_id)}</b></div>
    <h3 style="font-family:var(--font-d);font-size:14px;margin:14px 0 4px">${esc(t('o_receipt'))}</h3>
    ${o.receipt_url ? `<a href="${esc(o.receipt_url)}" target="_blank"><img class="rc-img" src="${esc(o.receipt_url)}" alt="receipt"></a>` : `<div class="empty">${esc(t('no_receipt'))}</div>`}
    <h3 style="font-family:var(--font-d);font-size:14px;margin:14px 0 4px">${esc(t('o_history'))}</h3>
    <ul class="tl">${h.map((x) => `<li class="${x.new_status === o.status ? 'on' : ''}">${esc(t('st_' + (x.new_status || 'pending')))} <small>• ${esc(x.changed_by || '')}</small><small>${esc(fmtDate(x.created_at))}${x.note ? ' • ' + esc(x.note) : ''}</small></li>`).join('') || `<li class="on">${esc(t('st_' + o.status))}</li>`}</ul>
    <div class="frow" style="margin-top:16px">
      <div class="field"><label>${esc(t('o_status'))}</label>
        <select id="oStatus">${['pending', 'paid', 'processing', 'completed', 'cancelled'].map((s) => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${esc(t('st_' + s))}</option>`).join('')}</select></div>
      <div class="field"><label>${esc(t('o_note'))}</label><input id="oNote" value="${esc(o.admin_note || '')}" placeholder="${esc(t('o_note_ph'))}"></div>
    </div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">${esc(t('btn_close'))}</button>
      <button class="btn primary" id="oSave">${esc(t('btn_save'))}</button></div>`, true);
  $('#oSave').onclick = async () => {
    const btn = $('#oSave'); btn.disabled = true;
    try {
      await api('/api/admin/orders/' + id, { method: 'PUT', body: { status: $('#oStatus').value, admin_note: $('#oNote').value } });
      toast(t('t_status')); closeModal(); pOrders();
    } catch { btn.disabled = false; toast(t('t_err'), 'err'); }
  };
}

/* ---------------- USERS ---------------- */
async function pUsers() {
  loading();
  const f = S.users;
  const q = new URLSearchParams({ page: f.page, per_page: 15, q: f.q });
  let d;
  try { d = await api('/api/admin/users?' + q); } catch { $('#apage').innerHTML = `<div class="empty">${esc(t('t_err'))}</div>`; return; }
  const pages = Math.max(1, Math.ceil(d.total / d.per_page));
  $('#apage').innerHTML = `
    <div class="page-head rise"><h3>${esc(t('m_users'))}</h3><span class="cnt">${d.total} ${esc(t('of'))}</span></div>
    <div class="filters rise"><input id="uQ" value="${esc(f.q)}" placeholder="${esc(t('f_search'))}"></div>
    <div class="panel rise" style="padding:12px"><div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>ID</th><th>${esc(t('th_user'))}</th><th>${esc(t('th_tg'))}</th><th>${esc(t('th_lang'))}</th><th>${esc(t('th_user'))} / ${esc(t('th_spent'))}</th><th>${esc(t('th_seen'))}</th><th>${esc(t('th_act'))}</th></tr></thead>
      <tbody>${d.users.map((u) => `<tr style="${u.is_blocked ? 'opacity:.55' : ''}">
        <td class="code">${u.id}</td>
        <td><b>${esc(u.first_name || '')} ${esc(u.last_name || '')}</b>${u.is_blocked ? ' <span class="st st-cancelled">BAN</span>' : ''}</td>
        <td>${u.username ? '@' + esc(u.username) + '<br>' : ''}<small style="color:var(--mut)">${esc(u.telegram_id)}</small></td>
        <td><b>${esc((u.language || '').toUpperCase())}</b></td>
        <td><b>${u.orders_count}</b> / <b>${fmtMoney(u.total_spent)}</b></td>
        <td style="white-space:nowrap">${esc(fmtDate(u.last_seen))}</td>
        <td><button class="btn ${u.is_blocked ? 'ok' : 'danger'} sm" data-ban="${u.id}" data-b="${u.is_blocked ? 0 : 1}">
          ${esc(u.is_blocked ? t('u_unblock') : t('u_block'))}</button></td>
      </tr>`).join('') || `<tr><td colspan="7" class="empty">${esc(t('empty'))}</td></tr>`}</tbody></table></div>
      <div class="pager"><button class="btn ghost sm" id="pgPrev" ${d.page <= 1 ? 'disabled' : ''}>${esc(t('prev'))}</button>
      <span>${d.page} / ${pages}</span>
      <button class="btn ghost sm" id="pgNext" ${d.page >= pages ? 'disabled' : ''}>${esc(t('nextpg'))}</button></div>
    </div>`;
  let deb;
  $('#uQ').oninput = (e) => { clearTimeout(deb); deb = setTimeout(() => { f.q = e.target.value; f.page = 1; pUsers(); }, 450); };
  $('#pgPrev').onclick = () => { if (f.page > 1) { f.page--; pUsers(); } };
  $('#pgNext').onclick = () => { if (f.page < pages) { f.page++; pUsers(); } };
  $$('#apage [data-ban]').forEach((b) => b.onclick = async () => {
    const block = b.dataset.b === '1';
    try {
      await api('/api/admin/users/' + b.dataset.ban, { method: 'PUT', body: { is_blocked: block } });
      toast(block ? t('t_block') : t('t_unblock')); pUsers();
    } catch { toast(t('t_err'), 'err'); }
  });
}

/* ---------------- GAMES ---------------- */
async function pGames() {
  loading();
  let d;
  try { d = await api('/api/admin/games'); S.games = d.games; } catch { $('#apage').innerHTML = `<div class="empty">${esc(t('t_err'))}</div>`; return; }
  $('#apage').innerHTML = `
    <div class="page-head rise"><h3>${esc(t('m_games'))}</h3>
      <button class="btn primary sm" id="gAdd"><svg style="width:15px;height:15px"><use href="#a-plus"/></svg>${esc(t('btn_add'))}</button></div>
    <div class="ggrid rise">${S.games.map((g) => `
      <div class="gcard ${g.is_active ? '' : 'off'}">
        <div class="gi" style="background-image:url('${esc(g.image_url || '')}'),linear-gradient(135deg,${esc(g.color_from)},${esc(g.color_to)})"><b>${esc(g.name)}</b></div>
        <div class="gb"><p>${esc(g['description_' + S.lang] || g.description_uz || '')} • ${esc(g.currency_name || '')} ${g.is_active ? '' : `<span class="off-tag">OFF</span>`}</p>
          <div class="row-actions">
            <button class="btn ghost sm" data-gedit="${g.id}"><svg style="width:15px;height:15px"><use href="#a-edit"/></svg>${esc(t('btn_edit'))}</button>
            <button class="icon-btn danger" data-gdel="${g.id}"><svg><use href="#a-trash"/></svg></button>
          </div></div>
      </div>`).join('') || `<div class="empty">${esc(t('empty'))}</div>`}</div>`;
  $('#gAdd').onclick = () => gameModal(null);
  $$('#apage [data-gedit]').forEach((b) => b.onclick = () => gameModal(S.games.find((g) => g.id === +b.dataset.gedit)));
  $$('#apage [data-gdel]').forEach((b) => b.onclick = () => askConfirm(t('ask_del'), async () => {
    try { await api('/api/admin/games/' + b.dataset.gdel, { method: 'DELETE' }); toast(t('t_deleted')); pGames(); }
    catch { toast(t('t_err'), 'err'); }
  }));
}
function gameModal(g) {
  g = g || { code: '', name: '', description_uz: '', description_ru: '', description_en: '', image_url: '', currency_name: '', currency_icon_url: '', color_from: '#38bdf8', color_to: '#1d4ed8', is_active: 1, sort_order: 0 };
  openModal(`
    <div class="m-head"><h3>${esc(g.id ? t('g_edit') : t('g_add'))}</h3>
      <button class="icon-btn" onclick="closeModal()"><svg><use href="#a-x"/></svg></button></div>
    <div class="frow">
      <div class="field"><label>${esc(t('g_name'))}</label><input id="gName" value="${esc(g.name)}"></div>
      <div class="field"><label>${esc(t('g_code'))}</label><input id="gCode" value="${esc(g.code)}" ${g.id ? 'disabled' : ''} placeholder="roblox"></div>
    </div>
    <div class="field"><label>${esc(t('g_desc'))} (UZ)</label><input id="gDuz" value="${esc(g.description_uz || '')}"></div>
    <div class="field"><label>${esc(t('g_desc'))} (RU)</label><input id="gDru" value="${esc(g.description_ru || '')}"></div>
    <div class="field"><label>${esc(t('g_desc'))} (EN)</label><input id="gDen" value="${esc(g.description_en || '')}"></div>
    <img id="gImg_prev" class="logo-prev" src="${esc(g.image_url || '')}" ${g.image_url ? '' : 'hidden'} style="margin-bottom:10px;width:100%;height:130px;object-fit:cover">
    ${upFieldHTML('gImg', t('up_game') + ' / ' + t('g_image'), 'games')}
    <div class="frow">
      <div class="field"><label>${esc(t('g_currency'))}</label><input id="gCur" value="${esc(g.currency_name || '')}" placeholder="UC"></div>
      <div class="field"><label>${esc(t('g_cicon'))}</label><input id="gIcon" value="${esc(g.currency_icon_url || '')}" placeholder="https://…"></div>
    </div>
    <div class="frow3">
      <div class="field"><label>${esc(t('g_colors'))} 1</label><input type="color" id="gC1" value="${esc(g.color_from || '#38bdf8')}"></div>
      <div class="field"><label>${esc(t('g_colors'))} 2</label><input type="color" id="gC2" value="${esc(g.color_to || '#1d4ed8')}"></div>
      <div class="field"><label>${esc(t('g_order'))}</label><input type="number" id="gSort" value="${g.sort_order || 0}"></div>
    </div>
    <div class="field"><label>${esc(t('g_active'))}</label>${switchHtml(!!+g.is_active)}</div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">${esc(t('btn_cancel'))}</button>
      <button class="btn primary" id="gSave">${esc(t('btn_save'))}</button></div>`, true);
  bindSwitches($('#amOv')); bindUploads($('#amOv'));
  $('#gSave').onclick = async () => {
    const body = {
      name: $('#gName').value.trim(), description_uz: $('#gDuz').value, description_ru: $('#gDru').value, description_en: $('#gDen').value,
      image_url: $('#gImg').value.trim(), currency_name: $('#gCur').value.trim(), currency_icon_url: $('#gIcon').value.trim(),
      color_from: $('#gC1').value, color_to: $('#gC2').value, sort_order: +$('#gSort').value || 0,
      is_active: $('[data-sw]', $('#amOv')).dataset.sw === '1',
    };
    if (!g.id) body.code = $('#gCode').value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') || undefined;
    const btn = $('#gSave'); btn.disabled = true;
    try {
      await api(g.id ? '/api/admin/games/' + g.id : '/api/admin/games', { method: g.id ? 'PUT' : 'POST', body });
      toast(t('t_saved')); closeModal(); pGames();
    } catch { btn.disabled = false; toast(t('t_err'), 'err'); }
  };
}

/* ---------------- PACKAGES ---------------- */
async function pPackages() {
  loading();
  let d;
  try {
    const [g, p] = await Promise.all([api('/api/admin/games'), api('/api/admin/packages')]);
    S.games = g.games; d = p.packages;
  } catch { $('#apage').innerHTML = `<div class="empty">${esc(t('t_err'))}</div>`; return; }
  const byGame = {};
  d.forEach((p) => { (byGame[p.game_id] = byGame[p.game_id] || []).push(p); });
  $('#apage').innerHTML = `
    <div class="page-head rise"><h3>${esc(t('m_packages'))}</h3>
      <button class="btn primary sm" id="pAdd"><svg style="width:15px;height:15px"><use href="#a-plus"/></svg>${esc(t('btn_add'))}</button></div>
    ${S.games.map((g) => `
      <div class="pkg-group rise"><h4><span class="dot" style="background:linear-gradient(135deg,${esc(g.color_from)},${esc(g.color_to)})"></span>${esc(g.name)}</h4>
      ${(byGame[g.id] || []).map((p) => `
        <div class="pkg-row ${p.is_active ? '' : 'off'}"><div class="pi"><b>${esc(p.name)} ${p.bonus ? `<span class="st st-paid" style="font-size:9px">${esc(p.bonus)}</span>` : ''} ${p.is_active ? '' : '<span class="off-tag">OFF</span>'}</b>
          <small>${esc(p.amount || '')}</small></div>
          <span class="pr">${fmtMoney(p.price)} ${esc(p.currency)}</span>
          <div class="row-actions">
            <button class="icon-btn" data-pedit="${p.id}"><svg><use href="#a-edit"/></svg></button>
            <button class="icon-btn danger" data-pdel="${p.id}"><svg><use href="#a-trash"/></svg></button>
          </div></div>`).join('') || `<div class="empty">${esc(t('empty'))}</div>`}
      </div>`).join('')}`;
  window._pkgs = d;
  $('#pAdd').onclick = () => pkgModal(null);
  $$('#apage [data-pedit]').forEach((b) => b.onclick = () => pkgModal(window._pkgs.find((p) => p.id === +b.dataset.pedit)));
  $$('#apage [data-pdel]').forEach((b) => b.onclick = () => askConfirm(t('ask_del'), async () => {
    try { await api('/api/admin/packages/' + b.dataset.pdel, { method: 'DELETE' }); toast(t('t_deleted')); pPackages(); }
    catch { toast(t('t_err'), 'err'); }
  }));
}
function pkgModal(p) {
  p = p || { game_id: (S.games[0] || {}).id || '', name: '', amount: '', price: 0, currency: 'UZS', bonus: '', is_active: 1, sort_order: 0 };
  openModal(`
    <div class="m-head"><h3>${esc(p.id ? t('p_edit') : t('p_add'))}</h3>
      <button class="icon-btn" onclick="closeModal()"><svg><use href="#a-x"/></svg></button></div>
    <div class="field"><label>${esc(t('p_game'))}</label>
      <select id="pGame">${S.games.map((g) => `<option value="${g.id}" ${String(p.game_id) === String(g.id) ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select></div>
    <div class="frow">
      <div class="field"><label>${esc(t('p_name'))}</label><input id="pName" value="${esc(p.name)}"></div>
      <div class="field"><label>${esc(t('p_amount'))}</label><input id="pAmt" value="${esc(p.amount || '')}" placeholder="660 UC"></div>
    </div>
    <div class="frow3">
      <div class="field"><label>${esc(t('p_price'))}</label><input type="number" id="pPrice" value="${p.price || 0}" min="0" step="any"></div>
      <div class="field"><label>${esc(t('p_currency'))}</label><input id="pCur" value="${esc(p.currency || 'UZS')}" maxlength="8"></div>
      <div class="field"><label>${esc(t('p_order'))}</label><input type="number" id="pSort" value="${p.sort_order || 0}"></div>
    </div>
    <div class="field"><label>${esc(t('p_bonus'))}</label><input id="pBonus" value="${esc(p.bonus || '')}"></div>
    <div class="field"><label>${esc(t('p_active'))}</label>${switchHtml(!!+p.is_active)}</div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">${esc(t('btn_cancel'))}</button>
      <button class="btn primary" id="pSave">${esc(t('btn_save'))}</button></div>`);
  bindSwitches($('#amOv'));
  $('#pSave').onclick = async () => {
    const body = {
      game_id: +$('#pGame').value, name: $('#pName').value.trim() || 'Package', amount: $('#pAmt').value.trim(),
      price: +$('#pPrice').value || 0, currency: $('#pCur').value.trim() || 'UZS', bonus: $('#pBonus').value.trim(),
      sort_order: +$('#pSort').value || 0, is_active: $('[data-sw]', $('#amOv')).dataset.sw === '1',
    };
    const btn = $('#pSave'); btn.disabled = true;
    try {
      await api(p.id ? '/api/admin/packages/' + p.id : '/api/admin/packages', { method: p.id ? 'PUT' : 'POST', body });
      toast(t('t_saved')); closeModal(); pPackages();
    } catch { btn.disabled = false; toast(t('t_err'), 'err'); }
  };
}

/* ---------------- PAYMENTS ---------------- */
async function pPayments() {
  loading();
  let d;
  try { d = (await api('/api/admin/payments')).methods; } catch { $('#apage').innerHTML = `<div class="empty">${esc(t('t_err'))}</div>`; return; }
  $('#apage').innerHTML = `
    <div class="page-head rise"><h3>${esc(t('m_payments'))}</h3>
      <button class="btn primary sm" id="mAdd"><svg style="width:15px;height:15px"><use href="#a-plus"/></svg>${esc(t('btn_add'))}</button></div>
    <div class="rise">${d.map((m) => `
      <div class="pm-card ${m.is_active ? '' : 'off'}"><div class="top"><b>${esc(m.name)}</b>
        ${m.is_active ? '' : '<span class="off-tag">OFF</span>'}
        <div class="row-actions"><button class="icon-btn" data-medit="${m.id}"><svg><use href="#a-edit"/></svg></button>
        <button class="icon-btn danger" data-mdel="${m.id}"><svg><use href="#a-trash"/></svg></button></div></div>
        <pre>${esc(m.details || '')}</pre></div>`).join('') || `<div class="empty">${esc(t('empty'))}</div>`}</div>`;
  window._pms = d;
  $('#mAdd').onclick = () => pmModal(null);
  $$('#apage [data-medit]').forEach((b) => b.onclick = () => pmModal(window._pms.find((m) => m.id === +b.dataset.medit)));
  $$('#apage [data-mdel]').forEach((b) => b.onclick = () => askConfirm(t('ask_del'), async () => {
    try { await api('/api/admin/payments/' + b.dataset.mdel, { method: 'DELETE' }); toast(t('t_deleted')); pPayments(); }
    catch { toast(t('t_err'), 'err'); }
  }));
}
function pmModal(m) {
  m = m || { name: '', details: '', instructions_uz: '', instructions_ru: '', instructions_en: '', is_active: 1, sort_order: 0 };
  openModal(`
    <div class="m-head"><h3>${esc(m.id ? t('pm_edit') : t('pm_add'))}</h3>
      <button class="icon-btn" onclick="closeModal()"><svg><use href="#a-x"/></svg></button></div>
    <div class="frow">
      <div class="field"><label>${esc(t('pm_name'))}</label><input id="mName" value="${esc(m.name)}"></div>
      <div class="field"><label>${esc(t('pm_order'))}</label><input type="number" id="mSort" value="${m.sort_order || 0}"></div>
    </div>
    <div class="field"><label>${esc(t('pm_details'))}</label><textarea id="mDet" rows="3">${esc(m.details || '')}</textarea></div>
    <div class="field"><label>${esc(t('pm_inst'))} (UZ)</label><textarea id="mIuz" rows="2">${esc(m.instructions_uz || '')}</textarea></div>
    <div class="field"><label>${esc(t('pm_inst'))} (RU)</label><textarea id="mIru" rows="2">${esc(m.instructions_ru || '')}</textarea></div>
    <div class="field"><label>${esc(t('pm_inst'))} (EN)</label><textarea id="mIen" rows="2">${esc(m.instructions_en || '')}</textarea></div>
    <div class="field"><label>${esc(t('pm_active'))}</label>${switchHtml(!!+m.is_active)}</div>
    <div class="m-foot"><button class="btn ghost" onclick="closeModal()">${esc(t('btn_cancel'))}</button>
      <button class="btn primary" id="mSave">${esc(t('btn_save'))}</button></div>`, true);
  bindSwitches($('#amOv'));
  $('#mSave').onclick = async () => {
    const body = {
      name: $('#mName').value.trim() || 'Card', details: $('#mDet').value,
      instructions_uz: $('#mIuz').value, instructions_ru: $('#mIru').value, instructions_en: $('#mIen').value,
      sort_order: +$('#mSort').value || 0, is_active: $('[data-sw]', $('#amOv')).dataset.sw === '1',
    };
    const btn = $('#mSave'); btn.disabled = true;
    try {
      await api(m.id ? '/api/admin/payments/' + m.id : '/api/admin/payments', { method: m.id ? 'PUT' : 'POST', body });
      toast(t('t_saved')); closeModal(); pPayments();
    } catch { btn.disabled = false; toast(t('t_err'), 'err'); }
  };
}

/* ---------------- SETTINGS ---------------- */
async function pSettings() {
  loading();
  let d;
  try { d = (await api('/api/admin/settings')).settings; S.settings = d; applyThemeColors(); }
  catch { $('#apage').innerHTML = `<div class="empty">${esc(t('t_err'))}</div>`; return; }
  const v = (k) => esc(d[k] || '');
  $('#apage').innerHTML = `
    <div class="page-head rise"><h3>${esc(t('m_settings'))}</h3></div>
    <div class="set-grid rise">
      <div class="panel"><h3>${esc(t('s_app'))}</h3><div class="sub">NEXORA</div>
        <div class="field"><label>${esc(t('s_app'))}</label><input id="s_app_name" value="${v('app_name')}"></div>
        <div class="field"><label>${esc(t('s_tag'))} (UZ)</label><input id="s_app_tagline_uz" value="${v('app_tagline_uz')}"></div>
        <div class="field"><label>${esc(t('s_tag'))} (RU)</label><input id="s_app_tagline_ru" value="${v('app_tagline_ru')}"></div>
        <div class="field"><label>${esc(t('s_tag'))} (EN)</label><input id="s_app_tagline_en" value="${v('app_tagline_en')}"></div>
        <div class="field"><label>${esc(t('s_deflang'))}</label>
          <select id="s_default_lang">${['uz', 'ru', 'en'].map((l) => `<option value="${l}" ${d.default_lang === l ? 'selected' : ''}>${l.toUpperCase()}</option>`).join('')}</select></div>
      </div>
      <div class="panel"><h3>Logo & Media</h3><div class="sub">URL</div>
        <div class="up-row" style="margin-bottom:11px"><img id="s_logo_url_prev" class="logo-prev" src="${v('logo_url')}" ${d.logo_url ? '' : 'hidden'}>
          <div class="field"><label>${esc(t('s_logo'))}</label><input id="s_logo_url" value="${v('logo_url')}" placeholder="https://…"></div>
          <button type="button" class="btn ghost sm" data-up="logos" data-for="s_logo_url">${esc(t('upload'))}</button></div>
        <div class="field"><label>${esc(t('s_hero'))}</label><input id="s_hero_banner_url" value="${v('hero_banner_url')}" placeholder="https://…"></div>
        <input type="file" data-upfile="logos" accept="image/jpeg,image/png,image/webp" hidden>
        <div class="frow">
          <div class="field"><label>${esc(t('s_colors'))} 1</label><input type="color" id="s_theme_primary" value="${v('theme_primary') || '#1d4ed8'}"></div>
          <div class="field"><label>${esc(t('s_colors'))} 2</label><input type="color" id="s_theme_accent" value="${v('theme_accent') || '#38bdf8'}"></div>
        </div>
      </div>
      <div class="panel"><h3>Support</h3><div class="sub">Telegram</div>
        <div class="field"><label>${esc(t('s_support'))}</label><input id="s_support_username" value="${v('support_username')}" placeholder="nexora_support"></div>
        <div class="field"><label>${esc(t('s_suptext'))} (UZ)</label><textarea id="s_support_text_uz" rows="2">${v('support_text_uz')}</textarea></div>
        <div class="field"><label>${esc(t('s_suptext'))} (RU)</label><textarea id="s_support_text_ru" rows="2">${v('support_text_ru')}</textarea></div>
        <div class="field"><label>${esc(t('s_suptext'))} (EN)</label><textarea id="s_support_text_en" rows="2">${v('support_text_en')}</textarea></div>
      </div>
      <div class="panel"><h3>${esc(t('s_ann'))} & Admin</h3><div class="sub">—</div>
        <div class="field"><label>${esc(t('s_ann'))} (UZ)</label><input id="s_announcement_uz" value="${v('announcement_uz')}"></div>
        <div class="field"><label>${esc(t('s_ann'))} (RU)</label><input id="s_announcement_ru" value="${v('announcement_ru')}"></div>
        <div class="field"><label>${esc(t('s_ann'))} (EN)</label><input id="s_announcement_en" value="${v('announcement_en')}"></div>
        <div class="field"><label>${esc(t('s_pass'))}</label><input type="password" id="s_admin_password" placeholder="${esc(t('s_pass_ph'))}" autocomplete="new-password"></div>
      </div>
    </div>
    <div style="margin-top:14px"><button class="btn primary big rise" id="sSave">${esc(t('btn_save'))}</button></div>`;
  bindUploads($('#apage'));
  $('#sSave').onclick = async () => {
    const keys = ['app_name', 'app_tagline_uz', 'app_tagline_ru', 'app_tagline_en', 'logo_url', 'hero_banner_url',
      'support_username', 'support_text_uz', 'support_text_ru', 'support_text_en', 'default_lang',
      'theme_primary', 'theme_accent', 'announcement_uz', 'announcement_ru', 'announcement_en'];
    const body = {};
    keys.forEach((k) => { body[k] = $('#s_' + k).value; });
    const np = $('#s_admin_password').value.trim();
    if (np) body.admin_password = np;
    const btn = $('#sSave'); btn.disabled = true;
    try {
      const r = await api('/api/admin/settings', { method: 'PUT', body });
      S.settings = r.settings; applyThemeColors();
      toast(t('s_saved')); $('#s_admin_password').value = '';
    } catch { toast(t('t_err'), 'err'); }
    btn.disabled = false;
  };
}

window.closeModal = closeModal;
document.addEventListener('DOMContentLoaded', boot);
