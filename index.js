var https = require('https');

var TOKEN = process.env.BOT_TOKEN;
var ADMIN_ID = process.env.ADMIN_ID;
var offset = 0;
var awaitingRequest = {};

/* ── API ─────────────────────────────────────────── */
function apiCall(method, params, cb) {
  var data = JSON.stringify(params);
  var options = {
    hostname: 'api.telegram.org',
    path: '/bot' + TOKEN + '/' + method,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };
  var req = https.request(options, function(res) {
    var body = '';
    res.on('data', function(chunk) { body += chunk; });
    res.on('end', function() {
      if (cb) cb(JSON.parse(body));
    });
  });
  req.on('error', function(e) { console.log('ошибка: ' + e.message); });
  req.write(data);
  req.end();
}

function sendMsg(chatId, text, markup) {
  var params = { chat_id: chatId, text: text, parse_mode: 'HTML' };
  if (markup) params.reply_markup = markup;
  apiCall('sendMessage', params, null);
}

function answerCb(id) {
  apiCall('answerCallbackQuery', { callback_query_id: id }, null);
}

/* ── КЛАВИАТУРЫ ──────────────────────────────────── */
var mainMenu = {
  inline_keyboard: [
    [{ text: '💼 Услуги и цены',   callback_data: 'services'  }],
    [{ text: '📁 Портфолио',       callback_data: 'portfolio' }],
    [{ text: '📩 Оставить заявку', callback_data: 'request'   }],
    [{ text: '❓ Частые вопросы',  callback_data: 'faq'       }]
  ]
};

var backBtn = {
  inline_keyboard: [[{ text: '← Главное меню', callback_data: 'back' }]]
};

var afterRequest = {
  inline_keyboard: [
    [{ text: '💼 Посмотреть цены', callback_data: 'services'  }],
    [{ text: '← Главное меню',    callback_data: 'back'       }]
  ]
};

/* ── ТЕКСТЫ ──────────────────────────────────────── */
var T_WELCOME =
  '👋 Привет! Я бот Славы — 16-летнего вайб-кодера.\n\n' +
  'Делаю сайты, лендинги и Telegram-боты быстро и недорого с помощью ИИ.\n\n' +
  '👇 Выбери что тебя интересует:';

var T_SERVICES =
  '💼 <b>Услуги и цены</b>\n\n' +
  '🖥 Лендинг / визитка — <b>1 500–4 000 ₽</b>  |  1–2 ч\n' +
  '🤖 Telegram-бот — <b>2 000–6 000 ₽</b>  |  2–4 ч\n' +
  '🏢 Сайт для бизнеса — <b>3 000–8 000 ₽</b>  |  3–6 ч\n' +
  '🎨 Редизайн — <b>1 000–3 000 ₽</b>  |  30–60 мин\n' +
  '🔧 Поддержка / мес — <b>3 000–8 000 ₽</b>  |  2–4 ч/мес\n' +
  '📱 Мини-приложение — <b>5 000–15 000 ₽</b>  |  1–3 дня\n\n' +
  '📩 Хочешь заказать — нажми «Оставить заявку»';

var T_PORTFOLIO =
  '📁 <b>Портфолио</b>\n\n' +
  '🌐 Личный сайт вайб-кодера\n' +
  'slavik4252.github.io/TivykoVibe\n\n' +
  '☕ BREW — лендинг кофейни\n' +
  'slavik4252.github.io/brew-coffee\n\n' +
  '📱 mobi. — магазин телефонов\n' +
  'slavik4252.github.io/phone-store\n\n' +
  '⚡ Всё сделано через вайб-кодинг за считанные часы';

var T_FAQ =
  '❓ <b>Частые вопросы</b>\n\n' +
  '<b>Тебе реально 16 лет?</b>\n' +
  'Да. Делаю сайты с ИИ-инструментами — это вайб-кодинг 🤖\n\n' +
  '<b>Как быстро готово?</b>\n' +
  'Лендинг — 1–2 часа. Сложный проект — до 3 дней\n\n' +
  '<b>Как оплатить?</b>\n' +
  'Через Kwork.ru или переводом\n\n' +
  '<b>Правки входят?</b>\n' +
  'До 2 правок бесплатно ✅\n\n' +
  '<b>Где смотреть работы?</b>\n' +
  'Нажми «Портфолио» в меню';

var T_REQUEST_ASK =
  '📩 Опиши свой проект:\n\n' +
  '— Что нужно сделать?\n' +
  '— Есть примеры / референсы?\n' +
  '— Бюджет и сроки?\n\n' +
  'Пиши прямо сюда 👇';

/* ── ОБРАБОТЧИКИ ─────────────────────────────────── */
function handleUpdate(update) {
  if (update.callback_query) {
    handleCallback(update.callback_query);
    return;
  }
  if (update.message) {
    handleMessage(update.message);
  }
}

function handleMessage(msg) {
  var chatId = msg.chat.id;
  var text   = msg.text || '';
  var from   = msg.from || {};
  var name   = (from.first_name || '') + (from.last_name ? ' ' + from.last_name : '');
  var uname  = from.username ? '@' + from.username : 'нет username';

  if (text === '/start') {
    awaitingRequest[chatId] = false;
    sendMsg(chatId, T_WELCOME, mainMenu);
    return;
  }

  if (text === '/menu') {
    awaitingRequest[chatId] = false;
    sendMsg(chatId, '👇 Главное меню', mainMenu);
    return;
  }

  if (awaitingRequest[chatId]) {
    awaitingRequest[chatId] = false;
    sendMsg(chatId,
      '✅ Заявка отправлена!\n\nСлава свяжется с тобой в ближайшее время ⚡\n\nИли напиши напрямую: @plsfea',
      afterRequest
    );
    if (ADMIN_ID) {
      var note =
        '🔔 <b>Новая заявка!</b>\n\n' +
        '👤 Имя: ' + name + '\n' +
        '📎 Username: ' + uname + '\n' +
        '🆔 Chat ID: ' + chatId + '\n\n' +
        '💬 <b>Текст заявки:</b>\n' + text;
      sendMsg(ADMIN_ID, note, null);
    }
    return;
  }

  sendMsg(chatId,
    'Используй кнопки меню 👇\nИли напиши напрямую: @plsfea',
    mainMenu
  );
}

function handleCallback(cb) {
  var chatId = cb.message.chat.id;
  var data   = cb.data;
  answerCb(cb.id);

  if (data === 'services') {
    sendMsg(chatId, T_SERVICES, backBtn);

  } else if (data === 'portfolio') {
    sendMsg(chatId, T_PORTFOLIO, backBtn);

  } else if (data === 'request') {
    awaitingRequest[chatId] = true;
    sendMsg(chatId, T_REQUEST_ASK, null);

  } else if (data === 'faq') {
    sendMsg(chatId, T_FAQ, backBtn);

  } else if (data === 'back') {
    awaitingRequest[chatId] = false;
    sendMsg(chatId, '👇 Главное меню', mainMenu);
  }
}

/* ── POLLING ─────────────────────────────────────── */
function loop() {
  apiCall('getUpdates', { offset: offset, timeout: 25 }, function(data) {
    if (data && data.result && data.result.length) {
      data.result.forEach(function(update) {
        offset = update.update_id + 1;
        handleUpdate(update);
      });
    }
    setTimeout(loop, 400);
  });
}

console.log('вайб. бот запущен ✅');
loop();