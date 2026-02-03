/**
 * БК Вилки с Аманом — JavaScript
 * Логика: форма, Google Sheets, переключение страниц
 */

// ========================================
// КОНФИГУРАЦИЯ
// ========================================

// URL Google Apps Script (вставьте сюда после развёртывания)
const GOOGLE_SHEETS_URL = '';

// ========================================
// DOM ЭЛЕМЕНТЫ
// ========================================

const landing = document.getElementById('landing');
const dashboard = document.getElementById('dashboard');
const modalOverlay = document.getElementById('modal-overlay');
const modal = document.getElementById('modal');
const ctaBtn = document.getElementById('cta-btn');
const modalClose = document.getElementById('modal-close');
const registerForm = document.getElementById('register-form');
const logoutBtn = document.getElementById('logout-btn');
const userNameSpan = document.getElementById('user-name');
const heroDotsContainer = document.getElementById('hero-dots');

// ========================================
// ПЕРЕЛИВ ЗАГОЛОВКА «БК Вилки с Аманом» (белый оттенок движется по тексту)
// ========================================

function startHeroTitleShimmer() {
  const title = document.querySelector('.hero-title');
  if (!title) return;

  const durationMs = 6000; // один проход (начало → конец или конец → начало)
  const cycleMs = durationMs * 2; // полный цикл туда-обратно
  let start = null;

  function tick(now) {
    if (!start) start = now;
    const elapsed = (now - start) % cycleMs;
    const t = elapsed < durationMs
      ? elapsed / durationMs
      : 1 - (elapsed - durationMs) / durationMs;
    const position = t * 100;
    title.style.setProperty('--title-shimmer', position + '%');
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

// ========================================
// ДИНАМИЧЕСКИЙ ФОН (Точки)
// ========================================

function createDots() {
  const dotsCount = 50;
  
  for (let i = 0; i < dotsCount; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    
    // Случайная позиция по горизонтали
    dot.style.left = Math.random() * 100 + '%';
    
    // Случайная задержка и длительность
    const duration = 8 + Math.random() * 12; // 8-20 секунд
    const delay = Math.random() * 10;
    
    dot.style.animationDuration = duration + 's';
    dot.style.animationDelay = delay + 's';
    
    // Случайный размер
    const size = 2 + Math.random() * 4;
    dot.style.width = size + 'px';
    dot.style.height = size + 'px';
    
    // Случайная прозрачность
    dot.style.opacity = 0.2 + Math.random() * 0.5;
    
    heroDotsContainer.appendChild(dot);
  }
}

// ========================================
// МОДАЛЬНОЕ ОКНО
// ========================================

function openModal() {
  modalOverlay.classList.add('active');
  modalOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  
  // Фокус на первый инпут
  setTimeout(() => {
    const firstInput = registerForm.querySelector('input');
    if (firstInput) firstInput.focus();
  }, 300);
}

function closeModal() {
  modalOverlay.classList.remove('active');
  modalOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// Обработчики модалки
ctaBtn.addEventListener('click', openModal);
modalClose.addEventListener('click', closeModal);

// Закрытие по клику на оверлей
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) {
    closeModal();
  }
});

// Закрытие по Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
    closeModal();
  }
});

// ========================================
// ПЕРЕКЛЮЧЕНИЕ СТРАНИЦ
// ========================================

function showDashboard(userName) {
  landing.classList.remove('active');
  dashboard.classList.add('active');
  userNameSpan.textContent = userName;

  localStorage.setItem('bk_vilki_user', JSON.stringify({ name: userName }));

  loadAllData().then(() => animateDashboardCards());
  if (window.landingRefreshInterval) {
    clearInterval(window.landingRefreshInterval);
    window.landingRefreshInterval = null;
  }
  if (window.dashboardRefreshInterval) clearInterval(window.dashboardRefreshInterval);
  window.dashboardRefreshInterval = setInterval(loadAllData, 30000);
}

function showLanding() {
  dashboard.classList.remove('active');
  landing.classList.add('active');
  localStorage.removeItem('bk_vilki_user');
  if (window.dashboardRefreshInterval) {
    clearInterval(window.dashboardRefreshInterval);
    window.dashboardRefreshInterval = null;
  }
  if (window.landingRefreshInterval) clearInterval(window.landingRefreshInterval);
  window.landingRefreshInterval = setInterval(loadLandingCircleData, 60000);
}

function animateDashboardCards() {
  const cards = dashboard.querySelectorAll('.stat-card, .slot-card');
  cards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      card.style.transition = 'all 0.4s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, 100 + index * 50);
  });
}

// ========================================
// ФОРМА РЕГИСТРАЦИИ
// ========================================

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(registerForm);
  const data = {
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    telegram: formData.get('telegram'),
    timestamp: new Date().toISOString()
  };
  
  // Валидация
  if (!data.name || !data.email || !data.phone || !data.telegram) {
    alert('Пожалуйста, заполните все поля');
    return;
  }
  
  // Показываем лоадер на кнопке
  const submitBtn = registerForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Отправка...';
  submitBtn.disabled = true;
  
  try {
    // Отправка в Google Sheets (если URL настроен)
    if (GOOGLE_SHEETS_URL) {
      await sendToGoogleSheets(data);
    }
    
    // Закрываем модалку и показываем дашборд
    closeModal();
    showDashboard(data.name);
    
    // Очищаем форму
    registerForm.reset();
    
  } catch (error) {
    console.error('Ошибка отправки:', error);
    alert('Произошла ошибка. Попробуйте ещё раз.');
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});

// ========================================
// GOOGLE SHEETS — РЕГИСТРАЦИЯ (Apps Script)
// ========================================

async function sendToGoogleSheets(data) {
  if (!GOOGLE_SHEETS_URL) {
    console.warn('Google Sheets URL не настроен');
    return;
  }
  
  const response = await fetch(GOOGLE_SHEETS_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  
  return response;
}

// ========================================
// GOOGLE SHEETS — ДАННЫЕ ДАШБОРДА (Trading Slots)
// ID таблицы: 1X10DCGgDobZJHVGoQPcuL2VUP63a0aqlLRYbOwbVj10
// ========================================

const SHEET_ID = '1X10DCGgDobZJHVGoQPcuL2VUP63a0aqlLRYbOwbVj10';

const SHEETS = {
  admin: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=ADMIN`,
  public: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=PUBLIC`
};

let allSlotsData = [];
let usingDemoData = false;

/** Демо-данные, если таблица недоступна (CORS, не опубликована и т.д.) */
function getDemoSlots() {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 14);
  return [
    {
      number: 1,
      participant: 'Игорь',
      startDate: startDate.toLocaleDateString('ru-RU'),
      daysWorked: '14',
      entry: 500000,
      current: 515300,
      earned: 15300,
      avgPercent: 1.13,
      tgLogin: '@example',
      fixation: 0,
      status: 'В работе',
      days: [
        { date: '18.01.2025', capital: 500000, earned: 0, percent: 0, operations: 0 },
        { date: '19.01.2025', capital: 502500, earned: 2500, percent: 0.5, operations: 5 },
        { date: '20.01.2025', capital: 506000, earned: 3500, percent: 0.7, operations: 8 },
        { date: '25.01.2025', capital: 515300, earned: 15300, percent: 1.13, operations: 42 }
      ],
      daysCount: 4
    }
  ];
}

async function loadAllData() {
  try {
    // Сначала пробуем два листа (ADMIN + PUBLIC)
    try {
      const [adminData, publicData] = await Promise.all([
        fetchSheetData(SHEETS.admin),
        fetchSheetData(SHEETS.public)
      ]);
      const adminRows = parseSheetRows(adminData);
      const publicRows = parseSheetRows(publicData);
      const slots = processSlots(adminRows, publicRows);
      if (slots.length > 0) {
        usingDemoData = false;
        hideDemoDataNotice();
        allSlotsData = slots;
        window.allSlots = slots;
        updateDashboardUI(slots);
        return slots;
      }
    } catch (e) {
      console.warn('Загрузка ADMIN+PUBLIC не удалась, пробуем только ADMIN:', e.message);
    }

    // Fallback: один лист ADMIN
    try {
      const adminData = await fetchSheetData(SHEETS.admin);
      const adminRows = parseSheetRows(adminData);
      const slots = processSlotsFromAdminOnly(adminRows);
      if (slots.length > 0) {
        usingDemoData = false;
        hideDemoDataNotice();
        allSlotsData = slots;
        window.allSlots = slots;
        updateDashboardUI(slots);
        return slots;
      }
    } catch (e) {
      console.warn('Загрузка только ADMIN не удалась:', e.message);
    }

    // Таблица недоступна или пуста — показываем демо-данные
    console.warn('Таблица недоступна (CORS или не опубликована). Показаны демо-данные.');
    usingDemoData = true;
    const demoSlots = getDemoSlots();
    allSlotsData = demoSlots;
    window.allSlots = demoSlots;
    updateDashboardUI(demoSlots);
    showDemoDataNotice();
    return demoSlots;
  } catch (error) {
    console.error('Ошибка загрузки дашборда:', error);
    usingDemoData = true;
    const demoSlots = getDemoSlots();
    allSlotsData = demoSlots;
    window.allSlots = demoSlots;
    updateDashboardUI(demoSlots);
    showDemoDataNotice();
    return demoSlots;
  }
}

function showDemoDataNotice() {
  let notice = document.getElementById('demo-data-notice');
  if (notice) return;
  notice = document.createElement('div');
  notice.id = 'demo-data-notice';
  notice.className = 'demo-data-notice';
  notice.innerHTML = 'Данные из Google Таблицы недоступны. Показаны примеры. <button type="button" class="demo-notice-link">Как подключить?</button>';
  const slotsSection = document.querySelector('.slots-section');
  if (slotsSection) slotsSection.insertBefore(notice, slotsSection.firstChild);
  notice.querySelector('.demo-notice-link').addEventListener('click', () => {
    alert(
      '1. Откройте Google Таблицу и убедитесь, что листы называются ADMIN и PUBLIC.\n' +
      '2. Файл → Доступ в интернете → Включить. Либо настройте общий доступ по ссылке.\n' +
      '3. В таблице: слот 1 — строка 5, слот 2 — строка 101, слот 3 — строка 201. Столбцы: B=участник, C=дней, D=дата, E=капитал, F=прибыль, G=%.\n' +
      '4. Открывайте сайт через http (локальный сервер или хостинг), не как file:// — иначе браузер блокирует запросы к таблице (CORS).'
    );
  });
}

function hideDemoDataNotice() {
  const notice = document.getElementById('demo-data-notice');
  if (notice) notice.remove();
}

/**
 * Парсинг листа ADMIN по актуальной структуре:
 * слот 1: строки 5–99 (сводка в 5, дни 6–99)
 * слот 2: строки 101–199 (сводка в 101, дни 102–199)
 * слот 3: строки 201–299 и т.д.
 * 0-based: слот 1 = индекс 4, слот 2 = 100, слот 3 = 200…
 */
function processSlotsFromAdminOnly(adminRows) {
  const slots = [];
  for (let slotNumber = 1; slotNumber <= 10; slotNumber++) {
    const rowIndex = slotNumber === 1 ? 4 : (slotNumber - 1) * 100; // строка 5 → 4, 101 → 100, 201 → 200
    if (rowIndex >= adminRows.length) continue;
    const row = adminRows[rowIndex];
    if (!row || row.length < 2) continue;
    const participant = (row[1] != null && row[1] !== '') ? String(row[1]).trim() : '';
    if (!participant || participant === 'Свободно' || participant.toLowerCase() === 'свободен') continue;
    const slotData = {
      number: slotNumber,
      participant: participant,
      startDate: row[3] != null ? String(row[3]) : '-',
      daysWorked: row[2] != null ? String(row[2]) : '0',
      entry: parseFloat(row[4]) || 0,
      current: parseFloat(row[4]) || 0,
      earned: parseFloat(row[5]) || 0,
      avgPercent: parseFloat(row[6]) || 0,
      tgLogin: '',
      fixation: 0,
      status: 'В работе',
      days: extractDaysData(adminRows, rowIndex),
      daysCount: 0
    };
    slotData.daysCount = slotData.days.length;
    slots.push(slotData);
  }
  return slots;
}

async function fetchSheetData(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('HTTP ' + response.status);
  const text = await response.text();
  // Ответ Google: /*O_o*/ google.visualization.Query.setResponse({ ... });
  const start = text.indexOf('setResponse(');
  if (start === -1) throw new Error('Неверный формат ответа таблицы');
  const jsonStart = start + 'setResponse('.length;
  const jsonEnd = text.lastIndexOf(');');
  const jsonStr = text.slice(jsonStart, jsonEnd).trim();
  const json = JSON.parse(jsonStr);
  if (!json.table || !json.table.rows) throw new Error('Нет данных в таблице');
  return json.table.rows;
}

function parseSheetRows(rows) {
  return rows.map(row => row.c ? row.c.map(cell => cell?.v ?? null) : []);
}

/** ADMIN: B=участник, C=дней, D=дата, E=капитал, F=прибыль, G=%. PUBLIC: B=TG, D=нач.капитал, F=фиксация. Строки: слот 1=5, слот 2=101, слот 3=201… */
function processSlots(adminRows, publicRows) {
  const slots = [];
  for (let slotNumber = 1; slotNumber <= 10; slotNumber++) {
    const summaryIndex = slotNumber === 1 ? 4 : (slotNumber - 1) * 100;
    if (summaryIndex >= adminRows.length) continue;
    const adminRow = adminRows[summaryIndex];
    const publicRow = publicRows[summaryIndex];
    if (!adminRow || adminRow.length < 2) continue;
    const participant = (adminRow[1] != null && adminRow[1] !== '') ? String(adminRow[1]).trim() : '';
    if (!participant || participant === 'Свободно' || participant.toLowerCase() === 'свободен') continue;
    const slotData = {
      number: slotNumber,
      participant: participant,
      startDate: adminRow[3] != null ? String(adminRow[3]) : '-',
      daysWorked: adminRow[2] != null ? String(adminRow[2]) : '0',
      entry: publicRow && publicRow[3] != null ? parseFloat(publicRow[3]) || 0 : parseFloat(adminRow[4]) || 0,
      current: parseFloat(adminRow[4]) || 0,
      earned: parseFloat(adminRow[5]) || 0,
      avgPercent: parseFloat(adminRow[6]) || 0,
      tgLogin: publicRow && publicRow[1] != null ? String(publicRow[1]).trim() : '',
      fixation: publicRow && publicRow[5] != null ? parseFloat(publicRow[5]) || 0 : 0,
      status: 'В работе',
      days: extractDaysData(adminRows, summaryIndex),
      daysCount: 0
    };
    slotData.daysCount = slotData.days.length;
    slots.push(slotData);
  }
  return slots;
}

/** Дни: ADMIN D–H, только заполненные строки (слот 1: 6–99, слот 2: 102–199…) */
function extractDaysData(adminRows, summaryRowIndex) {
  const days = [];
  const start = summaryRowIndex + 1;
  const end = Math.min(summaryRowIndex + 94, adminRows.length - 1);

  for (let i = start; i <= end; i++) {
    const row = adminRows[i];
    if (!row || row.length < 8) continue;
    const date = row[3];
    if (date == null || date === '' || String(date).trim() === '-') continue;
    const capital = row[4];
    const earned = row[5];
    const percent = row[6];
    const operations = row[7];
    const hasData = (capital != null && String(capital).trim() !== '') ||
      (earned != null && String(earned).trim() !== '') ||
      (percent != null && String(percent).trim() !== '') ||
      (operations != null && String(operations).trim() !== '');
    if (!hasData) continue;
    if (String(capital).includes('REF') || String(percent).includes('DIV')) continue;
    days.push({
      date: formatSheetDate(date),
      capital: parseFloat(capital) || 0,
      earned: parseFloat(earned) || 0,
      percent: parseFloat(percent) || 0,
      operations: parseFloat(operations) || 0
    });
  }
  return days;
}

function updateDashboardUI(slots) {
  updateStatistics(slots);
  updateSlotCards(slots);
}

function updateStatistics(slots) {
  const totalCapital = slots.reduce((sum, s) => sum + s.current, 0);
  const totalEarned = slots.reduce((sum, s) => sum + s.earned, 0);
  const avgPercent = slots.length > 0 ? slots.reduce((sum, s) => sum + s.avgPercent, 0) / slots.length : 0;
  const activeSlots = slots.length;

  setStatElement('total-capital', formatMoney(totalCapital));
  setStatElement('total-earned', formatMoney(totalEarned, true));
  setStatElement('avg-percent', avgPercent.toFixed(2) + '%');
  setStatElement('active-slots', `${activeSlots}/10`);
}

function setStatElement(key, value) {
  const el = document.querySelector(`[data-stat="${key}"]`);
  if (el) el.textContent = value;
}

function updateSlotCards(slots) {
  const container = document.querySelector('[data-slots-container]');
  if (!container) return;

  container.innerHTML = '';
  const slotsByNumber = {};
  slots.forEach(s => { slotsByNumber[s.number] = s; });

  for (let n = 1; n <= 10; n++) {
    const card = slotsByNumber[n] ? createSlotCard(slotsByNumber[n]) : createEmptySlotCard(n);
    container.appendChild(card);
  }
}

function createSlotCard(slot) {
  const card = document.createElement('article');
  card.className = 'slot-card slot-active';
  card.innerHTML = `
    <div class="slot-header">
      <span class="slot-number">Слот ${slot.number}</span>
      <span class="slot-status active">
        <span class="status-dot"></span> ${slot.status || 'В работе'}
      </span>
    </div>
    <div class="slot-fields">
      <div class="slot-field">
        <span class="slot-field-label">Участник</span>
        <span class="slot-field-value">${escapeHtml(slot.participant)}</span>
      </div>
      <div class="slot-field">
        <span class="slot-field-label">Начальный капитал</span>
        <span class="slot-field-value">${formatMoney(slot.entry)}</span>
      </div>
      <div class="slot-field">
        <span class="slot-field-label">Дата старта</span>
        <span class="slot-field-value">${formatSheetDate(slot.startDate)}</span>
      </div>
      <div class="slot-field">
        <span class="slot-field-label">Дней в работе</span>
        <span class="slot-field-value">${slot.daysWorked}</span>
      </div>
      <div class="slot-field">
        <span class="slot-field-label">Прибыль</span>
        <span class="slot-field-value accent">${formatMoney(slot.earned, true)}</span>
      </div>
    </div>
    <button type="button" class="btn btn-ghost btn-slot-detail" data-slot-number="${slot.number}">Подробнее</button>
  `;
  const btn = card.querySelector('.btn-slot-detail');
  if (btn) btn.addEventListener('click', () => showSlotDetails(slot.number));
  return card;
}

function escapeHtml(str) {
  if (str == null) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function createEmptySlotCard(number) {
  const card = document.createElement('article');
  card.className = 'slot-card slot-empty';
  card.innerHTML = `
    <div class="slot-header">
      <span class="slot-number">Слот ${number}</span>
      <span class="slot-status">Свободен</span>
    </div>
    <p class="slot-empty-text">Свободен</p>
    <button type="button" class="btn btn-ghost btn-slot-detail btn-slot-detail-empty" data-slot-number="${number}">Подробнее</button>
  `;
  const btn = card.querySelector('.btn-slot-detail');
  if (btn) btn.addEventListener('click', () => showSlotDetailsEmpty(number));
  return card;
}

function showSlotDetailsEmpty(slotNumber) {
  const existingModal = document.querySelector('.modal-slot-details');
  if (existingModal) existingModal.remove();

  const modal = document.createElement('div');
  modal.className = 'modal-slot-details';
  modal.innerHTML = `
    <div class="modal-slot-backdrop"></div>
    <div class="modal-slot-content">
      <div class="modal-slot-header">
        <h2>Слот ${slotNumber}</h2>
        <button type="button" class="modal-slot-close" aria-label="Закрыть">✕</button>
      </div>
      <p class="slot-empty-modal-text">Слот свободен. Данных пока нет.</p>
    </div>
  `;
  modal.querySelector('.modal-slot-backdrop').addEventListener('click', closeSlotDetails);
  modal.querySelector('.modal-slot-close').addEventListener('click', closeSlotDetails);
  document.body.appendChild(modal);
}

function showSlotDetails(slotNumber) {
  const slot = allSlotsData.find(s => s.number === slotNumber);
  if (!slot) {
    showSlotDetailsEmpty(slotNumber);
    return;
  }

  const existingModal = document.querySelector('.modal-slot-details');
  if (existingModal) existingModal.remove();

  const startDateFormatted = typeof slot.startDate === 'string' && slot.startDate !== '-' ? slot.startDate : formatSheetDate(slot.startDate);

  const modal = document.createElement('div');
  modal.className = 'modal-slot-details';
  modal.innerHTML = `
    <div class="modal-slot-backdrop"></div>
    <div class="modal-slot-content">
      <div class="modal-slot-header">
        <h2>Слот ${slot.number}</h2>
        <button type="button" class="modal-slot-close" aria-label="Закрыть">✕</button>
      </div>
      <div class="modal-slot-info">
        <div class="modal-slot-row">
          <span class="modal-slot-label">Участник</span>
          <span class="modal-slot-value">${escapeHtml(slot.participant)}</span>
        </div>
        <div class="modal-slot-row">
          <span class="modal-slot-label">Логин TG</span>
          <span class="modal-slot-value">${escapeHtml(slot.tgLogin) || '—'}</span>
        </div>
        <div class="modal-slot-row">
          <span class="modal-slot-label">Дата старта</span>
          <span class="modal-slot-value">${startDateFormatted}</span>
        </div>
        <div class="modal-slot-row">
          <span class="modal-slot-label">Начальный капитал</span>
          <span class="modal-slot-value">${formatMoney(slot.entry)}</span>
        </div>
        <div class="modal-slot-row">
          <span class="modal-slot-label">Текущий капитал</span>
          <span class="modal-slot-value">${formatMoney(slot.current)}</span>
        </div>
        <div class="modal-slot-row">
          <span class="modal-slot-label">Средний процент в день</span>
          <span class="modal-slot-value">${slot.avgPercent != null ? slot.avgPercent + '%' : '—'}</span>
        </div>
        <div class="modal-slot-row">
          <span class="modal-slot-label">Фиксация прибыли</span>
          <span class="modal-slot-value">${slot.fixation != null ? formatMoney(slot.fixation, true) : '—'}</span>
        </div>
      </div>
      <button type="button" class="btn btn-ghost btn-daily-report" data-slot-number="${slot.number}">Смотреть ежедневный отчёт</button>
      <div class="modal-slot-days-wrap" hidden>
        <h4 class="modal-days-title">Ежедневный отчёт</h4>
        <div class="modal-days-scroll">
          <table class="days-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Капитал</th>
                <th>Заработано</th>
                <th>%</th>
                <th>Операции</th>
              </tr>
            </thead>
            <tbody>
              ${(slot.days || []).map(day => `
                <tr>
                  <td>${day.date}</td>
                  <td>${formatMoney(day.capital)}</td>
                  <td>${formatMoney(day.earned, true)}</td>
                  <td>${day.percent}%</td>
                  <td>${day.operations != null ? formatMoney(day.operations, true) : '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  const backdrop = modal.querySelector('.modal-slot-backdrop');
  const closeBtn = modal.querySelector('.modal-slot-close');
  const content = modal.querySelector('.modal-slot-content');
  const daysWrap = modal.querySelector('.modal-slot-days-wrap');
  const btnDaily = modal.querySelector('.btn-daily-report');

  function close() {
    closeSlotDetails();
  }

  btnDaily.addEventListener('click', () => {
    daysWrap.hidden = false;
    modal.classList.add('expanded');
  });

  backdrop.addEventListener('click', close);
  closeBtn.addEventListener('click', close);
  document.body.appendChild(modal);
}

function closeSlotDetails() {
  const modal = document.querySelector('.modal-slot-details');
  if (modal) modal.remove();
}

function renderSlotsFallback() {
  const container = document.querySelector('[data-slots-container]');
  if (!container) return;
  container.innerHTML = '';
  for (let n = 1; n <= 10; n++) {
    container.appendChild(createEmptySlotCard(n));
  }
}

function formatMoney(amount, showSign = false) {
  const formatted = new Intl.NumberFormat('ru-RU').format(Math.abs(amount));
  let sign = '';
  if (showSign) {
    if (amount > 0) sign = '+';
    else if (amount < 0) sign = '-';
  }
  return `${sign}${formatted} ₽`;
}

function formatSheetDate(dateValue) {
  if (dateValue == null || dateValue === '' || dateValue === '-') return '-';
  if (typeof dateValue === 'string' && /^\d+(\.\d+)?$/.test(dateValue)) {
    dateValue = parseFloat(dateValue);
  }
  if (typeof dateValue === 'number') {
    const date = new Date((dateValue - 25569) * 86400 * 1000);
    return date.toLocaleDateString('ru-RU');
  }
  if (typeof dateValue === 'string') return dateValue;
  return '-';
}

// ========================================
// ВЫХОД
// ========================================

logoutBtn.addEventListener('click', () => {
  showLanding();
});

// ========================================
// ВОССТАНОВЛЕНИЕ СЕССИИ
// ========================================

function checkSession() {
  const savedUser = localStorage.getItem('bk_vilki_user');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      if (user.name) {
        showDashboard(user.name);
        return;
      }
    } catch (e) {
      localStorage.removeItem('bk_vilki_user');
    }
  }
}

// ========================================
// ИНТЕРАКТИВНЫЕ КРУГИ
// ========================================

function initCircles() {
  const container = document.getElementById('circles-container');
  if (!container) return;

  const circles = container.querySelectorAll('.circle-wrapper');

  circles.forEach((circle) => {
    const circleNum = circle.getAttribute('data-circle');
    if (!circleNum) return;

    circle.addEventListener('mouseenter', () => {
      container.dataset.hover = circleNum;
    });

    circle.addEventListener('click', (e) => {
      e.preventDefault();
      if (container.dataset.hover === circleNum) {
        delete container.dataset.hover;
      } else {
        container.dataset.hover = circleNum;
      }
    });
  });

  container.addEventListener('mouseleave', () => {
    if (!window.matchMedia('(max-width: 768px)').matches) {
      delete container.dataset.hover;
    }
  });

  document.addEventListener('click', (e) => {
    if (container.dataset.hover && !container.contains(e.target)) {
      delete container.dataset.hover;
    }
  });

  // Мобильная подсказка при загрузке/обновлении: через 3 с первый круг раскрывается на 2 с
  setTimeout(function mobileHint() {
    if (!window.matchMedia('(max-width: 768px)').matches) return;
    const landingEl = document.getElementById('landing');
    const containerEl = document.getElementById('circles-container');
    if (!landingEl || !landingEl.classList.contains('active') || !containerEl) return;
    containerEl.offsetHeight; // форсируем reflow для корректного применения стилей
    containerEl.dataset.hover = '1';
    setTimeout(function() {
      delete containerEl.dataset.hover;
    }, 2000);
  }, 3000);
}

// ========================================
// ЛЕНДИНГ — ДАННЫЕ КРУГОВ ИЗ ТАБЛИЦЫ
// Круг 1: ADMIN M2. Круг 2: ADMIN M3. Круг 3: ADMIN M4.
// Плашка 1: PUBLIC A3. Плашка 3: Лучший день = ADMIN K3, Худший день = ADMIN K2 (только из таблицы, без расчёта).
// Строки: у вас строка 2 листа = index 0, строка 3 = 1, строка 4 = 2. K2=строка 2, K3=строка 3, M4=строка 4.
// Столбцы: K=10, M=12.
// ========================================

function getLandingCell(rows, rowIndex, colIndex) {
  if (!rows || rowIndex >= rows.length) return null;
  const row = rows[rowIndex];
  return row && colIndex < row.length ? row[colIndex] : null;
}

function formatPercent(value, fromSheet = false) {
  if (value == null || value === '') return '—';
  const str = String(value).trim().replace(',', '.');
  let num = parseFloat(str);
  if (Number.isNaN(num)) return '—';
  if (fromSheet) num = num * 100;
  return num.toFixed(2) + '%';
}

const LANDING_CACHE_KEY = 'bk_vilki_landing_v2';
const LANDING_CACHE_TTL_MS = 60 * 1000;

function getLandingCache() {
  try {
    const raw = sessionStorage.getItem(LANDING_CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data.ts || Date.now() - data.ts > LANDING_CACHE_TTL_MS) return null;
    return data;
  } catch (e) {
    return null;
  }
}

function setLandingCache(payload) {
  try {
    payload.ts = Date.now();
    sessionStorage.setItem(LANDING_CACHE_KEY, JSON.stringify(payload));
  } catch (e) {}
}

function applyLandingCache(data) {
  if (!data) return;
  const keys = ['total-capital', 'total-earned', 'avg-percent', 'active-slots', 'best-day', 'worst-day'];
  keys.forEach(key => {
    if (data[key] != null) setLandingValue(key, data[key]);
  });
}

async function loadLandingCircleData() {
  try {
    const [adminData, publicData] = await Promise.all([
      fetchSheetData(SHEETS.admin),
      fetchSheetData(SHEETS.public)
    ]);
    const adminRows = parseSheetRows(adminData);
    const publicRows = parseSheetRows(publicData);

    // Лист ADMIN: строка 2 = index 0, строка 3 = 1, строка 4 = 2. Лучший день = K3, Худший день = K2.
    const totalCapitalRaw = getLandingCell(adminRows, 0, 12);   // M2 — строка 2
    const totalEarnedRaw = getLandingCell(adminRows, 1, 12);   // M3 — строка 3
    const avgPercentRaw = getLandingCell(adminRows, 2, 12);   // M4 — строка 4 (средняя доходность)
    const worstDayRaw = getLandingCell(adminRows, 0, 10);     // K2 — строка 2 (МИН % общий = худший день)
    const bestDayRaw = getLandingCell(adminRows, 1, 10);       // K3 — строка 3 (МАКС % общий = лучший день)
    // PUBLIC A3 = число активных слотов (подпись "Всего слотов:" в A2, число в A3 — берём из строки после подписи)
    let activeSlotsRaw = null;
    if (publicRows && publicRows.length > 0) {
      const colA = 0;
      for (let i = 0; i < publicRows.length - 1; i++) {
        const label = String(getLandingCell(publicRows, i, colA) ?? '').trim();
        if (label.indexOf('слотов') !== -1 || label.indexOf('Всего') !== -1) {
          const nextVal = getLandingCell(publicRows, i + 1, colA);
          if (nextVal != null && String(nextVal).trim() !== '') {
            const n = parseInt(String(nextVal).replace(/\s/g, ''), 10);
            if (!Number.isNaN(n) && n >= 0) {
              activeSlotsRaw = nextVal;
              break;
            }
          }
        }
      }
      if (activeSlotsRaw == null) {
        for (const rowIndex of [2, 1, 0]) {
          const v = getLandingCell(publicRows, rowIndex, 0);
          if (v != null && String(v).trim() !== '') {
            const n = parseInt(String(v).replace(/\s/g, ''), 10);
            if (!Number.isNaN(n) && n >= 0) {
              activeSlotsRaw = v;
              break;
            }
          }
        }
      }
    }

    const totalCapital = totalCapitalRaw != null && totalCapitalRaw !== '' ? parseFloat(String(totalCapitalRaw).replace(',', '.')) : null;
    const totalEarned = totalEarnedRaw != null && totalEarnedRaw !== '' ? parseFloat(String(totalEarnedRaw).replace(',', '.')) : null;
    const avgPercent = formatPercent(avgPercentRaw, true);
    const worstDay = formatPercent(worstDayRaw, true);
    const bestDay = formatPercent(bestDayRaw, true);
    const activeSlots = activeSlotsRaw != null && String(activeSlotsRaw).trim() !== '' ? String(Number(activeSlotsRaw) || activeSlotsRaw).trim() : '—';

    const capStr = totalCapital != null ? formatMoney(totalCapital) : null;
    const earnedStr = totalEarned != null ? formatMoney(totalEarned, true) : null;
    setLandingValue('total-capital', capStr);
    setLandingValue('total-earned', earnedStr);
    setLandingValue('avg-percent', avgPercent !== '—' ? avgPercent : null);
    setLandingValue('active-slots', activeSlots);
    setLandingValue('best-day', bestDay !== '—' ? bestDay : null);
    setLandingValue('worst-day', worstDay !== '—' ? worstDay : null);

    setLandingCache({
      'total-capital': capStr,
      'total-earned': earnedStr,
      'avg-percent': avgPercent !== '—' ? avgPercent : null,
      'active-slots': activeSlots,
      'best-day': bestDay !== '—' ? bestDay : null,
      'worst-day': worstDay !== '—' ? worstDay : null
    });
  } catch (e) {
    console.warn('Данные для кругов лендинга не загружены:', e.message);
  }
}

function setLandingValue(key, value) {
  const el = document.querySelector(`[data-landing="${key}"]`);
  if (!el) return;
  el.textContent = (value != null && value !== '') ? value : '—';
}

// ========================================
// ИНИЦИАЛИЗАЦИЯ
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  createDots();
  startHeroTitleShimmer();
  initCircles();
  applyLandingCache(getLandingCache());
  loadLandingCircleData();
  checkSession();
  const savedUser = localStorage.getItem('bk_vilki_user');
  if (savedUser && dashboard.classList.contains('active')) {
    loadAllData();
    window.dashboardRefreshInterval = setInterval(loadAllData, 30000);
  } else {
    window.landingRefreshInterval = setInterval(loadLandingCircleData, 60000);
  }
});

window.showSlotDetails = showSlotDetails;
window.closeSlotDetails = closeSlotDetails;
window.GoogleSheetsDashboard = { loadData: loadAllData, getData: () => allSlotsData };
