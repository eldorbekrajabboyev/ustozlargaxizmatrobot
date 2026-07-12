# Metodikish

Telegram Bot & MiniApp for selling educational materials (Metodik Qo'llanma & Metodik Tavsiya).

## Loyiha tuzilishi

```
metodikish/
├── server/          # Backend API (Express + SQLite)
├── client/          # MiniApp Frontend (React + Vite)
├── admin/           # Admin Panel (React + Vite)
├── bot/             # Telegram Bot
└── data/            # Database files
```

## O'rnatish

1. Barcha papkalar uchun dependencies o'rnating:
```bash
npm run install:all
```

2. Server .env faylini yarating:
```bash
cp server/.env.example server/.env
```

3. Bot tokenini kiriting:
```
BOT_TOKEN=your_telegram_bot_token
```

## Ishga tushirish

Terminal 1 - Backend:
```bash
npm run dev:server
```

Terminal 2 - Bot:
```bash
npm run dev:bot
```

Terminal 3 - MiniApp:
```bash
npm run dev:client
```

Terminal 4 - Admin Panel:
```bash
npm run dev:admin
```

## Deploy

### Render.com (Tavsiya etiladi)

1. GitHub ga yuklang
2. Render.com da yangi Web Service yarating
3. Build command: `cd server && npm install && cd ../client && npm install && cd ../admin && npm install && npm run build:client && npm run build:admin`
4. Start command: `cd server && npm start`
5. Environment variables qo'shing:
   - `BOT_TOKEN`: Telegram bot token
   - `PORT`: 3000

### Botni ulash

1. @BotFather ga /newproduct yuboring
2. Bot tokenini oling
3. Server .env fayliga kiriting
4. Botni ishga tushiring

### MiniApp ni ulash

1. @BotFather ga /newapp buyrug'ini yuboring
2. Web App URL ni kiriting: `https://your-domain.com`
3. Botni qayta ishga tushiring

## API Endpoints

### Foydalanuvchilar
- `GET /api/users` - Barcha foydalanuvchilar
- `POST /api/users` - Foydalanuvchi yaratish/tizimga kirish

### Xizmatlar
- `GET /api/services` - Barcha xizmatlar
- `POST /api/services` - Yangi xizmat
- `PUT /api/services/:id` - Xizmatni tahrirlash
- `DELETE /api/services/:id` - Xizmatni o'chirish

### Buyurtmalar
- `GET /api/orders` - Barcha buyurtmalar (filter: status, page, limit)
- `GET /api/orders/:id` - Buyurtma tafsilotlari
- `POST /api/orders` - Yangi buyurtma
- `PUT /api/orders/:id` - Buyurtmani yangilash
- `POST /api/orders/:id/receipt` - To'lov cheki yuklash
- `POST /api/orders/:id/images` - Rasmlar yuklash
- `POST /api/orders/:id/document` - Hujjat yuklash

### Statistika
- `GET /api/stats` - Dashboard statistikasi

### Sozlamalar
- `GET /api/settings` - Sozlamalar
- `PUT /api/settings` - Sozlamalarni yangilash
