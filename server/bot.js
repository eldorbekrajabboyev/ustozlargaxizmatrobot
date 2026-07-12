const TelegramBot = require('node-telegram-bot-api');
const { queryAll, queryOne, run } = require('./database');

let botInstance = null;

async function startBot() {
  const BOT_TOKEN = process.env.BOT_TOKEN;
  if (!BOT_TOKEN) {
    throw new Error('BOT_TOKEN is required');
  }

  const bot = new TelegramBot(BOT_TOKEN, { polling: true });
  botInstance = bot;
  console.log('🤖 Metodikish Bot started');

  // ==================== HELPERS ====================

  function ensureUser(tgUser) {
    const existing = queryOne('SELECT * FROM users WHERE telegram_id = ?', [tgUser.id]);
    if (existing) {
      run('UPDATE users SET username = ?, first_name = ?, last_name = ? WHERE telegram_id = ?',
        [tgUser.username, tgUser.first_name, tgUser.last_name, tgUser.id]);
      return queryOne('SELECT * FROM users WHERE telegram_id = ?', [tgUser.id]);
    }
    const result = run('INSERT INTO users (telegram_id, username, first_name, last_name) VALUES (?, ?, ?, ?)',
      [tgUser.id, tgUser.username, tgUser.first_name, tgUser.last_name]);
    return queryOne('SELECT * FROM users WHERE id = ?', [result.lastInsertRowid]);
  }

  // ==================== COMMANDS ====================

  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    ensureUser(msg.from);

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📚 Xizmatlar', callback_data: 'services' }],
          [{ text: '📦 Buyurtmalarim', callback_data: 'my_orders' }],
          [{ text: "ℹ️ Ma'lumot", callback_data: 'info' }],
        ],
      },
    };

    bot.sendMessage(
      chatId,
      `🎓 *Metodikish* ga xush kelibsiz!\n\n` +
      `Biz sizga metodik qo'llanma va metodik tavsiya hujjatlarini tayyorlab beramiz.\n\n` +
      `Quyidagi tugmalardan birini tanlang:`,
      { parse_mode: 'Markdown', ...keyboard }
    );
  });

  // ==================== CALLBACK QUERIES ====================

  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    const telegramId = query.from.id;

    ensureUser(query.from);

    // Handle receipt upload
    if (data.startsWith('send_receipt_')) {
      const orderId = data.split('_')[2];
      if (!global.receiptStates) global.receiptStates = {};
      global.receiptStates[query.from.id] = { order_id: orderId };
      bot.sendMessage(chatId, '📸 Chek rasmini yuboring (rasm sifatida):');
      bot.answerCallbackQuery(query.id);
      return;
    }

    if (data === 'services') {
      const services = queryAll('SELECT * FROM services WHERE is_active = 1');
      if (services.length === 0) {
        return bot.sendMessage(chatId, 'Hozircha xizmatlar mavjud emas.');
      }

      const buttons = services.map(s => [
        { text: `${s.name} - ${s.price.toLocaleString()} so'm`, callback_data: `order_${s.id}` }
      ]);
      buttons.push([{ text: '🔙 Orqaga', callback_data: 'back_main' }]);

      bot.sendMessage(chatId, "📚 *Xizmatlar ro'yxati:*\n\nTanlang:", {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: buttons },
      });
    }

    if (data === 'back_main') {
      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📚 Xizmatlar', callback_data: 'services' }],
            [{ text: '📦 Buyurtmalarim', callback_data: 'my_orders' }],
            [{ text: "ℹ️ Ma'lumot", callback_data: 'info' }],
          ],
        },
      };
      bot.sendMessage(chatId, '🏠 Asosiy menyu:', keyboard);
    }

    if (data === 'info') {
      bot.sendMessage(
        chatId,
        `📖 *Metodikish* — O'qituvchilar uchun metodik hujjatlar tayyorlash xizmati.\n\n` +
        `📝 *Metodik Qo'llanma* — Batafsil metodik qo'llanma\n` +
        `📋 *Metodik Tavsiya* — Metodik tavsiya hujjati\n\n` +
        `⏰ Tayyorlash muddati: 5-6 soat\n` +
        `💳 To'lov: Kartaga o'tkazma orqali`,
        { parse_mode: 'Markdown' }
      );
    }

    if (data === 'my_orders') {
      const user = queryOne('SELECT id FROM users WHERE telegram_id = ?', [telegramId]);
      if (!user) return bot.sendMessage(chatId, "Siz hali ro'yxatdan o'tmagansiz.");

      const orders = queryAll(`
        SELECT o.*, s.name as service_name
        FROM orders o
        LEFT JOIN services s ON o.service_id = s.id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
      `, [user.id]);

      if (orders.length === 0) {
        return bot.sendMessage(chatId, "📦 Sizda hali buyurtmalar mavjud emas.");
      }

      const statusMap = {
        pending_payment: "💳 To'lov kutilmoqda",
        pending_confirmation: "🔍 To'lov tekshirilmoqda",
        in_progress: '📝 Tayyorlanmoqda',
        ready: '✅ Tayyor',
        sent: '📤 Yuborildi',
        rejected: '❌ Rad etildi',
      };

      const text = orders.map(o =>
        `*${o.order_code}*\n📋 ${o.service_name}\n📊 ${statusMap[o.status] || o.status}\n💰 ${o.total_price.toLocaleString()} so'm`
      ).join('\n\n');

      bot.sendMessage(chatId, `📦 *Buyurtmalarim:*\n\n${text}`, { parse_mode: 'Markdown' });
    }

    // Order creation flow
    if (data.startsWith('order_')) {
      const serviceId = data.split('_')[1];
      const service = queryOne('SELECT * FROM services WHERE id = ?', [parseInt(serviceId)]);
      if (!service) return;

      if (!global.userStates) global.userStates = {};
      global.userStates[telegramId] = {
        step: 'full_name',
        service_id: serviceId,
        service_name: service.name,
        service_price: service.price,
      };

      bot.sendMessage(
        chatId,
        `📝 *${service.name}* buyurtmasini berish\n\n` +
        `Iltimos, to'liq F.I.Sh ni kiriting:`,
        { parse_mode: 'Markdown' }
      );
    }

    bot.answerCallbackQuery(query.id);
  });

  // ==================== ORDER FLOW MESSAGES ====================

  bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;

    const chatId = msg.chat.id;
    const telegramId = msg.from.id;

    if (!global.userStates || !global.userStates[telegramId]) return;

    const state = global.userStates[telegramId];

    switch (state.step) {
      case 'full_name':
        state.full_name = msg.text;
        state.step = 'address';
        bot.sendMessage(chatId, '📍 Yashash manzilingizni kiriting:');
        break;

      case 'address':
        state.address = msg.text;
        state.step = 'school';
        bot.sendMessage(chatId, '🏫 Maktab nomi/sonini kiriting:');
        break;

      case 'school':
        state.school = msg.text;
        state.step = 'subject';
        bot.sendMessage(chatId, '📚 Fan nomini kiriting:');
        break;

      case 'subject':
        state.subject = msg.text;
        state.step = 'grade';
        bot.sendMessage(chatId, '🎓 Nechinchi sinf? (masalan: 5-sinf):');
        break;

      case 'grade':
        state.grade = msg.text;
        state.step = 'topic';
        bot.sendMessage(chatId, '📖 Mavzuni kiriting:');
        break;

      case 'topic':
        state.topic = msg.text;
        state.step = 'images';
        bot.sendMessage(
          chatId,
          "🖼 Rasm yuklamoqchimisiz? (5 tagacha)\n\n" +
          "Ha bo'lsa, rasmlarni yuboring.\n" +
          '"O\'tkazib yuborish" deb yozing.'
        );
        break;

      case 'images':
        if (!state.images) state.images = [];
        if (msg.text && msg.text.toLowerCase() === "o'tkazib yuborish") {
          await createOrder(chatId, telegramId, state);
        } else if (msg.photo) {
          if (state.images.length >= 5) {
            bot.sendMessage(chatId, '⚠️ Maksimal 5 ta rasm yuklash mumkin. Buyurtma yaratilmoqda...');
            await createOrder(chatId, telegramId, state);
          } else {
            state.images.push(msg.photo[msg.photo.length - 1].file_id);
            bot.sendMessage(chatId, `✅ Rasm qabul qilindi (${state.images.length}/5). Yana yuboring yoki "Tayyor" deb yozing.`);
          }
        } else if (msg.text && msg.text.toLowerCase() === 'tayyor') {
          await createOrder(chatId, telegramId, state);
        }
        break;
    }
  });

  async function createOrder(chatId, telegramId, state) {
    try {
      const user = queryOne('SELECT id FROM users WHERE telegram_id = ?', [telegramId]);
      const service = queryOne('SELECT * FROM services WHERE id = ?', [parseInt(state.service_id)]);

      const orderCode = `MK-${Date.now().toString(36).toUpperCase()}`;

      const result = run(`
        INSERT INTO orders (order_code, user_id, service_id, full_name, address, school, subject, grade, topic, total_price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [orderCode, user.id, parseInt(state.service_id), state.full_name, state.address, state.school, state.subject, state.grade, state.topic, service.price]);

      const card = queryOne('SELECT * FROM payment_cards WHERE is_active = 1 LIMIT 1');

      let paymentText = `✅ *Buyurtma yaratildi!*\n\n`;
      paymentText += `📋 Buyurtma raqami: *${orderCode}*\n`;
      paymentText += `📝 Xizmat: ${state.service_name}\n`;
      paymentText += `💰 Narxi: ${state.service_price.toLocaleString()} so'm\n\n`;

      if (card) {
        paymentText += `💳 *To'lov kartasi:*\n`;
        paymentText += `\`${card.card_number}\`\n`;
        paymentText += `👤 ${card.card_holder}\n`;
        paymentText += `🏦 ${card.bank_name || ''}\n\n`;
        paymentText += `Pul o'tkazgandan so'ng chekni yuboring.`;
      }

      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📤 Chek yuborish', callback_data: `send_receipt_${result.lastInsertRowid}` }],
            [{ text: '🔙 Asosiy menyu', callback_data: 'back_main' }],
          ],
        },
      };

      bot.sendMessage(chatId, paymentText, { parse_mode: 'Markdown', ...keyboard });

      delete global.userStates[telegramId];
    } catch (err) {
      console.error('Order creation error:', err);
      bot.sendMessage(chatId, "❌ Xatolik yuz berdi. Qaytadan urinib ko'ring.");
      delete global.userStates[telegramId];
    }
  }

  // Handle photo (receipt)
  bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;

    if (!global.receiptStates || !global.receiptStates[telegramId]) return;

    const state = global.receiptStates[telegramId];
    const photo = msg.photo[msg.photo.length - 1];

    try {
      const BOT_TOKEN = process.env.BOT_TOKEN;
      const file = await bot.getFile(photo.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;

      const axios = require('axios');
      const fs = require('fs');
      const path = require('path');
      const { v4: uuidv4 } = require('uuid');

      const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      const filename = `${uuidv4()}.jpg`;
      const uploadPath = path.join(__dirname, '..', 'uploads', 'receipts', filename);
      fs.writeFileSync(uploadPath, response.data);

      run('UPDATE orders SET payment_receipt = ?, status = ? WHERE id = ?',
        [`/uploads/receipts/${filename}`, 'pending_confirmation', parseInt(state.order_id)]);

      bot.sendMessage(
        chatId,
        "✅ Chek yuborildi!\n\nTo'lov tekshirilgandan keyin hujjat tayyorlanadi.\n" +
        "Tayyor bo'lgach sizga xabar beriladi."
      );

      // Notify admin
      const settings = queryOne("SELECT value FROM settings WHERE key = 'admin_chat_id'");
      if (settings && settings.value) {
        const order = queryOne('SELECT order_code FROM orders WHERE id = ?', [parseInt(state.order_id)]);
        bot.sendMessage(
          settings.value,
          `🔔 *Yangi to'lov cheki!*\n\nBuyurtma: #${order ? order.order_code : state.order_id}\nFoydalanuvchi: ${msg.from.first_name}`,
          { parse_mode: 'Markdown' }
        );
      }

      delete global.receiptStates[telegramId];
    } catch (err) {
      console.error('Receipt upload error:', err);
      bot.sendMessage(chatId, "❌ Chek yuklashda xatolik. Qaytadan urinib ko'ring.");
    }
  });

  // Admin commands
  bot.onText(/\/admin/, async (msg) => {
    const chatId = msg.chat.id;
    const settings = queryOne("SELECT value FROM settings WHERE key = 'admin_chat_id'");

    if (settings && String(msg.from.id) === settings.value) {
      const totalOrders = queryOne('SELECT COUNT(*) as count FROM orders').count;
      const pendingPayment = queryOne("SELECT COUNT(*) as count FROM orders WHERE status = 'pending_payment'").count;
      const pendingConfirmation = queryOne("SELECT COUNT(*) as count FROM orders WHERE status = 'pending_confirmation'").count;
      const inProgress = queryOne("SELECT COUNT(*) as count FROM orders WHERE status = 'in_progress'").count;
      const ready = queryOne("SELECT COUNT(*) as count FROM orders WHERE status = 'ready'").count;
      const sent = queryOne("SELECT COUNT(*) as count FROM orders WHERE status = 'sent'").count;
      const totalRevenueResult = queryOne("SELECT COALESCE(SUM(total_price), 0) as total FROM orders WHERE status IN ('in_progress', 'ready', 'sent')");
      const totalRevenue = totalRevenueResult ? totalRevenueResult.total : 0;

      bot.sendMessage(
        chatId,
        `📊 *Admin Panel*\n\n` +
        `📦 Jami buyurtmalar: ${totalOrders}\n` +
        `💳 To'lov kutilmoqda: ${pendingPayment}\n` +
        `🔍 Tekshirilmoqda: ${pendingConfirmation}\n` +
        `📝 Tayyorlanmoqda: ${inProgress}\n` +
        `✅ Tayyor: ${ready}\n` +
        `📤 Yuborilgan: ${sent}\n` +
        `💰 Jami daromad: ${totalRevenue.toLocaleString()} so'm`,
        { parse_mode: 'Markdown' }
      );
    }
  });

  return bot;
}

module.exports = { startBot };
