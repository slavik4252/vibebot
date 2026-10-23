const { Telegraf, Markup } = require('telegraf');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ================= КОНФИГУРАЦИЯ =================
// Токен берется строго из Secrets на Replit
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 1753180090;
const KWORK_URL = 'https://kwork.ru/user/tivyko';
const SERVICES_FILE = path.join(__dirname, 'services.json');

if (!BOT_TOKEN) {
  console.error('❌ ОШИБКА: Переменная окружения BOT_TOKEN не задана в Replit Secrets!');
  process.exit(1);
}

// На Replit зеркало не требуется, запросы идут с зарубежного IP напрямую к api.telegram.org
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
    `✨ <b>Что я делаю:</b>\n` +
    `🔹 Современные адаптивные <b>лендинги и сайты-визитки</b>\n` +
    `🔹 Умные <b>Telegram-боты и Mini Apps</b>\n` +
    `🔹 <b>Редизайн</b>, ускорение и <b>техподдержку</b> ваших проектов\n\n` +
    `🔥 <i>Адекватные цены, чистый код и быстрые сроки сдачи!</i>\n\n` +
    `Выберите интересующий раздел в меню ниже 👇`;

  await ctx.replyWithHTML(text, getMainMenu(ctx.from.id));
});

bot.action('back_to_main', async (ctx) => {
  await ctx.answerCbQuery();
  resetSession(ctx.from.id);
  const text = 
    `🚀 <b>Главное меню VibeBot Studio</b>\n\n` +
    `💻 <b>Продаю услуги по веб-разработке, боты телеграмм.</b>\n` +
    `Выберите нужный раздел:`;
  await ctx.editMessageText(text, { parse_mode: 'HTML', ...getMainMenu(ctx.from.id) });
});

// ================= УСЛУГИ =================
bot.action('services', async (ctx)
