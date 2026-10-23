const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');

// ================= КОНФИГУРАЦИЯ =================
const BOT_TOKEN = process.env.BOT_TOKEN || '8543097535:AAFdRosDiO8NeJzmvHyGJxbt4As7c1iB7eY';
const ADMIN_ID = 1753180090;
const KWORK_URL = 'https://kwork.ru/user/tivyko';
const SERVICES_FILE = path.join(__dirname, 'services.json');

const bot = new Telegraf(BOT_TOKEN);

// ================= РАБОТА С ФАЙЛОМ SERVICES.JSON =================
function getServices() {
  if (!fs.existsSync(SERVICES_FILE)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(SERVICES_FILE, 'utf-8'));
}

function saveServices(data) {
  fs.writeFileSync(SERVICES_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Хранилище сессий пользователей (для пошаговой заявки и админки)
const sessions = new Map();

function getSession(userId) {
  if (!sessions.has(userId)) {
    sessions.set(userId, {});
  }
  return sessions.get(userId);
}

function resetSession(userId) {
  sessions.delete(userId);
}

// ================= КЛАВИАТУРЫ =================
function getMainMenu(userId) {
  const buttons = [
    [Markup.button.callback('💎 Услуги и цены', 'services')],
    [Markup.button.callback('📝 Оставить заявку', 'start_order')],
    [Markup.button.callback('❓ Частые вопросы (FAQ)', 'faq')],
    [Markup.button.url('🟢 Мой профиль на Kwork', KWORK_URL)]
  ];

  if (userId === ADMIN_ID) {
    buttons.push([Markup.button.callback('⚙️ Админ-панель', 'admin_panel')]);
  }

  return Markup.inlineKeyboard(buttons);
}

function getServicesKeyboard() {
  const services = getServices();
  const buttons = services.map((s, idx) => [
    Markup.button.callback(`${s.name} — ${s.price}`, `service_${idx}`)
  ]);

  buttons.push([Markup.button.callback('📝 Оформить заказ', 'start_order')]);
  buttons.push([Markup.button.callback('⬅️ В главное меню', 'back_to_main')]);
  return Markup.inlineKeyboard(buttons);
}

function getAdminKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('➕ Добавить услугу', 'admin_add')],
    [Markup.button.callback('🗑 Удалить услугу', 'admin_delete_list')],
    [Markup.button.callback('⬅️ В главное меню', 'back_to_main')]
  ]);
}

// ================= КОМАНДА /START =================
bot.start(async (ctx) => {
  resetSession(ctx.from.id);
  const text = 
    `🚀 <b>Добро пожаловать в VibeBot Studio!</b>\n\n` +
    `💻 <b>Продаю услуги по веб-разработке и созданию Telegram-ботов под ключ.</b>\n\n` +
    `✨ <b>Что я создаю:</b>\n` +
    `🔹 Современные адаптивные <b>лендинги и сайты-визитки</b>\n` +
    `🔹 Умные <b>Telegram-боты и Mini Apps</b>\n` +
    `🔹 <b>Редизайн</b>, ускорение и <b>техподдержку</b> ваших проектов\n\n` +
    `🔥 <i>Адекватные цены, чистый код и быстрые сроки сдачи!</i>\n\n` +
    `Выберите интересующий раздел в меню ниже 👇`;

  await ctx.replyWithHTML(text, getMainMenu(ctx.from.id));
});

// Возврат в меню
bot.action('back_to_main', async (ctx) => {
  await ctx.answerCbQuery();
  resetSession(ctx.from.id);
  const text = 
    `🚀 <b>Главное меню VibeBot Studio</b>\n\n` +
    `💻 <b>Продаю услуги по веб-разработке, боты телеграмм.</b>\n` +
    `Выберите нужный раздел:`;
  await ctx.editMessageText(text, { parse_mode: 'HTML', ...getMainMenu(ctx.from.id) });
});

// ================= РАЗДЕЛ УСЛУГ =================
bot.action('services', async (ctx) => {
  await ctx.answerCbQuery();
  const services = getServices();
  let text = `💎 <b>Актуальный прайс-лист:</b>\n\n`;

  services.forEach((s) => {
    text += `▪️ <b>${s.name}</b> — <code>${s.price}</code>\n   <i>${s.desc}</i>\n\n`;
  });
  text += `Нажмите на интересующую услугу для деталей или оформите заявку:`;

  await ctx.editMessageText(text, { parse_mode: 'HTML', ...getServicesKeyboard() });
});

bot.action(/^service_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const idx = parseInt(ctx.match[1], 10);
  const services = getServices();
  const service = services[idx];

  if (!service) {
    return ctx.reply('Услуга не найдена.');
  }

  const text = 
    `📌 <b>${service.name}</b>\n` +
    `💰 Стоимость: <b>${service.price}</b>\n\n` +
    `📖 <b>Описание:</b>\n${service.desc}\n\n` +
    `Готовы реализовать проект?`;

  const kb = Markup.inlineKeyboard([
    [Markup.button.callback('📝 Заказать эту услугу', `pick_srv_${idx}`)],
    [Markup.button.url('🟢 Заказ через Kwork', KWORK_URL)],
    [Markup.button.callback('⬅️ К списку услуг', 'services')]
  ]);

  await ctx.editMessageText(text, { parse_mode: 'HTML', ...kb });
});

// ================= FAQ (ВОПРОС ПРО 16 ЛЕТ УДАЛЕН) =================
bot.action('faq', async (ctx) => {
  await ctx.answerCbQuery();
  const text = 
    `❓ <b>Часто задаваемые вопросы (FAQ)</b>\n\n` +
    `<b>1. Сколько времени занимает разработка?</b>\n` +
    `— Лендинг или телеграм-бот базовой/средней сложности обычно сдается за 1–3 дня.\n\n` +
    `<b>2. Какие гарантии и безопасность сделки?</b>\n` +
    `— Мы можем провести сделку через мой аккаунт на <b>Kwork</b>, где ваши средства замораживаются до полного принятия вами заказа.\n\n` +
    `<b>3. Поможете запустить на сервере?</b>\n` +
    `— Да, помогу с выбором недорогого VPS/хостинга, покупкой домена и настройкой автозапуска 24/7.\n\n` +
    `<b>4. Что по правкам?</b>\n` +
    `— Мелкие корректировки после сдачи бесплатны. Также доступна постоянная техническая поддержка.`;

  const kb = Markup.inlineKeyboard([
    [Markup.button.callback('📝 Оставить заявку', 'start_order')],
    [Markup.button.url('🟢 Перейти на Kwork', KWORK_URL)],
    [Markup.button.callback('⬅️ В главное меню', 'back_to_main')]
  ]);

  await ctx.editMessageText(text, { parse_mode: 'HTML', ...kb });
});

// ================= РАСШИРЕННАЯ ФОРМА ЗАЯВКИ =================
bot.action('start_order', async (ctx) => {
  await ctx.answerCbQuery();
  const session = getSession(ctx.from.id);
  session.step = 'choose_service';

  const services = getServices();
  const buttons = services.map((s, idx) => [
    Markup.button.callback(s.name, `pick_srv_${idx}`)
  ]);
  buttons.push([Markup.button.callback('⬅️ Отмена', 'back_to_main')]);

  await ctx.editMessageText(
    `📝 <b>Шаг 1 из 5: Выбор услуги</b>\n\nВыберите услугу из списка ниже или отправьте своё направление сообщением:`,
    { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) }
  );
});

bot.action(/^pick_srv_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const idx = parseInt(ctx.match[1], 10);
  const services = getServices();
  const session = getSession(ctx.from.id);

  session.service = services[idx] ? services[idx].name : 'Индивидуальный заказ';
  session.step = 'awaiting_description';

  await ctx.editMessageText(
    `✅ Выбрано: <b>${session.service}</b>\n\n` +
    `📝 <b>Шаг 2 из 5: Суть проекта и ТЗ</b>\n` +
    `Опишите подробно задачу: что должен делать сайт или бот, какие разделы и логика нужны?`,
    { parse_mode: 'HTML' }
  );
});

bot.action(/^crm_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const session = getSession(ctx.from.id);
  session.crm = ctx.match[1];
  session.step = 'awaiting_hosting';

  const kb = Markup.inlineKeyboard([
    [Markup.button.callback('✅ Да, есть свой VPS / хостинг', 'host_Есть свой сервер/хостинг')],
    [Markup.button.callback('❌ Нет, нужна помощь с покупкой/настройкой', 'host_Нет, требуется помощь')],
    [Markup.button.callback('🤔 Не знаю, нужна консультация', 'host_Нужна консультация')]
  ]);

  await ctx.editMessageText(
    `🖥 <b>Шаг 4 из 5: Хостинг, сервер и домен</b>\n\nЕсть ли у вас готовый сервер/хостинг или домен для проекта?`,
    { parse_mode: 'HTML', ...kb }
  );
});

bot.action(/^host_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const session = getSession(ctx.from.id);
  session.hosting = ctx.match[1];
  session.step = 'awaiting_deadline';

  await ctx.editMessageText(
    `⏳ <b>Шаг 5 из 5: Сроки и контакты</b>\n\n` +
    `Напишите желаемые сроки готовности проекта, примерный бюджет и удобный контакт для связи (если не Telegram):`,
    { parse_mode: 'HTML' }
  );
});

// ================= АДМИН-ПАНЕЛЬ (ID 1753180090) =================
bot.action('admin_panel', async (ctx) => {
  await ctx.answerCbQuery();
  if (ctx.from.id !== ADMIN_ID) return;

  await ctx.editMessageText(
    `⚙️ <b>Панель администратора</b>\nУправление услугами и ценами:`,
    { parse_mode: 'HTML', ...getAdminKeyboard() }
  );
});

bot.action('admin_add', async (ctx) => {
  await ctx.answerCbQuery();
  if (ctx.from.id !== ADMIN_ID) return;

  const session = getSession(ctx.from.id);
  session.adminStep = 'add_name';
  await ctx.editMessageText('Введите название новой услуги (например: <code>⚡️ Скоростной парсер</code>):', { parse_mode: 'HTML' });
});

bot.action('admin_delete_list', async (ctx) => {
  await ctx.answerCbQuery();
  if (ctx.from.id !== ADMIN_ID) return;

  const services = getServices();
  const buttons = services.map((s, idx) => [
    Markup.button.callback(`❌ ${s.name} (${s.price})`, `admin_del_${idx}`)
  ]);
  buttons.push([Markup.button.callback('⬅️ Назад', 'admin_panel')]);

  await ctx.editMessageText('Выберите услугу, которую хотите удалить:', Markup.inlineKeyboard(buttons));
});

bot.action(/^admin_del_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  if (ctx.from.id !== ADMIN_ID) return;

  const idx = parseInt(ctx.match[1], 10);
  const services = getServices();

  if (services[idx]) {
    const deleted = services.splice(idx, 1);
    saveServices(services);
    await ctx.reply(`🗑 Услуга "${deleted[0].name}" удалена!`);
  }

  await ctx.editMessageText('⚙️ <b>Панель администратора</b>', {
    parse_mode: 'HTML',
    ...getAdminKeyboard()
  });
});

// ================= ОБРАБОТЧИК ТЕКСТА (ЗАЯВКА И АДМИНКА) =================
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text;
  const session = getSession(userId);

  // --- ЛОГИКА АДМИНИСТРАТОРА ---
  if (userId === ADMIN_ID && session.adminStep) {
    if (session.adminStep === 'add_name') {
      session.newSrvName = text;
      session.adminStep = 'add_price';
      return ctx.reply('Введите стоимость услуги (например: <code>1000 ₽</code>):', { parse_mode: 'HTML' });
    }
    if (session.adminStep === 'add_price') {
      session.newSrvPrice = text;
      session.adminStep = 'add_desc';
      return ctx.reply('Введите краткое описание услуги:');
    }
    if (session.adminStep === 'add_desc') {
      const services = getServices();
      services.push({
        name: session.newSrvName,
        price: session.newSrvPrice,
        desc: text
      });
      saveServices(services);
      delete session.adminStep;
      return ctx.reply(`✅ Услуга <b>${session.newSrvName}</b> успешно добавлена!`, {
        parse_mode: 'HTML',
        ...getAdminKeyboard()
      });
    }
  }

  // --- ПОШАГОВАЯ ФОРМА ЗАЯВКИ КЛИЕНТА ---
  if (session.step === 'choose_service') {
    session.service = text;
    session.step = 'awaiting_description';
    return ctx.reply(
      `📝 <b>Шаг 2 из 5: Суть проекта и ТЗ</b>\nОпишите подробно, что должен делать сайт/бот, какие функции нужны:`,
      { parse_mode: 'HTML' }
    );
  }

  if (session.step === 'awaiting_description') {
    session.description = text;
    session.step = 'awaiting_crm';

    const kb = Markup.inlineKeyboard([
      [Markup.button.callback('Да, нужна CRM / Google Таблицы / БД', 'crm_Нужна CRM/База данных')],
      [Markup.button.callback('Нужен прием онлайн-оплат', 'crm_Нужен прием оплаты')],
      [Markup.button.callback('Нет, стандартный функционал без CRM', 'crm_Без интеграций')]
    ]);

    return ctx.reply(
      `🔗 <b>Шаг 3 из 5: CRM и интеграции</b>\n\nТребуется ли связка с CRM (AmoCRM, Bitrix24), базой данных или платежными шлюзами?\n<i>Выберите вариант или напишите текстом:</i>`,
      { parse_mode: 'HTML', ...kb }
    );
  }

  if (session.step === 'awaiting_crm') {
    session.crm = text;
    session.step = 'awaiting_hosting';

    const kb = Markup.inlineKeyboard([
      [Markup.button.callback('✅ Да, есть свой VPS / хостинг', 'host_Есть свой сервер/хостинг')],
      [Markup.button.callback('❌ Нет, нужна помощь с покупкой/настройкой', 'host_Нет, требуется помощь')],
      [Markup.button.callback('🤔 Не знаю, нужна консультация', 'host_Нужна консультация')]
    ]);

    return ctx.reply(
      `🖥 <b>Шаг 4 из 5: Хостинг, сервер и домен</b>\n\nЕсть ли у вас сервер или хостинг для запуска?`,
      { parse_mode: 'HTML', ...kb }
    );
  }

  if (session.step === 'awaiting_hosting') {
    session.hosting = text;
    session.step = 'awaiting_deadline';
    return ctx.reply(
      `⏳ <b>Шаг 5 из 5: Сроки и контакты</b>\n\nУкажите желаемые сроки сдачи проекта и контактные данные:`,
      { parse_mode: 'HTML' }
    );
  }

  if (session.step === 'awaiting_deadline') {
    session.deadline = text;

    const user = ctx.from;
    const username = user.username ? `@${user.username}` : `id: ${user.id}`;

    const report = 
      `🔥 <b>НОВАЯ ЗАЯВКА В БОТЕ!</b>\n\n` +
      `👤 <b>Клиент:</b> ${user.first_name || ''} ${user.last_name || ''} (${username})\n` +
      `🆔 <b>User ID:</b> <code>${user.id}</code>\n` +
      `💎 <b>Услуга:</b> ${session.service}\n` +
      `📋 <b>Описание / ТЗ:</b>\n${session.description}\n\n` +
      `🔗 <b>CRM / Интеграции:</b> ${session.crm}\n` +
      `🖥 <b>Сервер / Хостинг:</b> ${session.hosting}\n` +
      `⏳ <b>Сроки и контакт:</b> ${session.deadline}`;

    // Отправка заявки администратору
    try {
      await ctx.telegram.sendMessage(ADMIN_ID, report, { parse_mode: 'HTML' });
    } catch (e) {
      console.error('Ошибка отправки админу:', e);
    }

    resetSession(userId);

    return ctx.replyWithHTML(
      `✅ <b>Ваша заявка принята!</b>\n\n` +
      `Я ознакомлюсь с требованиями и напишу вам в ближайшее время.\n` +
      `Также вы можете оформить безопасную сделку через мой <a href="${KWORK_URL}">профиль Kwork</a>.`,
      getMainMenu(userId)
    );
  }
});

// ================= ЗАПУСК =================
bot.launch(() => {
  console.log('🚀 Бот на Node.js успешно запущен!');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
