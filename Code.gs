/**
 * БК Вилки с Аманом — Google Apps Script
 * Скрипт для сохранения данных регистрации в Google Sheets
 * 
 * ИНСТРУКЦИЯ:
 * 1. Создайте новую Google Таблицу
 * 2. Меню: Расширения → Apps Script
 * 3. Удалите содержимое Code.gs и вставьте этот код
 * 4. Сохраните (Ctrl+S)
 * 5. Развернуть → Новое развёртывание → Веб-приложение
 * 6. Выполнять от имени: Я, Доступ: Все
 * 7. Скопируйте URL и вставьте в script.js
 */

// Название листа в таблице
const SHEET_NAME = 'Регистрации';

/**
 * Обработка POST-запросов
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    saveToSheet(data);
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Ошибка:', error);
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Обработка GET-запросов (для тестирования)
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ 
      status: 'ok', 
      message: 'БК Вилки с Аманом API работает' 
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Сохранение данных в таблицу
 */
function saveToSheet(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  // Создаём лист, если не существует
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Добавляем заголовки
    sheet.getRange(1, 1, 1, 5).setValues([[
      'Дата/Время',
      'Имя',
      'Email',
      'Телефон',
      'Telegram'
    ]]);
    
    // Форматируем заголовки
    sheet.getRange(1, 1, 1, 5)
      .setBackground('#1a1a24')
      .setFontColor('#00d4aa')
      .setFontWeight('bold');
    
    // Замораживаем первую строку
    sheet.setFrozenRows(1);
  }
  
  // Добавляем новую строку с данными
  const timestamp = data.timestamp 
    ? new Date(data.timestamp).toLocaleString('ru-RU')
    : new Date().toLocaleString('ru-RU');
  
  sheet.appendRow([
    timestamp,
    data.name || '',
    data.email || '',
    data.phone || '',
    data.telegram || ''
  ]);
  
  // Автоматическая ширина колонок
  sheet.autoResizeColumns(1, 5);
}

/**
 * Функция для тестирования (можно запустить вручную)
 */
function testSave() {
  const testData = {
    name: 'Тест Пользователь',
    email: 'test@example.com',
    phone: '+7 (999) 123-45-67',
    telegram: '@testuser',
    timestamp: new Date().toISOString()
  };
  
  saveToSheet(testData);
  console.log('Тестовые данные сохранены!');
}
