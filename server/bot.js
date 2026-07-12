const TelegramBot = require('node-telegram-bot-api');
const { queryAll, queryOne, run } = require('./database');

let botInstance = null;

async function startBot(app) {
  const BOT_TOKEN = process.env.BOT_TOKEN;
  if (!BOT_TOKEN) {
    throw new Error('BOT_TOKEN is required');
  }

  // Use webhook mode for production (no polling conflicts)
  const WEBHOOK_URL = process.env.WEBHOOK_URL || (process.env.RENDER ? `https://${process.env.RENDER_SERVICE_NAME}.onrender.com` : '');
  
  let bot;
  if (WEBHOOK_URL) {
    // Webhook mode for production
    bot = new TelegramBot(BOT_TOKEN);
    const webhookPath = `/webhook/${BOT_TOKEN}`;
    
    app.post(webhookPath, (req, res) => {
      bot.processUpdate(req.body);
      res.sendStatus(200);
    });
    
    await bot.setWebHook(`${WEBHOOK_URL}${webhookPath}`);
    console.log(`🤖 Bot webhook set: ${WEBHOOK_URL}${webhookPath}`);
  } else {
    // Polling mode for local development
    bot = new TelegramBot(BOT_TOKEN, { polling: true });
    console.log('🤖 Bot polling mode started');
  }
  
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

    // Handle region selection
    if (data.startsWith('region_')) {
      const region = data.replace('region_', '');
      if (!global.userStates || !global.userStates[telegramId]) return;
      
      const state = global.userStates[telegramId];
      if (state.step === 'region') {
        state.region = region;
        state.step = 'district';
        bot.sendMessage(chatId, `📍 ${region} tumanini/shahrini kiriting:`);
      }
      bot.answerCallbackQuery(query.id);
      return;
    }

    // Handle images done
    if (data === 'images_done') {
      if (!global.userStates || !global.userStates[telegramId]) return;
      const state = global.userStates[telegramId];
      if (state.step === 'images') {
        // Delete the images count message
        if (state.imagesMsgId) {
          bot.deleteMessage(chatId, state.imagesMsgId).catch(() => {});
        }
        await createOrder(chatId, telegramId, state);
      }
      bot.answerCallbackQuery(query.id);
      return;
    }

    // Handle grade selection
    if (data.startsWith('grade_')) {
      const grade = data.replace('grade_', '');
      if (!global.userStates || !global.userStates[telegramId]) return;
      
      const state = global.userStates[telegramId];
      if (state.step === 'grade') {
        state.grade = grade;
        state.step = 'subject';
        
        // Get subjects based on grade
        const gradeNum = parseInt(grade);
        let subjects = [];
        
        if (gradeNum >= 1 && gradeNum <= 4) {
          subjects = ['Ona tili', "O'qish", 'Matematika', 'Tabiiy fan', 'Tarbiya', 'Texnologiya', "Tasviriy san'at", 'Musiqa', 'Jismoniy tarbiya', 'Ingliz tili'];
        } else if (gradeNum >= 5 && gradeNum <= 6) {
          subjects = ['Ona tili', 'Adabiyot', "O'zbek tili", 'Ingliz tili', 'Matematika', 'Tabiiy fan', 'Informatika', 'Tarix', 'Tarbiya', 'Texnologiya', "Tasviriy san'at", 'Musiqa', 'Jismoniy tarbiya'];
        } else if (gradeNum >= 7 && gradeNum <= 9) {
          subjects = ['Ona tili', 'Adabiyot', 'Ingliz tili', 'Algebra', 'Geometriya', 'Fizika', 'Kimyo', 'Biologiya', 'Geografiya', "O'zbekiston tarixi", 'Jahon tarixi', 'Informatika', 'Tarbiya', "Davlat va huquq asoslari", 'Chizmachilik', 'Jismoniy tarbiya'];
        } else if (gradeNum >= 10 && gradeNum <= 11) {
          subjects = ['Ona tili', 'Adabiyot', 'Ingliz tili', 'Algebra', 'Geometriya', 'Fizika', 'Kimyo', 'Biologiya', 'Geografiya', "O'zbekiston tarixi", 'Jahon tarixi', 'Informatika', "Davlat va huquq asoslari", 'Tarbiya', 'Jismoniy tarbiya'];
        }
        
        // Build subject buttons (2 per row)
        const subjectButtons = [];
        for (let i = 0; i < subjects.length; i += 2) {
          const row = [{ text: subjects[i], callback_data: `subject_${subjects[i]}` }];
          if (subjects[i + 1]) {
            row.push({ text: subjects[i + 1], callback_data: `subject_${subjects[i + 1]}` });
          }
          subjectButtons.push(row);
        }
        
        bot.sendMessage(chatId, '📚 Fan nomini tanlang:', {
          reply_markup: { inline_keyboard: subjectButtons }
        });
      }
      bot.answerCallbackQuery(query.id);
      return;
    }

    // Handle subject selection
    if (data.startsWith('subject_')) {
      const subject = data.replace('subject_', '');
      if (!global.userStates || !global.userStates[telegramId]) return;
      
      const state = global.userStates[telegramId];
      if (state.step === 'subject') {
        state.subject = subject;
        state.step = 'topic';
        bot.sendMessage(chatId, '📖 Mavzuni kiriting:');
      }
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
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;

    if (!global.userStates || !global.userStates[telegramId]) return;

    const state = global.userStates[telegramId];

    // Skip commands but allow photos for images step
    if (msg.text && msg.text.startsWith('/')) return;
    if (!msg.text && !msg.photo) return;

    switch (state.step) {
      case 'full_name':
        state.full_name = msg.text;
        state.step = 'region';
        // Show region buttons
        const regions = [
          'Andijon viloyati', 'Buxoro viloyati', 'Jizzax viloyati',
          'Qashqadaryo viloyati', 'Navoiy viloyati', 'Namangan viloyati',
          'Samarqand viloyati', 'Sirdaryo viloyati', 'Surxondaryo viloyati',
          'Toshkent viloyati', "Farg'ona viloyati", 'Xorazm viloyati',
          'Toshkent shahri', 'Qoraqalpog\'iston Respublikasi'
        ];
        const regionButtons = [];
        for (let i = 0; i < regions.length; i += 2) {
          const row = [{ text: regions[i], callback_data: `region_${regions[i]}` }];
          if (regions[i + 1]) {
            row.push({ text: regions[i + 1], callback_data: `region_${regions[i + 1]}` });
          }
          regionButtons.push(row);
        }
        bot.sendMessage(chatId, '📍 Maktab joylashgan viloyatni tanlang:', {
          reply_markup: { inline_keyboard: regionButtons }
        });
        break;

      case 'district':
        state.district = msg.text;
        state.address = `${state.region}, ${msg.text}`;
        state.step = 'school';
        bot.sendMessage(chatId, '🏫 Maktab nomi/sonini kiriting:');
        break;

      case 'school':
        state.school = msg.text;
        state.step = 'grade';
        // Show grade buttons 1-11
        const gradeButtons = [];
        for (let i = 1; i <= 11; i += 2) {
          const row = [{ text: `${i}-sinf`, callback_data: `grade_${i}` }];
          if (i + 1 <= 11) {
            row.push({ text: `${i + 1}-sinf`, callback_data: `grade_${i + 1}` });
          }
          gradeButtons.push(row);
        }
        bot.sendMessage(chatId, '🎓 Nechinchi sinf?', {
          reply_markup: { inline_keyboard: gradeButtons }
        });
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
            const count = state.images.length;
            const keyboard = {
              reply_markup: {
                inline_keyboard: [
                  [{ text: '✅ Tayyor', callback_data: 'images_done' }],
                ],
              },
            };
            if (state.imagesMsgId) {
              // Edit existing message
              bot.editMessageText(
                `✅ Rasm qabul qilindi (${count}/5). Yana yuboring yoki "Tayyor" tugmasini bosing.`,
                { chat_id: chatId, message_id: state.imagesMsgId, ...keyboard }
              ).catch(() => {});
            } else {
              // Send new message and save its ID
              bot.sendMessage(
                chatId,
                `✅ Rasm qabul qilindi (${count}/5). Yana yuboring yoki "Tayyor" tugmasini bosing.`,
                keyboard
              ).then(sentMsg => {
                state.imagesMsgId = sentMsg.message_id;
              });
            }
          }
        }
        break;
    }
  });

  async function createOrder(chatId, telegramId, state) {
    try {
      const user = queryOne('SELECT id FROM users WHERE telegram_id = ?', [telegramId]);
      const service = queryOne('SELECT * FROM services WHERE id = ?', [parseInt(state.service_id)]);

      const orderCode = `MK-${Date.now().toString(36).toUpperCase()}`;

      run(`
        INSERT INTO orders (order_code, user_id, service_id, full_name, address, school, subject, grade, topic, total_price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [orderCode, user.id, parseInt(state.service_id), state.full_name, state.address, state.school, state.subject, state.grade, state.topic, service.price]);

      // Get order by order_code (more reliable than lastInsertRowid)
      const order = queryOne('SELECT * FROM orders WHERE order_code = ?', [orderCode]);
      if (!order) {
        bot.sendMessage(chatId, "❌ Buyurtma yaratishda xatolik.");
        delete global.userStates[telegramId];
        return;
      }

      // Save images to server
      if (state.images && state.images.length > 0) {
        const axios = require('axios');
        const fs = require('fs');
        const path = require('path');
        const { v4: uuidv4 } = require('uuid');
        const BOT_TOKEN = process.env.BOT_TOKEN;

        const imagesDir = path.join(__dirname, '..', 'uploads', 'images');
        if (!fs.existsSync(imagesDir)) {
          fs.mkdirSync(imagesDir, { recursive: true });
        }

        for (const fileId of state.images) {
          try {
            const fileInfo = await bot.getFile(fileId);
            const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfo.file_path}`;
            const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
            const filename = `${uuidv4()}.jpg`;
            const uploadPath = path.join(imagesDir, filename);
            fs.writeFileSync(uploadPath, response.data);
            run('INSERT INTO order_images (order_id, image_path) VALUES (?, ?)',
              [order.id, `/uploads/images/${filename}`]);
          } catch (imgErr) {
            console.error('Failed to save image:', imgErr.message);
          }
        }
        console.log(`Saved ${state.images.length} images for order ${orderCode}`);
      }

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
            [{ text: '📤 Chek yuborish', callback_data: `send_receipt_${order.id}` }],
            [{ text: '🔙 Asosiy menyu', callback_data: 'back_main' }],
          ],
        },
      };

      bot.sendMessage(chatId, paymentText, { parse_mode: 'Markdown', ...keyboard })
        .then(sentMsg => {
          // Save message ID for later deletion
          if (!global.paymentMessages) global.paymentMessages = {};
          global.paymentMessages[telegramId] = sentMsg.message_id;
        });

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
    const orderId = parseInt(state.order_id);

    console.log(`Receipt upload for order_id: ${orderId}`);

    try {
      const BOT_TOKEN = process.env.BOT_TOKEN;
      const file = await bot.getFile(photo.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;

      const axios = require('axios');
      const fs = require('fs');
      const path = require('path');
      const { v4: uuidv4 } = require('uuid');

      // Ensure receipts directory exists
      const receiptsDir = path.join(__dirname, '..', 'uploads', 'receipts');
      if (!fs.existsSync(receiptsDir)) {
        fs.mkdirSync(receiptsDir, { recursive: true });
      }

      const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      const filename = `${uuidv4()}.jpg`;
      const uploadPath = path.join(receiptsDir, filename);
      fs.writeFileSync(uploadPath, response.data);

      console.log(`Receipt saved: ${filename}, updating order ${orderId}`);

      const updateResult = run('UPDATE orders SET payment_receipt = ?, status = ? WHERE id = ?',
        [`/uploads/receipts/${filename}`, 'pending_confirmation', orderId]);

      // Delete the payment message
      if (global.paymentMessages && global.paymentMessages[telegramId]) {
        bot.deleteMessage(chatId, global.paymentMessages[telegramId])
          .catch(err => console.log('Could not delete payment message:', err.message));
        delete global.paymentMessages[telegramId];
      }

      console.log(`Update result:`, updateResult);

      // Verify the update
      const updatedOrder = queryOne('SELECT id, status, payment_receipt FROM orders WHERE id = ?', [orderId]);
      console.log(`Updated order:`, updatedOrder);

      bot.sendMessage(
        chatId,
        "✅ Chek yuborildi!\n\nTo'lov tekshirilgandan keyin hujjat tayyorlanadi.\n" +
        "Tayyor bo'lgach sizga xabar beriladi."
      );

      // Notify admin
      const settings = queryOne("SELECT value FROM settings WHERE key = 'admin_chat_id'");
      if (settings && settings.value) {
        const order = queryOne('SELECT order_code FROM orders WHERE id = ?', [orderId]);
        bot.sendMessage(
          settings.value,
          `🔔 *Yangi to'lov cheki!*\n\nBuyurtma: #${order ? order.order_code : orderId}\nFoydalanuvchi: ${msg.from.first_name}`,
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

function getBotInstance() {
  return botInstance;
}

module.exports = { startBot, getBotInstance };
