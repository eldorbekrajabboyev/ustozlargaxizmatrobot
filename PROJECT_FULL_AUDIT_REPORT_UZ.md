# 🏥 TO'LIQ KASBIY TEKSHIRUV HISOBOTI — Metodikish
### 15 ta mutaxassis tomonidan kod tekshiruvi | Sana: 2026-07-18

---

## MUNDARIJA
1. [Xavfsizlik mutaxassisi](#1-xavfsizlik-mutaxassisi)
2. [Backend/Node.js mutaxassisi](#2-backendnodejs-mutaxassisi)
3. [Ma'lumotlar bazasi mutaxassisi](#3-malumotlar-bazasi-mutaxassisi)
4. [Frontend/React mutaxassisi](#4-frontendreact-mutaxassisi)
5. [DevOps/Infratuzilma mutaxassisi](#5-devopsinfratuzilma-mutaxassisi)
6. [To'lov va Moliyaviy mutaxassis](#6-tolov-va-moliyaviy-mutaxassis)
7. [Parallellik va Race Condition mutaxassisi](#7-parallellik-va-race-condition-mutaxassisi)
8. [UX/UI mutaxassisi](#8-uxui-mutaxassisi)
9. [Telegram Bot mutaxassisi](#9-telegram-bot-mutaxassisi)
10. [API Dizayn mutaxassisi](#10-api-dizayn-mutaxassisi)
11. [Unumdorlik mutaxassisi](#11-unumdorlik-mutaxassisi)
12. [Kod sifati va saqlanishi mutaxassisi](#12-kod-sifati-va-saqlanishi-mutaxassisi)
13. [Biznes mantiq mutaxassisi](#13-biznes-mantiq-mutaxassisi)
14. [Testlash mutaxassisi](#14-testlash-mutaxassisi)
15. [Kengaytirilganlik mutaxassisi](#15-kengaytirilganlik-mutaxassisi)

---

## 1. XAVFSIZLIK MUTAXASSISI

Xavfsizlik — bu loyihadagi eng jiddiy muammo. Quyida topilgan har bir zaiflik tizimning butunlay buzilishiga olib kelishi mumkin.

### 🔴 JUDA MUHIM (CRITICAL)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| S1 | **Admin API da autentifikatsiya yo'q** | `server/index.js` (barcha marshrutlar) | Har bir `/api/*` endpointi ochiq. Istalgan kishi `PUT /api/orders/:id/confirm-payment`, `DELETE /api/promo-codes/:id`, `POST /api/broadcast`, `PUT /api/settings` — boshqaruv panelidagi hamma narsani chaqirishi mumkin. Hech qanday autentifikatsiya yo'q. Ya'ni, internetdagi istalgan odam sizning buyurtmalarni tasdiqlashi, promo-kodlarni o'chirishi, xabar yuborishi mumkin. |
| S2 | **Telegram WebApp initData tekshirilmaydi** | `client/src/App.jsx:36` | MiniApp `tg.initDataUnsafe.user` ga to'liq ishonadi. Har qanday foydalanuvchi Telegram tashqarida MiniApp ni ochib yoki JavaScript ni o'zgartirib `telegram_id` ni soxtalashtirishi mumkin. `BOT_TOKEN` yordamida HMAC/imzo tekshiruvi yo'q. Ya'ni, boshqa odamning identifikatsiyasini o'ziga olish mumkin. |
| S3 | **Bot token settings endpointida ochiq** | `GET /api/settings` → `bot_token` qaytaradi | Admin sozlamalar endpointi `bot_token` ni matn ko'rinishida istalgan chaqiruvchiga beradi. Bu butun tizimdagi eng xavfli hisob ma'lumotidir. Ushbu token bilan botni to'liq boshqarish mumkin. |
| S4 | **CORS cheklovi yo'q** | `server/index.js:24` | `app.use(cors())` hech qanday manba cheklovisiz. Istalgan veb-sayt API ga so'rov yuborishi mumkin. Faqat `https://metodikish.fly.dev` ruxsat etilishi kerak. |

### 🟠 YUQORI XAVF (HIGH)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| S5 | **SQL in'eksiya xavfi `PUT /api/settings` da** | `server/index.js:416` | `for (const [key, value] of Object.entries(req.body))` — so'rov tanasidagi istalgan kalitlarni aylanadi. Hujumchi sozlamalar jadvaliga istalgan kalitni kiritishi mumkin. Oq ro'yxat (whitelist) yo'q. Ya'ni, hujumchi "bot_token" kalitini o'zgartirib, botni o'ziga bog'lab olishi mumkin. |
| S6 | **SQL in'eksiya: `nowUZ()` dan interpolatsiya** | `server/index.js` bir nechta joyda | `'${nowUZ()}'` to'g'ridan-to'g'ri SQL satrlariga joylashtirilgan. `nowUZ()` foydalanuvchi tomonidan boshqarilmaydi, lekin bu pattern xavfli — boshqa joyda xuddi shunday kod foydalanuvchi kiritmasi bilan ishlatsa, in'eksiya mumkin. |
| S7 | **Tezlik cheklovi (rate limiting) yo'q** | Barcha API endpointlari | Hech qayerda tezlik cheklovi yo'q. Bot/hujumchi promo-kodlarni buzib kirishi, cheksiz buyurtmalar yaratishi yoki broadcast endpointini DDoS qilishi mumkin. |
| S8 | **Fayl yuklashda tozalash yo'q** | `server/index.js:90-103` | `fileFilter` `ext || mime` (mantiqiya YOKI) ruxsat beradi, ya'ni faqat to'g'ri kengaytma YOKI to'g'ri MIME turiga ega fayl o'tadi. Hujumchi `.jpg` kengaytmali `.exe` faylini yuklashi mumkin. |
| S9 | **Admin panelda nol autentifikatsiya** | `admin/` (butun ilova) | `/admin/` ni kashf etgan har qanday kishi admin panelga kirishi, barcha foydalanuvchi ma'lumotlarini ko'rishi, sozlamalarni o'zgartirishi, buyurtmalarni o'chirishi va xabar yuborishi mumkin. |
| S10 | **Telegram WebApp URL qattiq kodlangan** | `bot.js:263,401,460,475` | `'https://metodikish.fly.dev/'` hamma joyda qattiq kodlangan. Agar domen o'zgarsa, barcha bot klaviaturalari buziladi. Sozlamalardan o'qilishi kerak. |

### 🟡 O'RTA XAVF (MEDIUM)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| S11 | **Foydalanuvchi kontentini tozalash yo'q** | `server/index.js` POST marshrutlari | `full_name`, `school`, `subject`, `topic`, `admin_note` — hammasi xom saqlanadi. XSS xavfi — React client uchun yordam beradi, lekin admin panel HTML da xavf bo'lishi mumkin. |
| S12 | **Bot `getChatMember` kanal ma'lumotini oshkor qilishi mumkin** | `bot.js:41-54` | `checkSubscription` har qanday xatoda `false` qaytaradi, shu jumladan tezlik cheklovida. Tekshiruv xatosi foydalanuvchini to'liq bloklaydi. |
| S13 | **Promo-kod tekshiruvida vaqt hujumi (timing attack)** | `server/index.js:505-527` | "Noto'g'ri kod", "allaqachon ishlatilgan" va "limit tugagan" uchun turli xato xabarlari — bu hujumchiga haqiqiy promo-kodlarni topishga yordam beradi. |
| S14 | **Mahalliy ishlab chiqarishda HTTPS majburiy emas** | Server HTTP da ishlaydi | Fly.io da `force_https = true` bor, lekin mahalliy ishlab chiqarish HTTP da ishlaydi. Bot webhook URL lari HTTPS ni majburiy qilishi kerak. |

### Tavsiyalar (muhimlik tartibida):
1. **API kalit autentifikatsiyasi** qo'shing admin endpointlari uchun (`Authorization: Bearer <ADMIN_KEY>`)
2. **`initData` ni tekshiring** HMAC-SHA256 yordamida bot token bilan har bir MiniApp so'roviga
3. **Hech qachon `bot_token` ni oshkor qilmang** settings API orqali — yashiring
4. **CORS manbalarini oq ro'yxatga kiriting** faqat `https://metodikish.fly.dev` uchun
5. **Tezlik cheklovi qo'shing** (masalan, `express-rate-limit`) barcha ochiq endpointlar uchun
6. **Ruxsat etilgan settings kalitlarini oq ro'yxatga kiriting** `PUT /api/settings` uchun

---

## 2. BACKEND/NODE.JS MUTAXASSISI

### Arxitektura
- Yagona `index.js` (864 qator) ham API server, ham statik fayl serveri sifatida xizmat qiladi
- Mas'uliyatlar ajratilmagan — marshrutlar, biznes mantiq va ma'lumotlar bazasi kirishlari aralashgan
- Autentifikatsiya, tekshirish yoki xato qayta ishlash uchun middleware yo'q
- `bot.js` (721 qator) webhook/polling zaxiralashi bilan yaxshi tuzilgan

### 🔴 JUDA MUHIM (CRITICAL)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| B1 | **So'rov qayta ishlovchilarida `require('./bot')`** | `server/index.js:368,387,423,444` | `const bot = require('./bot').getBotInstance()` Telegram xabar yuboradigan har bir so'rov qayta ishlovchisida chaqiriladi. Node modullarni saqlab qo'yadi, lekin bu kod xususiyati va tsiklik bog'lanish yaratadi (`index.js` → `bot.js` → `database.js`). |
| B2 | **Yumshoq o'chirish (graceful shutdown) yo'q** | `server/index.js` | `SIGTERM`/`SIGINT` ishlovchisi yo'q. Fly.io deploy paytida eski jarayon so'rov o'rtasida o'chiriladi. Jarayondagi buyurtmalar holatini yo'qotishi mumkin. |
| B3 | **Xato ishlovchisi faqat log yozadi** | `server/index.js:457-458` | `process.on('uncaughtException')` va `unhandledRejection` faqat `console.error`. Server buzilgan holatda ishlashda davom etadi. |

### 🟠 YUQORI XAVF (HIGH)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| B4 | **`deleteOrderImages` ikkala faylda aniqlangan** | `bot.js:13-21` + `index.js:35-42` | Bir xil funksiya takrorlangan. Bittasi yangilanganda, ikkinchisi eskirib qolishi mumkin. Umumiy utilities bo'lishi kerak. |
| B5 | **`nowUZ()` ikkala faylda aniqlangan** | `bot.js:9-11` + `index.js:12-14` | Xuddi takrorlash muammosi. |
| B6 | **So'rov tanasi hajmi cheklovi yo'q** | `server/index.js` | `express.json()` `limit` optsiz (standart 100KB). Xavfsizlik uchun `limit: '1mb'` aniq belgilanishi kerak. |
| B7 | **Xotiradagi kesh hech qachon muddati o'tmaydi** | `server/index.js:27-33` | `cache` Map faqat TTL bo'yicha bekor qilinadi, kalitlar soni bo'yicha emas. Doimiy trafik ostida xotira oqib chiqishi mumkin. |
| B8 | **`bot.on('photo')` da poyga holati (race condition)** | `bot.js:621-692` | Chek rasmi qayta ishlovchisi qulflamaydi. Ikki tez rasm bir xil buyurtmani yangilashi mumkin. |
| B9 | **`bot.onText(/\/start/)` tartibi** | `bot.js:213` | `/start` ishlovchisi umumiy `bot.on('message')` dan oldin ishlaydi. Agar foydalanuvchi allaqachon ro'yxatdan o'tgan bo'lsa va `/start` ni parametrsiz yuborsa, ikkala `onText` ham, `on('message')` ham ishlaydi — ikki marta ishlaydi. |

### Tavsiyalar:
1. Umumiy vositalarni (`nowUZ`, `deleteOrderImages`) `server/utils.js` ga chiqaring
2. Yumshoq o'chirish ishlovchisini qo'shing
3. Global xato qayta ishlash middleware ini qo'shing
4. So'rov tanasi hajmi cheklovi qo'shing
5. Marshrut ishlovchilarini `server/routes/` jildiga ajrating

---

## 3. MA'LUMOTLAR BAZASI MUTAXASSISI

### Saxifa xulasasi
```
users, services, orders, order_images, payment_cards, settings,
reviews, promo_codes, promo_code_usage
```

### 🔴 JUDA MUHIM (CRITICAL)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| D1 | **Chet kalitlari (foreign key) majburiy emas** | Turso/libSQL | SQLite asosidagi ma'lumotlar bazalari standart ravishda chet kalitlari cheklovlarini bajarilmaydi. `PRAGMA foreign_keys` hech qachon o'rnatilmagan. Yolg'iz yozuvlar paydo bo'lishi mumkin. Ya'ni, buyurtma mavjud bo'lmagan foydalanuvchiga bog'lanishi mumkin. |
| D2 | **`settings` jadvali `INSERT OR IGNORE` ishlatadi** | `database.js:101-110` | Sozlamalar shakllantirishi `INSERT OR IGNORE` ishlatadi, lekin `referral_discount_amount` va `bot_username` hisobdan tashqari kiritiladi (108-109 qatorlar). Ushbu qatorlar har bir ishga tushirishda, faqat birinchi marta emas, ishlaydi. `OR IGNORE` tufayli zararli emas, lekin ehtiyotsiz. |
| D3 | **bo'sh catch bilan ALTER TABLE** | `database.js:112-123` | Barcha `ALTER TABLE` bayonotlari xatolarni jimlikda tutadi. Ustun allaqachon mavjud bo'lsa, xato yutib yuboriladi. ALTER boshqa sababga ko'ra (disk to'lib, ruxsatlar) xato bersa, shuningdek jimlikda e'tiborga olinadi. |

### 🟠 YUQORI XAVF (HIGH)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| D4 | **Asosiy kalitlardan tashqari indekslar yo'q** | `database.js` | `WHERE status = 'pending_payment'`, `WHERE user_id = ?`, `WHERE promo_code_id = ?` kabi so'rovlar indekssiz. Buyurtmalar soni ortishi bilan unumdorlik pasayadi. |
| D5 | **Kanallar quvur ajratilgan sifatida saqlanadi** | `settings.channels` | `name\|link\|updated_at\|name\|link\|updated_at` — noto'g'ri pattern. Alohida `channels` jadvali bo'lishi kerak. Tahlil qilish xatolarga moyil va so'rovlar mumkin emas. |
| D6 | **`updated_at` avtomatik yangilanmaydi** | Barcha jadvallar | `updated_at` qo'lda kodda belgilanadi. Unutib qo'yish oson. Trigger yoki middleware ishlatilishi kerak. |
| D7 | **`promo_code_usage` da noyob cheklov yo'q** | `database.js` | `UNIQUE(promo_code_id, user_id)` cheklovi yo'q. Kod qo'lda takrorlanishlarni tekshiradi, lekin poyga holatlari hali ham takrorlar yaratishi mumkin. |
| D8 | **`orders` jadvali cheksiz o'smoqda** | Barcha buyurtmalar | Rad etilgan/bekor qilingan buyurtmalar abadiy saqlanadi. Arxivlash strategiyasi yo'q. |

### 🟡 O'RTA XAVF (MEDIUM)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| D9 | **Vaqt belgisi vaqt zonasi qayta ishlash** | `database.js` | `datetime('now', '+5 hours')` UTC+5 ni qattiq kodlaydi. Agar joylashuv o'zgarsa yoki DST qoidalari o'zgarsa, bu buziladi. |
| D10 | **Migratsiya tizimi yo'q** | `database.js` | Saxifa o'zgarishlari `ALTER TABLE ... ADD COLUMN` bilan catch-all ga tayanadi. Versiyalash yo'q, qaytarish yo'q. |
| D11 | **`referred_by` `INTEGER` FK lekin cheklov yo'q** | `database.js` | `ALTER TABLE users ADD COLUMN referred_by INTEGER` — FOREIGN KEY yo'q. Mavjud bo'lmagan foydalanuvchiga murojaat qilishi mumkin. |

### Tavsiya etilgan indekslar:
```sql
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_promo_usage_code_user ON promo_code_usage(promo_code_id, user_id);
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_referred_by ON users(referred_by);
```

---

## 4. FRONTEND/REACT MUTAXASSISI

### Arxitektura
- React 18 + React Router 6 + Tailwind CSS + Axios
- Holat boshqaruvchisi yo'q (faqat useState/useEffect)
- Yuklash / kod ajratish yo'q
- Xato chegaralari (error boundary) yo'q

### 🔴 JUDA MUHIM (CRITICAL)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| F1 | **Xato chegarasi (error boundary) yo'q** | `client/src/` | Har qanday komponentdagi bitta xato butun MiniApp ni oq ekran bilan buzadi. Qayta tiklash yo'q. Foydalanuvchi ilovani qayta ochishi kerak. |
| F2 | **Autentifikatsiya tekshiruvi yo'q** | `client/src/App.jsx` | Foydalanuvchi `tg.initDataUnsafe.user` dan o'rnatilgan — tekshirish yo'q. Agar ma'lumot yo'q/noto'g'ri bo'lsa, ilova `user = null` bilan jimlikda davom etadi, API so'rovlarini g'alati tarzda buzadi. |
| F3 | **`validatePromo` da `basePrice` aniqlanmagan** | `OrderForm.jsx:168` | `const disc = Math.round(basePrice * res.data.discount_percent / 100)` — `basePrice` keyinroq 224-qatorda hisoblanadi. Hozirgi ko'lamda u `undefined`. Promo chegirma hisobi doimo `NaN` bo'ladi. **Bu ishlab chiqarishdagi xato.** |

### 🟠 YUQORI XAVF (HIGH)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| F4 | **Rasmlar hech qachon xotiradan chiqarilmaydi** | `OrderForm.jsx:143-153` | `URL.createObjectURL(img)` hech qachon bekor qilinmaydigan ob'ekt URL lari yaratadi (`URL.revokeObjectURL`). Foydalanuvchi rasmlarni qo'shib/o'chirganda xotira oqib chiqadi. |
| F5 | **O'zgartirishlar uchun yuklanish holatlari yo'q** | `OrderForm.jsx` | `handleSubmit` da `submitting` holati bor, lekin `validatePromo` faqat `promoChecking` o'rnatadi, to'g'ri UI bilan emas. |
| F6 | **Countdown taymer vaqt zonasi o'zgartirish zaif** | `OrderDetail.jsx:33-42` | `parseToUTCTimestamp` sanalarni qo'lda tahlil qiladi va 5 soat ayiradi. Agar server yoki klient vaqt zonasi o'zgarsa, countdown buziladi. ISO 8601 vaqt zonasi offseti bilan ishlatilishi kerak. |
| F7 | **Polling intervali unmount paytida tozalanmaydi** | `OrderDetail.jsx:129-139` | `useEffect` tozalash komponent fetch paytida unmount bo'lsa, intervalni to'g'ri tozalamasligi mumkin. |
| F8 | **Bosh sahifada qattiq kodlangan statistika** | `Home.jsx:198-207` | `1 850+`, `98%`, `4 yil`, `12h` — hammasi qattiq kodlangan marketing raqamlari, ma'lumotlar bazasidan olinmagan. Agar statistika o'zgarsa, sahifa noto'g'ri ko'rsatadi. |
| F9 | **`React.memo` yoki memoization yo'q** | Barcha komponentlar | Har bir ota qayta chizilganida barcha bolalar qayta chiziladi. Kichik ilova uchun qabul qilinadi, lekin xususiyatlar o'sishi bilan yomonlashadi. |

### 🟡 O'RTA XAVF (MEDIUM)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| F10 | **Inline uslublar Tailwind bilan aralashgan** | `Home.jsx` keng qo'llaniladi | `style={{}}` ning katta qo'llanilishi Tailwind sinflari bilan birga. Nomuvofiqlik yaratadi va mavzuni qiyinlashtiradi. |
| F11 | **Yuklanish skeleti yo'q** | Barcha sahifalar | Barcha yuklanish holatlari markazda spinner ko'rsatadi. Yaxshiroq UX skelet joylashuvlari bo'lishi kerak. |
| F12 | **`copyToClipboard` takrorlangan** | `OrderDetail.jsx:7-16` + `Profile.jsx:6-17` | Bir xil clipboard yordamchi funksiyasi ikki marta aniqlangan. |
| F13 | **CSS animatsiyalar `<style>` teglarida** | `Home.jsx:155-169`, `OrderDetail.jsx:348-351` | Komponentlardagi inline `<style>` teglari qamrovli emas va global tarzda oqadi. |

---

## 5. DEVOPS/INFRATUZILMA MUTAXASSISI

### Deploy ustuni
- **Platforma:** Fly.io (shared-cpu-1x, 256MB RAM, ams regioni)
- **Build:** Docker ko'p bosqichli (node:20-slim)
- **Ma'lumotlar bazasi:** Turso (libSQL) mahalliy SQLite zaxirasi bilan
- **Doimiy saqlash:** Fly.io volume mount `/app/uploads` da

### 🔴 JUDA MUHIM (CRITICAL)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| O1 | **256MB RAM yetarli bo'lmasligi mumkin** | `fly.toml` | Node.js + React build + Express + Bot polling + rasm qayta ishlash 256MB da tor. O'rtacha yuklanish ostida OOM (out of memory) o'limlari ehtimoli yuqori. |
| O2 | **Sog'liqni saqlash tekshiruvi (health check) endpointi yo'q** | `server/index.js` | Fly.io da sog'liqni saqlash tekshiruvi sozlanmagan. Bloklangan yoki buzilgan jarayonlar qayta ishga tushirilmaydi. |
| O3 | **Ma'lumotlar bazasi zaxiralash strategiyasi yo'q** | Turso | Turso zaxiralash konfiguratsiyasi haqida ma'lumot yo'q. Agar ma'lumotlar bazasi buzilsa, qayta tiklash rejasiz. |

### 🟠 YUQORI XAVF (HIGH)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| O4 | **`auto_stop_machines = false`** | `fly.toml` | Mashinalar hech qachon to'xtamaydi. Kechasi kam trafikli xizmat uchun 24/7 ishlash besamar. |
| O5 | **Dockerfile da build keshi yo'q** | `Dockerfile` | Har bir deploy client va admin ni noldan qayta quradi. Docker qatlami keshini ishlatish kerak. |
| O6 | **`.dockerignore` yo'q** | Loyiha ildizi | `node_modules`, `.git`, `uploads` ehtimol build kontekstiga nusxalanadi, deployni sekinlashtiradi. |
| O7 | **Volume mount `/app/uploads` da** | `fly.toml` | Doimiy volume kvitansiyalar/hujjatlar uchun to'g'ri, lekin `uploads/images/` (foydalanuvchi yuklagan buyurtma rasmlari) deploylar orasida saqlanadi. Eski rasmlar to'planadi. |
| O8 | **Loglash infratuzilmasi yo'q** | `server/index.js` | Barcha loglash `console.log`/`console.error`. Tuzilmali loglash (JSON), log darajalari, tashqi log yig'ish yo'q. |

### 🟡 O'RTA XAVF (MEDIUM)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| O9 | **`.env.example` hujjatlanmagan** | Loyiha ildizi | `.env.example` mavjud, lekin barcha kerakli o'zgaruvchilarni hujjatlamagan bo'lishi mumkin. Yetishmayotgan o'zgaruvchilar jimlikda xususiyatlarni buzadi. |
| O10 | **Yagona region deploy** | `fly.toml` | Faqat `ams` regioni. O'zbekistondagi foydalanuvchilar kechikishni sezadi. Yaqinroq alternativa sifatida `ist` (Stambul) yoki `nrt` (Tokio) ni ko'rib chiqing. |
| O11 | **CI/CD quvuri yo'q** | `.github/workflows/` yo'q | Deploylar qo'lda `fly deploy`. Deploy dan oldin avtomatik testlar, tekshirish yoki build tasdiqlashi yo'q. |

---

## 6. TO'LOV VA MOLIYAVIY MUTAXASSIS

### To'lov oqimi
```
Foydalanuvchi buyurtma yaratadi → 2 daqiqalik taymer boshlanadi → Foydalanuvchi chek yuklaydi → Admin tasdiqlaydi/rad etadi → Hujjat tayyorlanadi → Yuboriladi
```

### 🔴 JUDA MUHIM (CRITICAL)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| P1 | **Klientdagi taymer muddati o'tganidan keyin chek yuklashni to'xtatmaydi** | `OrderDetail.jsx:408-426` | Taymer klientda tugaydi, lekin yuklash tugmasi faqat CSS holati orqali yashirilgan. `handleReceiptUpload` funksiyasida server tomonidagi taymer tekshiruvi yo'q. Bot chek qayta ishlovchisi (`bot.js:631-637`) server holatini tekshiradi, lekin MiniApp HTTP endpointi (`index.js:288`) tekshirmaydi. Hujumchi muddat o'tganidan keyin to'g'ridan-to'g'ri `POST /api/orders/:id/receipt` ga so'rov yuborishi mumkin. |
| P2 | **To'lov tekshiruvi yo'q** | `index.js:288` | Chek yuklash holatini hech qanday tekshiruvsiz `pending_confirmation` ga o'zgartiradi. Rasm sifati, 10MB limitidan tashqari fayl hajmi yoki rasm haqiqatan chek ekanligini tekshirish yo'q. Admin hamma narsani qo'lda tekshirishi kerak. |
| P3 | **Umumiy narx manfiy bo'lishi mumkin** | `index.js:246` | `totalPrice = basePrice - validPromoDiscount - validReferralDiscount`. Agar promo chegirama (foiz) + referral chegirama narxdan oshsa, umumiy manfiy bo'ladi. Foydalanuvchi nazariy jihatdan buyurtma berib pul olishi mumkin. |

### 🟠 YUQORI XAVF (HIGH)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| P4 | **Promo chegirama oldindan chegirilgan narxga qo'llaniladi** | `index.js:236` | `validPromoDiscount = Math.round(basePrice * promo.discount_percent / 100)` — bu to'g'ri, lekin referral chegirama tekshilgan. Ikkalasi qo'llanilsa, referral allaqachon kamaytirilgan narxdan ayiriladi. Bu promo+referral birgalikda asosiy narxning 100% dan oshishi mumkinligini anglatadi. |
| P5 | **Tranzaksiya o'rab olish yo'q** | `index.js:231-255` | Buyurtma yaratish + promo saqlash + referral ayirish alohida DB chaqiruvlari. Agar biri o'rtasida xato bersa, tizim tutarsiz holatda qoladi (masalan, promo saqlangan, lekin buyurtma yaratilmagan). |
| P6 | **Referral mukofoti order yaratilgan vaqtdagi emas, settings dagi `referral_discount_amount` ishlatadi** | `index.js:365-369` | Agar admin buyurtma yaratish va to'lov tasdiqlash o'rtasida `referral_discount_amount` ni o'zgartirsa, referral oluvchi kutilganidan boshqa mukofot oladi. |
| P7 | **Moliyaviy audit izi yo'q** | Barcha to'lov operatsiyalari | Alohida `transactions` yoki `payment_log` jadvali yo'q. Qaytarish miqdorlari, mukofotlar va chegirmalar dinamik hisoblanadi. Moliyaviy jihatdan auditi mumkin emas. |

### 🟡 O'RTA XAVF (MEDIUM)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| P8 | **Promo chegirama yaxlitlash** | `index.js:236` | `Math.round` ko'p buyurtmalar yig'indisida bitta so'mga xato keltirib chiqarishi mumkin. Yagona jihatdan ahamiyatsiz, lekin minglab marta yig'iladi. |
| P9 | **Maksimal buyurtma narxi cheklovi yo'q** | `index.js:246` | `totalPrice` to'g'ridan-to'g'ri klientdan o'tkaziladi. Server qayta hisoblasa ham, tekshirish yo'q. Klientdan boshqarilgan `language_surcharge` yoki `geographic_surcharge` narxni oshirishi mumkin. |

---

## 7. PARALLELLIK VA RACE CONDITION MUTAXASSISI

### Amalga oshirilgan himoyalar
- ✅ Buyurtma kodi UUID qo'shimchasi orqali noyob
- ✅ Chek yuklashda TOCTOU tuzatilishi (`WHERE status = 'pending_payment'`)
- ✅ Promo saqlangan/ishlatilgan tsikli
- ✅ `used_count + reserved_count` tekshiruvi

### 🔴 JUDA MUHIM (CRITICAL)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| C1 | **Promo-kod ikki marta ishlatish poyga holati** | `index.js:228-243` + `index.js:249-253` | "Allaqachon ishlatilgan" tekshiruvi va saqlash orasida boshqa so'rov xuddi shu tekshiruvdan o'tishi mumkin. Bir xil foydalanuvchining bir xil promo-kod bilan ikki parallel buyurtmasi ikkalasi ham muvaffaqiyatli bo'lishi mumkin. `promo_code_usage` jadvalida `(promo_code_id, user_id)` ustida noyob cheklov yo'q. |
| C2 | **Referral balansi ikki marta sarflanishi** | `index.js:239-242` | Bir xil foydalanuvchining ikki parallel buyurtmasi `referral_balance >= discountAmount` tekshiruvi ikkalasi ham ayirishi mumkin. `UPDATE users SET referral_balance = ...` oldingi SELECT bilan atomik emas. |

### 🟠 YUQORI XAVF (HIGH)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| C3 | **`confirm-payment` bir necha marta chaqirilishi mumkin** | `index.js:341-375` | Buyurtma allaqachon `in_progress` ekanligini tekshirmaydi. Ikki marta tasdiqlash referral oluvchini ikki marta mukofotlaydi va promo-ni ikki marta ishlatilgan deb belgilaydi. |
| C4 | **`reject-payment` joriy holatni tekshirmaydi** | `index.js:377-402` | Allaqachon rad etilgan yoki tasdiqlangan buyurtmani rad etish hali ham promo/referral ni qaytarishga harakat qiladi. |
| C5 | **Bot `createOrder` da idempotentilik yo'q** | `bot.js:563-618` | Agar bot ishlovchisi ikki marta ishlasa (masalan, webhook qayta urinish), ikki buyurtma yaratiladi. |

### Tavsiyalar:
1. `promo_code_usage` ga `UNIQUE(promo_code_id, user_id)` cheklovi qo'shing
2. Balans tekshiruvlari uchun `SELECT ... FOR UPDATE` patternini (yoki SQLite `BEGIN IMMEDIATE`) ishlating
3. Tasdiqlash/rad etish ishlovchilarida holat tekshiruvlarini qo'shing (`WHERE status = 'pending_confirmation'`)
4. Buyurtma yaratish uchun idempotentsiya kalitlarini ishlating

---

## 8. UX/UI MUTAXASSISI

### Kuchli tomonlari
- ✅ Animatsiyalar va ijtimoiy dalillar bilan chiroyli, silliq Bosh sahifa
- ✅ Progress ko'rsatkichi bilan aniq bosqichma-bosqich buyurtma shakli
- ✅ Yulduz baholari bilan sharh tizimi
- ✅ Referral havolasi va statistikasi bilan Profil sahifasi
- ✅ Karta/summa uchun clipboard ga nusxa olish bilan to'lov countdown

### 🔴 JUDA MUHIM (CRITICAL)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| U1 | **8 qadamlilik buyurtma shakli juda ko'p** | `OrderForm.jsx` | 8 ketma-ket ekran (F.I.Sh → Viloyat → Tuman → Maktab → Maktab turi → Sinf → Fan → Mavzu) yuqori tark etishga olib keladi. 2-4 qadamlar bitta manzil ekrani bilan birlashtirilishi mumkin. |
| U2 | **1-qadamda orqaga navigatsiya yo'q** | `OrderForm.jsx:193` | Header `onBack` 1-qadamda `navigate(-1)` chaqiradi, bu navigatsiya tarixiga qarab noto'g'ri sahifaga olib ketishi mumkin. |

### 🟠 YUQORI XAVF (HIGH)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| U3 | **Buyurtma berishdan oldin tasdiqlash yo'q** | `OrderForm.jsx` | "Buyurtma berish" tugmasi darhol jo'natadi. Tolangan buyurtma uchun "Ishonchingiz komilmi?" dialogi yo'q. |
| U4 | **Tasodifiy chek yuklashni bekor qilish yo'q** | `OrderDetail.jsx` | Chek yuklangandan keyin, 2 daqiqalik oynada bekor qilish yoki almashtirish usuli yo'q. |
| U5 | **Sharh modali yopilganda tiklanmaydi** | `OrderDetail.jsx:158-190` | Foydalanuvchi sharh modalini yopib qayta ochsa, oldingi holat saqlanadi. Tasodifiy ikki marta yuborishga olib kelishi mumkin. |
| U6 | **Geografik daraja narx tavsifi noaniq** | `OrderForm.jsx:374-396` | "Viloyat miqyosida sifat kafolati" va "Respublika miqyosida premium sifat" foydalanuvchi +60k/+110k evaziga nimaga ega bo'lishini aniq tushuntirmaydi. |

### 🟡 O'RTA XAVF (MEDIUM)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| U7 | **1-4 sinflarda Ingliz tili uchun fan ro'yxati yo'q** | `OrderForm.jsx:55-64` | "Ingliz tili" ro'yxatda bor, lekin til qo'shimcha tekshiruvi (`isEnglish`) kichik harflar mosligini tekshiradi. Katta-kichik harf muammosi. |
| U8 | **Pastki navigatsiya order-detail da ajralib turmaydi** | `BottomNav.jsx:56-57` | `isActive('/my-orders')` `/order-detail/123` ga mos kelmaydi, shuning uchun buyurtma tafsilotlarini ko'rishda hech qanday tab ajralib turmaydi. |
| U9 | **Admin panel uchun qorong'u rejim yo'q** | `admin/ | Admin panel faqat yorug'. Keng qo'llanilishiga qaramay, qorong'u rejim varianti yo'q. |

---

## 9. TELEGRAM BOT MUTAXASSISI

### Arxitektura
- `node-telegram-bot-api` webhook (afzal) yoki polling zaxirasi bilan
- Webhook har bir bot ishga tushirilganda tozalanadi va qayta o'rnatiladi
- Callback query asosidagi buyurtma oqimi (buyurtma uchun o'chirilgan, faqat ma'lumot/buyurtmalar ro'yxati uchun)

### 🔴 JUDA MUHIM (CRITICAL)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| T1 | **Botda hali to'liq buyurtma oqimi kodi bor** | `bot.js:340-618` | `data.startsWith('order_')`, `data.startsWith('subject_')`, `data.startsWith('grade_')`, `global.userStates` — barcha buyurtma oqimi kodi hali callback ishlovchilarida faol. "📚 Xizmatlar" tugmasi klaviaturalardan o'chirilgan, lekin `order_` callback_data prefiksi hali 428-qatorda qayta ishlanadi. Agar foydalanuvchi qandaydir usulda `order_1` ni ishga tushirsa (masalan, eski deep link orqali), oqim boshlanadi, lekin tugatishning usuli yo'q. |

### 🟠 YUQORI XAVF (HIGH)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| T2 | **Bot buyurtmasi promo/referral chegirmalarini qo'llamaydi** | `bot.js:569` | `createOrder` `service.price` ni to'g'ridan-to'g'ri `total_price` sifatida ishlatadi, til qo'shimchasi, geografik qo'shimcha, promo-kodlar va referral chegirmalarini e'tiborsiz qoldiradi. Buyurtma oqimi o'chirilgan bo'lsa-da, bu yashirin xato. |
| T3 | **Webhook yo'li bot tokenini URL da ishlatadi** | `bot.js:127` | `/webhook/${BOT_TOKEN}` — token webhook yo'lining qismi. Agar loglar URL larni qayta ishlasa, token ochiq qoladi. Telegram webhook tizimi buni talab qiladi, lekin bu hali ham xavf. |
| T4 | **`bot.on('message')` BARCHA xabarlarni qayta ishlaydi** | `bot.js:440-560` | Agar `global.userStates[telegramId]` mavjud bo'lsa, HAR QANDAY matn xabari qadam kiritishi sifatida qayta ishlanadi. Bu shuni anglatadiki, faol holatga ega foydalanuvchi oddiy xabar yuborsa, u state machine tomonidan iste'mol qilinadi. |
| T5 | **`buildPaymentText` "4 daqiqangiz bor" deydi** | `bot.js:115` | Haqiqiy taymer 2 daqiqa bo'lsa-da, qattiq kodlangan "4 minutes" matni. **Bu ishlab chiqarishdagi xato.** |

### 🟡 O'RTA XAVF (MEDIUM)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| T6 | **Bot buyruqlar ro'yxati ro'yxatdan o'tkazilmagan** | `bot.js` | `setMyCommands()` chaqiruvi yo'q. Bot menyusida mavjud buyruqlar ko'rsatilmaydi. |
| T7 | **Bot `chat_member` yangiliklarini qayta ishlamaydi** | `bot.js` | Agar foydalanuvchi talab qilinadigan kanallarga obuna bo'lsa va keyin obunani bekor qilsa, bot bilmaydi. |
| T8 | **`answerCallbackQuery` ishlovchi oxirida chaqiriladi** | `bot.js:437` | `bot.answerCallbackQuery(query.id)` callback ishlovchisining eng oxirida, barcha `if/return` bloklaridan keyin chaqiriladi. Bu shuni anglatadiki, allaqachon `return` qilgan ko'p ishlovchilar uchun callback hech qachon javob bermaydi (tugmadagi yuklanish aylanishi qoladi). |

---

## 10. API DIZAYN MUTAXASSISI

### Umumiy ko'rinish
- REST API, versiyalash yo'q
- Ko'pchilik endpointlarda sahifalash yo'q
- HATEOAS yoki tutarli javob formati yo'q

### 🔴 JUDA MUHIM (CRITICAL)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| A1 | **Xato javob formati tutarsiz** | `index.js` | Ba'zi xatolar `{ error: 'xabar' }` qaytaradi, boshqalari `{ success: false, error: 'xabar' }`. HTTP holat kodlari tutarsiz. |
| A2 | **`PUT /api/settings` ixtiyoriy kalitlarni qabul qiladi** | `index.js:414-419` | Saxifa tekshiruvi yo'q. Har qanday kalit-qiymat juftligi sozlamalarga yozilishi mumkin. |

### 🟠 YUQORI XAVF (HIGH)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| A3 | **API versiyalash yo'q** | Barcha marshrutlar | Bugun `/api/orders`, ertaga buziluvchi o'zgarishlar. `/api/v1/orders` ishlatilishi kerak. |
| A4 | **`POST /api/orders` to'liq buyurtmani qaytarmaydi** | `index.js:254` | Buyurtmani `service_name`, `username` va boshqalar bilan qo'shilmagan holda qaytaradi. Klient boshqa GET so'rovi kerak. |
| A5 | **`GET /api/orders` tutarsiz hisob parametrlarini ishlatadi** | `index.js:180-183` | Hisob so'rovi LIMIT/OFFSET ni olib tashlash uchun `params.slice(0, params.length - 2)` ishlatadi, lekin bu zaif. Agar so'rov tuzilishi o'zgarsa, slice buziladi. |
| A6 | **`Content-Type` tekshiruvi yo'q** | `index.js` | JSON endpointlari uchun har qanday kontent turini qabul qiladi. `application/json` majburiy qilinishi kerak. |

---

## 11. UNUMDORLIK MUTAXASSISI

### 🔴 JUDA MUHIM (CRITICAL)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| PR1 | **Buyurtma ro'yxatida N+1 so'rov** | `index.js:175-177` | Ro'yxatdagi har bir buyurtma uchun `order.images = await queryAll(...)` alohida so'rov jo'natadi. 20 buyurtma = sahifa yuklanishi uchun 20 ta qo'shimcha so'rov. Bu juda sekin. |
| PR2 | **Statistika endpointi 10+ so'rov jo'natadi** | `index.js:429-456` | `GET /api/stats` ~10 ta alohida `queryOne` chaqiruvini bajarg'uzardi. Bitta so'rovda yoki materiallashtirilgan ko'rinishda bo'lishi kerak. |

### 🟠 YUQORI XAVF (HIGH)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| PR3 | **Javob keshlash yo'q** | `index.js` | 27-qatordagi `cached()` yordamchi funksiyasi aniqlangan, lekin hech qachon ishlatilmagan. Har bir API chaqiruvi ma'lumotlar bazasiga murojaat qiladi. |
| PR4 | **Admin panel barcha ma'lumotlarni oldindan yuklaydi** | `admin/src/pages/Users.jsx` | `GET /api/users` sahifalashsiz BARCHA foydalanuvchilarni qaytaradi. Minglab foydalanuvchi bilan bu sekin bo'ladi. |
| PR5 | **Ulanishlar havzasi (connection pooling) yo'q** | `database.js` | Turso klienti alohida ulanishlar yaratadi. Pooling sozlanmagan. |
| PR6 | **Broadcast xabarlarni ketma-ket yuboradi** | `index.js:462-470` | Xabarlar `for` tsiklida `await` bilan bittadan-bittadan yuboriladi. 30 tadan guruhlab `Promise.allSettled` bilan yuborilishi kerak. |

### 🟡 O'RTA XAVF (MEDIUM)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| PR7 | **Statik aktivlar keshlash sarlavhalari yo'q** | `index.js:406-407` | `express.static` `maxAge` optsiz. Client/admin paketlari har tashrifda qayta yuklanadi. |
| PR8 | **Home.jsx da katta inline SVG** | `Home.jsx` | Bir nechta inline SVG va murakkab CSS animatsiyalari. Boshlang'ich tahlil vaqtini kamaytirish uchun ajratilishi mumkin. |

---

## 12. KOD SIFATI VA SAQLANISHI MUTAXASSISI

### 🔴 JUDA MUHIM (CRITICAL)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| Q1 | **Nol testlar** | Butun loyiha | Test fayllari yo'q, test tizimi sozlanmagan, `package.json` da test skriptlari yo'q. Hech qanday xususiyat uchun avtomatik tasdiqlash yo'q. |
| Q2 | **ESLint/Prettier konfiguratsiyasi yo'q** | Loyiha ildizi | `.eslintrc`, `.prettierrc` yo'q. Kod uslubi tutarsiz (aralash tirnoqlar, nuqtali vergullar, identifikatsiya). |
| Q3 | **O'lik kod: bot buyurtma oqimi** | `bot.js:340-618` | ~280 qator o'lik kod (bot buyurtma). Agar bot orqali buyurtma doimiy ravishda o'chirilgan bo'lsa, bu o'chirilishi kerak. |

### 🟠 YUQORI XAVF (HIGH)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| Q4 | **Hamma joyda sirli raqamlar (magic numbers)** | `index.js`, `bot.js`, `OrderForm.jsx` | `50000`, `60000`, `110000`, `2 * 60 * 1000`, `10 * 1024 * 1024` — barchasi tushuntirilmagan. Nomi bor konstantalar bo'lishi kerak. |
| Q5 | **TypeScript yo'q** | Barcha fayllar | Butun kod bazasi oddiy JavaScript. Tur xavfsizligi yo'q. Noto'g'ri turlarni o'tkazish, xususiyatlarni o'tkazib yuborish yoki shartnomalarni buzish oson. |
| Q6 | **Yirik monolit fayllar** | `index.js:864`, `bot.js:721`, `OrderForm.jsx:658` | Fayllar juda katta. Marshrut modullari, komponentlar va yordamchilarga bo'lish kerak. |
| Q7 | **Tutarsiz nomlash** | Turli joylar | `telegram_id` vs `user_id` vs `order_id` — ba'zan ID lar model PK, ba'zan Telegram ID sifatida ishlatiladi. Bu chalkashlik yaratadi. |
| Q8 | **Qattiq kodlangan URL lar va qiymatlar** | `bot.js:263`, `OrderForm.jsx` | `'https://metodikish.fly.dev/'` botda qattiq kodlangan. Sozlamada bo'lishi kerak. |

### 🟡 O'RTA XAVF (MEDIUM)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| Q9 | **JSDoc yoki tur annotatsiyalari yo'q** | Barcha fayllar | Funksiyalar parametr turi hujjatlanmagan. |
| Q10 | **Tutarsiz xato qayta ishlash** | `index.js` | Ba'zi ishlovchilar try/catch qiladi va 500 qaytaradi, boshqalari xatolarga yo'l qo'yadi. Ba'zilari `{ error: err.message }`, boshqalari `{ success: false }` qaytaradi. |
| Q11 | **Client `api/api.js` mavjud emas** | `client/src/` | Dastlabki tadqiqotda ta'kidlanganiga qaramay, API moduli mavjud emas. Har sahifa o'z axios instantzasini yaratadi yoki xom axios ishlatadi. |

---

## 13. BIZNES MANTIQ MUTAXASSISI

### Tasdiqlangan biznes qoidalari
| Qoida | Holat | Eslatma |
|-------|-------|--------|
| Til qo'shimchasi (10 ta holat) | ✅ To'g'ri | Barcha 10 ta holat specsiga mos |
| Geografik narx (3 daraja) | ✅ To'g'ri | maktab=+0, viloyat=+60k, respublika=+110k |
| To'lov taymeri 2 daqiqa | ✅ Server tomoni | Bot to'g'ri bajaradi. Klient countdown faqat ko'rsatish uchun. |
| Promo saqlangan→ishlatilgan tsikli | ✅ To'g'ri | TOCTOU tuzatilishi `used_count + reserved_count` bilan |
| Referral tizimi (to'liq tsikl) | ✅ To'g'ri | Deep link → referred_by → tasdiqlashda balans → buyurtmada ishlatish → rad etishda qaytarish |
| Bot buyurtma o'chirilgan | ✅ Tugma o'chirilgan | Lekin kod o'lik, o'chirilmagan |

### 🔴 JUDA MUHIM (CRITICAL)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| B1 | **Minimal buyurtma narxi tekshiruvi yo'q** | `index.js:246` | Chegirmalardan keyin `totalPrice` 0 yoki manfiy bo'lishi mumkin. Buni oldini oladigan biznes qoidasi yo'q. |
| B2 | **Referral o'zini referral qilishi mumkin** | `bot.js:220` | Tekshiruv mavjud (`referrerTelegramId !== msg.from.id`), lekin faqat bot oqimida. MiniApp referral havolalarini umuman qayta ishlamaydi — foydalanuvchilar bot havolalarini ishlatishi kerak. |
| B3 | **Promo-kod tekshirish endpointi saqlamaydi** | `index.js:505-527` | Tekshirish holatsiz. Haqiqiy saqlash buyurtma yaratish paytida sodir bo'ladi. Tekshirish va yaratish orasida promo-kod limiti boshqa foydalanuvchi tomonidan tugashi mumkin. |

### 🟠 YUQORI XAVF (HIGH)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| B4 | **"Allaqachon bu xizmatni buyurtma qilgan" tekshiruvi yo'q** | `index.js:231` | Foydalanuvchi bir xil xizmatni cheksiz marta buyurtma qilishi mumkin. Biznes qoidasi "har bir o'qituvchiga 1 hujjat kerak" deydi, lekin buni bajarish yo'q. |
| B5 | **Referral mukofoti o'smaydi** | `index.js:365-369` | Buyurtma hajmidan qat'i nazar tekshilgan mukofot. 250k buyurtma va 400k buyurtma (til qo'shimchasi bilan) bir xil referral mukofotini beradi. |
| B6 | **Promo chegirama qo'shimchalarga ham qo'llaniladi** | `index.js:236` | `basePrice` til + geografik qo'shimchalarni o'z ichiga oladi. Promo foiz to'liq miqdorga, faqat asosiy xizmat narxiga emas, qo'llaniladi. Bu ataylab bo'lishi mumkin, lekin aniq bo'lishi kerak. |
| B7 | **Geografik tekshirish yo'q** | `OrderForm.jsx` | Foydalanuvchi "Toshkent viloyati" ni tanlashi, lekin har qanday tuman matnini kiritishi mumkin. Tanlangan hududda tuman haqiqatan mavjudligini tekshirish yo'q. |

---

## 14. TESTLASH MUTAXASSISI

### Hozirgi holat: **NOL TESTLAR**

| Test turi | Qamrab olish | Muhimlik |
|-----------|-------------|----------|
| Unit testlar | 0% | — |
| Integratsiya testlari | 0% | — |
| E2E testlari | 0% | — |
| API testlari | 0% | — |
| To'lov oqimi testlari | 0% | — |
| Race condition testlari | 0% | — |

### Tavsiya etilgan test rejasini

**1-bosqich: Asosiy yo'l (1-muhimlik)**
1. `POST /api/orders` — turli qo'shimcha/chegirma kombinatsiyalari bilan buyurtma yaratish
2. `POST /api/orders/:id/receipt` — taymer tekshiruvi bilan chek yuklash
3. `PUT /api/orders/:id/confirm-payment` — to'lov tasdiqlash + referral hisobga qo'shish
4. `PUT /api/orders/:id/reject-payment` — rad etish + qaytarish
5. `POST /api/promo-codes/validate` — parallel kirish ostida promo tekshirish

**2-bosqich: Biznes mantiq (2-muhimlik)**
6. `getLanguageSurcharge()` — barcha 10 ta test holati
7. `getSubjects()` — barcha sinf diapazonlari
8. Ko'p chegirma bilan narx hisobi
9. Referral havolasi deep link tahlili
10. Avtomatik bekor qilish taymeri xulqi

**3-bosqich: Integratsiya (3-muhimlik)**
11. To'liq buyurtma tsikli (yaratish → to'lov → tasdiqlash → tayyor → yuborish)
12. Bot webhook qayta ishlash
13. Admin CRUD operatsiyalari

### Tavsiya etilgan vositalar:
- **Jest** — unit/integratsiya testlari uchun
- **Supertest** — API testlari uchun
- **MSW** (Mock Service Worker) — klient tomoni API soxtalashtirish uchun
- **k6** — promo-kod race condition yuk sinovlari uchun

---

## 15. KENGA YETILGANLIK (SCALABILITY) MUTAXASSISI

### Hozirgi sig'im taxmini
| Ko'rsatkich | Hozirgi | Chegarasi |
|------------|---------|-----------|
| Parallel foydalanuvchilar | ~50 | 256MB RAM, yagona jarayon |
| Buyurtmalar/kun | ~50-100 | Bot polling + qo'lda admin |
| Ma'lumotlar bazasi hajmi | Cheksiz | Turso bepul daraja: 500MB |
| Fayl saqlash | Cheksiz | Fly.io volume: hajm chegarasi yo'q |

### 🔴 JUDA MUHIM (CRITICAL)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| SC1 | **Xotiradagi holat qayta ishga tushgandan keyin saqlanmaydi** | `bot.js:106-107` | `global.paymentTimers`, `global.userStates`, `global.receiptStates`, `global.paymentMessages` — qayta ishga tushganda hammasi yo'qoladi. Tranzaksiya o'rtasida server qayta ishga tushsa, foydalanuvchilar buzilgan holatda qoladi. |
| SC2 | **Yagona jarayon, klasterlashtirish yo'q** | `server/index.js` | Node.js bitta ichki ipda ishlaydi. Bitta bloklangan event loop (masalan, katta fayl qayta ishlash) barcha so'rovlarni bloklaydi. |

### 🟠 YUQORI XAVF (HIGH)

| # | Muammo | Joylashuv | Tushuntirish |
|---|--------|-----------|-------------|
| SC3 | **Ulanishlar cheklovi yo'q** | `server/index.js` | Parallel ulanishlar uchun cheklov yo'q. Trafik to'satda oshishi fayl deskriptorlarini tugatishi mumkin. |
| SC4 | **Bot polling intervali juda tez bo'lishi mumkin** | `bot.js:161` | Polling uchun `interval: 2000` (2 soniya). Telegram da ko'p botlar bilan, bu tezlik cheklovlariga urilishi mumkin. |
| SC5 | **Ma'lumotlar bazasi ulanishini qayta urinish yo'q** | `database.js` | Agar Turso ulanishi uzilsa, server qayta urinishsiz buziladi. |

### Kelajak uchun kengaytirish tavsiyalari:
1. **Redis ga o'ting** xotiradagi holat uchun (seanslar, taymerlar, keshlar)
2. **Worker jarayonlarini qo'shing** og'ir operatsiyalar uchun (rasm qayta ishlash, broadcast)
3. **Ma'lumotlar bazasi ulanishlar havzasini** `@libsql/client` pool rejimi orqali amalga oshiring
4. **Navbat tizimini qo'shing** (Bull/BullMQ) buyurtma qayta ishlash uchun
5. **Turso read replica larini** ko'rib chiqing o'qish-yo'naltirilgan admin so'rovlari uchun

---

## 📊 UMUMIY XULOSA

### Baholash jadvali

| Kategoriya | Baho | Daraja |
|------------|------|--------|
| Xavfsizlik | 2/10 | 🔴 JUDA MUHIM |
| Backend arxitekturasi | 5/10 | 🟡 O'RTA |
| Ma'lumotlar bazasi dizayni | 4/10 | 🟡 O'RTA |
| Frontend sifati | 6/10 | 🟡 O'RTA |
| DevOps | 5/10 | 🟡 O'RTA |
| To'lov xavfsizligi | 3/10 | 🔴 JUDA MUHIM |
| Parallellik | 4/10 | 🟡 O'RTA |
| UX/UI | 7/10 | 🟢 YAXSHI |
| Telegram Bot | 6/10 | 🟡 O'RTA |
| API dizayni | 4/10 | 🟡 O'RTA |
| Unumdorlik | 3/10 | 🔴 JUDA MUHIM |
| Kod sifati | 3/10 | 🔴 JUDA MUHIM |
| Biznes mantiq | 6/10 | 🟡 O'RTA |
| Testlash | 0/10 | 🔴 JUDA MUHIM |
| Kengaytirilganlik | 3/10 | 🔴 JUDA MUHIM |

### Umumiy baho: **4.1/10** — Haqiqiy to'lovlardan oldin kuchli mustahkamlash talab qilinadi.

---

## 🎯 ENGIN MUHIM 10 TA TUZATISH

| # | Muammo | Mutaxassis | Harakat | Ta'sir |
|---|--------|-----------|---------|--------|
| 1 | Admin API autentifikatsiyasi qo'shish | Xavfsizlik | 2 soat | Butun tizim buzilishining oldini oladi |
| 2 | Telegram WebApp initData tekshirish | Xavfsizlik | 3 soat | Identifikatsiya soxtalashtirishning oldini oladi |
| 3 | totalPrice ni minimum 0 ga cheklash | Moliyaviy | 15 daqiqa | Manfiy narxli buyurtmalarning oldini oladi |
| 4 | `validatePromo` da `basePrice` aniqlanmaganini tuzatish | Frontend | 5 daqiqa | Client da buzilgan promo chegirmani tuzatadi |
| 5 | Botda "4 daqiqangiz bor" → "2 daqiqangiz bor" tuzatish | Bot | 5 daqiqa | Yolgon to'lov matnini tuzatadi |
| 6 | confirm-payment ga `WHERE status = 'pending_confirmation'` qo'shish | Parallellik | 10 daqiqa | Ikki marta tasdiqlashning oldini oladi |
| 7 | `promo_code_usage` ga noyob cheklov qo'shish | Ma'lumotlar bazasi | 10 daqiqa | Promo ikki marta ishlatishning oldini oladi |
| 8 | Sog'liqni saqlash tekshiruvi endpointi qo'shish | DevOps | 15 daqiqa | Fly.io avtomatik qayta ishga tushirishni yoqadi |
| 9 | Tezlik cheklovi qo'shish | Xavfsizlik | 1 soat | suiiste'mollik va DDoS ning oldini oladi |
| 10 | Bot buyurtma o'lik kodini o'chirish | Kod sifati | 30 daqiqa | chalkashlik va hujum yuzasini kamaytiradi |

---

*Hisobot 15 ta mutaxassis tekshiruv guruhi tomonidan tayyorlangan. Har bir topilma qayta tiklash uchun fayl yo'li va qator raqamini o'z ichiga oladi.*
