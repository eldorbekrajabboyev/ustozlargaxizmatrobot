# 🏥 FULL PROFESSIONAL AUDIT REPORT — Metodikish
### 15-Expert Code Review | Generated: 2026-07-18

---

## TABLE OF CONTENTS
1. [Security Expert](#1-security-expert)
2. [Backend/Node.js Expert](#2-backendnodejs-expert)
3. [Database Expert](#3-database-expert)
4. [Frontend/React Expert](#4-frontendreact-expert)
5. [DevOps/Infrastructure Expert](#5-devopsinfrastructure-expert)
6. [Payment & Financial Expert](#6-payment--financial-expert)
7. [Concurrency & Race Condition Expert](#7-concurrency--race-condition-expert)
8. [UX/UI Expert](#8-uxui-expert)
9. [Telegram Bot Expert](#9-telegram-bot-expert)
10. [API Design Expert](#10-api-design-expert)
11. [Performance Expert](#11-performance-expert)
12. [Code Quality & Maintainability Expert](#12-code-quality--maintainability-expert)
13. [Business Logic Expert](#13-business-logic-expert)
14. [Testing Expert](#14-testing-expert)
15. [Scalability Expert](#15-scalability-expert)

---

## 1. SECURITY EXPERT

### 🔴 CRITICAL

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| S1 | **No authentication on admin API** | `server/index.js` (all routes) | Every `/api/*` endpoint is publicly accessible. Anyone can call `PUT /api/orders/:id/confirm-payment`, `DELETE /api/promo-codes/:id`, `POST /api/broadcast`, `PUT /api/settings` — full admin control with zero auth. |
| S2 | **No Telegram WebApp initData validation** | `client/src/App.jsx:36` | The MiniApp trusts `tg.initDataUnsafe.user` completely. Any user can spoof `telegram_id` by opening the MiniApp outside Telegram or modifying JS. No HMAC/signature verification against `BOT_TOKEN`. |
| S3 | **Bot token exposed in settings endpoint** | `GET /api/settings` → returns `bot_token` | The admin settings endpoint returns `bot_token` in plaintext to any caller. This is the single most dangerous credential in the system. |
| S4 | **No CORS restriction** | `server/index.js:24` | `app.use(cors())` with no origin restriction. Any website can make authenticated requests to the API. Should whitelist `https://metodikish.fly.dev` only. |

### 🟠 HIGH

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| S5 | **SQL injection potential in `PUT /api/settings`** | `server/index.js:416` | `for (const [key, value] of Object.entries(req.body))` — iterates arbitrary keys from request body. An attacker can insert any key into the settings table. No whitelist. |
| S6 | **SQL injection via string interpolation in `nowUZ()`** | `server/index.js` multiple locations | `'${nowUZ()}'` is interpolated directly into SQL strings (e.g., `receipt_uploaded_at = '${nowUZ()}'`). While `nowUZ()` returns a formatted date and isn't user-controlled, this pattern is dangerous. |
| S7 | **No rate limiting** | All API endpoints | No rate limiting anywhere. A bot/attacker can brute-force promo codes, create unlimited orders, or DDoS the broadcast endpoint. |
| S8 | **File upload without sanitization** | `server/index.js:90-103` | `fileFilter` allows `ext || mime` (logical OR instead of AND), meaning any file with a valid extension OR valid MIME type passes. Attacker can upload `.exe` with `.jpg` extension. |
| S9 | **Admin panel has zero authentication** | `admin/` (entire app) | Anyone who discovers `/admin/` can access the admin panel, view all user data, modify settings, delete orders, and broadcast messages. |
| S10 | **Telegram WebApp URL hardcoded** | `bot.js:263,401,460,475` | `web_app: { url: 'https://metodikish.fly.dev/' }` hardcoded everywhere. If domain changes, all bot keyboards break. Should read from settings. |

### 🟡 MEDIUM

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| S11 | **No input sanitization on user content** | `server/index.js` POST routes | `full_name`, `school`, `subject`, `topic`, `admin_note` — all stored raw. XSS risk if displayed in admin panel without escaping (React helps for client, but admin HTML may not). |
| S12 | **Bot `getChatMember` can leak channel info** | `bot.js:41-54` | `checkSubscription` returns `false` on any error, including rate limits. A failed check blocks the user entirely. |
| S13 | **Promo code validation timing attack** | `server/index.js:505-527` | Different error messages for "invalid code", "already used", and "limit reached" allows enumeration attacks to discover valid promo codes. |
| S14 | **No HTTPS enforcement in local dev** | Server listens on HTTP | While Fly.io has `force_https = true`, local development runs HTTP. Bot webhook URLs should enforce HTTPS. |

### Recommendations (Priority Order):
1. **Add API key auth** for admin endpoints (`Authorization: Bearer <ADMIN_KEY>`)
2. **Validate `initData`** using HMAC-SHA256 with bot token on every MiniApp request
3. **Never expose `bot_token`** via settings API — mask it
4. **Whitelist CORS origins** to `https://metodikish.fly.dev`
5. **Add rate limiting** (e.g., `express-rate-limit`) on all public endpoints
6. **Whitelist allowed settings keys** in `PUT /api/settings`

---

## 2. BACKEND/NODE.JS EXPERT

### Architecture
- Single `index.js` (864 lines) serves as both API server and static file server
- No separation of concerns — routes, business logic, and database access are interleaved
- No middleware for auth, validation, or error handling
- `bot.js` (721 lines) is well-structured with proper webhook/polling fallback

### 🔴 CRITICAL

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| B1 | **`require('./bot')` inside request handlers** | `server/index.js:368,387,423,444` | `const bot = require('./bot').getBotInstance()` is called inside every request handler that sends Telegram messages. While Node caches modules, this is a code smell and creates a circular dependency pattern (`index.js` requires `bot.js`, `bot.js` requires `database.js`). |
| B2 | **No graceful shutdown** | `server/index.js` | No `SIGTERM`/`SIGINT` handler. On Fly.io deploy, the old process gets killed mid-request. In-flight orders may lose state. |
| B3 | **Error handler only logs** | `server/index.js:457-458` | `process.on('uncaughtException')` and `unhandledRejection` only `console.error`. Server continues running in a potentially corrupted state. |

### 🟠 HIGH

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| B4 | **`deleteOrderImages` defined in both files** | `bot.js:13-21` + `index.js:35-42` | Identical function duplicated. If one is updated, the other may become stale. Should be shared utility. |
| B5 | **`nowUZ()` defined in both files** | `bot.js:9-11` + `index.js:12-14` | Same duplication issue. |
| B6 | **No request body size limit** | `server/index.js` | `express.json()` with no `limit` option (default 100KB). Should explicitly set `limit: '1mb'` for safety. |
| B7 | **In-memory cache never expires entries** | `server/index.js:27-33` | The `cache` Map only invalidates by TTL, never by key count. Under sustained traffic, this leaks memory. |
| B8 | **`bot.on('photo')` has race condition** | `bot.js:621-692` | Receipt photo handler doesn't hold a lock. Two rapid photos could both update the same order. |
| B9 | **Missing `bot.onText(/\/start/)` ordering** | `bot.js:213` | The `/start` handler regex `/\/start(?:\s+(.+))?/` matches before the catch-all `bot.on('message')`. But if a user sends `/start` with no param after already registering, the catch-all `bot.on('message')` at line 440 also fires — both `onText` and `on('message')` trigger. |

### Recommendations:
1. Extract shared utilities (`nowUZ`, `deleteOrderImages`) into `server/utils.js`
2. Add graceful shutdown handler
3. Add global error recovery middleware
4. Add request body size limit
5. Extract route handlers into `server/routes/` directory

---

## 3. DATABASE EXPERT

### Schema Summary
```
users, services, orders, order_images, payment_cards, settings,
reviews, promo_codes, promo_code_usage
```

### 🔴 CRITICAL

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| D1 | **No foreign key enforcement** | Turso/libSQL | SQLite-based databases don't enforce FK constraints by default. `PRAGMA foreign_keys` is never set. Orphaned records possible. |
| D2 | **`settings` table uses `INSERT OR IGNORE` for init** | `database.js:101-110` | Settings initialization uses `INSERT OR IGNORE` but `referral_discount_amount` and `bot_username` are inserted OUTSIDE the count check (lines 108-109). These run on every startup, not just first. Not harmful due to `OR IGNORE`, but sloppy. |
| D3 | **ALTER TABLE with empty catch** | `database.js:112-123` | All `ALTER TABLE` statements catch errors silently. If a column already exists, the error is swallowed. If the ALTER fails for another reason (disk full, permissions), it's also silently ignored. |

### 🟠 HIGH

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| D4 | **No indexes beyond primary keys** | `database.js` | Queries like `WHERE status = 'pending_payment'`, `WHERE user_id = ?`, `WHERE promo_code_id = ?` have no indexes. Performance degrades with order count. |
| D5 | **Channels stored as pipe-delimited string** | `settings.channels` | `name|link|updated_at|name|link|updated_at` — anti-pattern. Should be a separate `channels` table. Parsing is error-prone and makes queries impossible. |
| D6 | **No `updated_at` auto-update** | All tables | `updated_at` is set manually in code. Easy to forget. Should use a trigger or middleware. |
| D7 | **`promo_code_usage` has no unique constraint** | `database.js` | No `UNIQUE(promo_code_id, user_id)` constraint. The code manually checks for duplicates, but race conditions could still create duplicates. |
| D8 | **`orders` table is growing without bounds** | All orders | Rejected/cancelled orders are kept forever. No archival strategy. |

### 🟡 MEDIUM

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| D9 | **Timestamp timezone handling** | `database.js` | `datetime('now', '+5 hours')` hardcodes UTC+5. If deployment region changes, or DST rules change, this breaks. |
| D10 | **No migration system** | `database.js` | Schema changes rely on `ALTER TABLE ... ADD COLUMN` with catch-all. No versioning, no rollback. |
| D11 | **`referred_by` is `INTEGER` FK but no constraint** | `database.js` | `ALTER TABLE users ADD COLUMN referred_by INTEGER` — no FOREIGN KEY. Can reference non-existent user. |

### Recommended Indexes:
```sql
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_promo_usage_code_user ON promo_code_usage(promo_code_id, user_id);
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_referred_by ON users(referred_by);
```

---

## 4. FRONTEND/REACT EXPERT

### Architecture
- React 18 + React Router 6 + Tailwind CSS + Axios
- No state management (pure useState/useEffect)
- No lazy loading / code splitting
- No error boundaries

### 🔴 CRITICAL

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| F1 | **No error boundary anywhere** | `client/src/` | A single runtime error in any component crashes the entire MiniApp with a blank white screen. No recovery. |
| F2 | **No authentication check** | `client/src/App.jsx` | User is set from `tg.initDataUnsafe.user` — no validation. If data is missing/invalid, the app silently proceeds with `user = null`, causing API calls to fail cryptically. |
| F3 | **`basePrice` used before defined in `validatePromo`** | `OrderForm.jsx:168` | `const disc = Math.round(basePrice * res.data.discount_percent / 100)` — `basePrice` is computed later at line 224. In the current scope, it's `undefined`. The promo discount calculation will always be `NaN`. **This is a production bug.** |

### 🟠 HIGH

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| F4 | **All images are never released from memory** | `OrderForm.jsx:143-153` | `URL.createObjectURL(img)` creates object URLs that are never revoked (`URL.revokeObjectURL`). Memory leak when user adds/removes images repeatedly. |
| F5 | **No loading states for mutations** | `OrderForm.jsx` | `handleSubmit` has `submitting` state but `validatePromo` only sets `promoChecking` without proper UI feedback. |
| F6 | **Countdown timer timezone conversion is fragile** | `OrderDetail.jsx:33-42` | `parseToUTCTimestamp` manually parses dates and subtracts 5 hours. If server or client timezone changes, the countdown breaks. Should use ISO 8601 with timezone offset. |
| F7 | **Polling interval not cleared on unmount race** | `OrderDetail.jsx:129-139` | The `useEffect` cleanup may not properly clear the interval if the component unmounts during a fetch. |
| F8 | **Home page has hardcoded stats** | `Home.jsx:198-207` | `1 850+`, `98%`, `4 yil`, `12h` are all hardcoded marketing numbers, not fetched from database. If stats change, page is misleading. |
| F9 | **No `React.memo` or memoization** | All components | Every parent re-render causes all children to re-render. For a small app this is acceptable but will degrade as features grow. |

### 🟡 MEDIUM

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| F10 | **Inline styles mixed with Tailwind** | `Home.jsx` extensively | Heavy use of `style={{}}` alongside Tailwind classes. Creates inconsistency and makes theming harder. |
| F11 | **No loading skeleton** | All pages | All loading states show a centered spinner. Better UX would be skeleton placeholders. |
| F12 | **`copyToClipboard` duplicated** | `OrderDetail.jsx:7-16` + `Profile.jsx:6-17` | Same clipboard utility function defined twice. |
| F13 | **CSS animations in `<style>` tags** | `Home.jsx:155-169`, `OrderDetail.jsx:348-351` | Inline `<style>` tags in components are not scoped and leak globally. |

---

## 5. DEVOPS/INFRASTRUCTURE EXPERT

### Deployment Stack
- **Platform:** Fly.io (shared-cpu-1x, 256MB RAM, ams region)
- **Build:** Docker multi-stage (node:20-slim)
- **Database:** Turso (libSQL) with local SQLite fallback
- **Persistent storage:** Fly.io volume mount at `/app/uploads`

### 🔴 CRITICAL

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| O1 | **256MB RAM may be insufficient** | `fly.toml` | Node.js + React build + Express + Bot polling + image processing on 256MB is tight. OOM kills likely under moderate load. |
| O2 | **No health check endpoint** | `server/index.js` | Fly.io has no health check configured. Deadlocked or crashed processes won't be restarted. |
| O3 | **No database backup strategy** | Turso | No mention of Turso backup configuration. If the database is corrupted, there's no recovery plan. |

### 🟠 HIGH

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| O4 | **`auto_stop_machines = false`** | `fly.toml` | Machines never stop. Running 24/7 on shared-cpu-1x for a service that may have low nighttime traffic is wasteful. |
| O5 | **No build cache in Dockerfile** | `Dockerfile` | Every deploy rebuilds both client and admin from scratch. Should leverage Docker layer caching. |
| O6 | **No `.dockerignore`** | Project root | `node_modules`, `.git`, `uploads` are likely copied into the build context, slowing deploys. |
| O7 | **Volume mount at `/app/uploads`** | `fly.toml` | Persistent volume is correct for receipts/documents, but `uploads/images/` (user-uploaded order images) will persist across deploys while the app may have changed. Stale images accumulate. |
| O8 | **No logging infrastructure** | `server/index.js` | All logging is `console.log`/`console.error`. No structured logging (JSON), no log levels, no external log aggregation. |

### 🟡 MEDIUM

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| O9 | **No `.env.example` documentation** | Project root | `.env.example` exists but may not document all required vars. Missing vars silently break features. |
| O10 | **Single-region deployment** | `fly.toml` | Only `ams` region. Users in Uzbekistan will experience latency. Consider `ist` (Istanbul) or `nrt` (Tokyo) as closer alternatives. |
| O11 | **No CI/CD pipeline** | No `.github/workflows/` | Deploys are manual `fly deploy`. No automated tests, linting, or build verification before deploy. |

---

## 6. PAYMENT & FINANCIAL EXPERT

### Payment Flow
```
User creates order → 2min timer starts → User uploads receipt → Admin confirms/rejects → Document prepared → Sent
```

### 🔴 CRITICAL

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| P1 | **Client-side timer doesn't prevent receipt upload after expiry** | `OrderDetail.jsx:408-426` | Timer expires on client, but the upload button is only hidden via CSS state. The `handleReceiptUpload` function has no server-side timer check. Bot receipt handler (`bot.js:631-637`) DOES check server-side status, but the MiniApp HTTP endpoint (`index.js:288`) does NOT. An attacker can POST to `/api/orders/:id/receipt` directly after expiry. |
| P2 | **No payment verification** | `index.js:288` | Receipt upload changes status to `pending_confirmation` without any validation. No check for image quality, file size beyond the 10MB limit, or that the image is actually a receipt. Admin must manually verify everything. |
| P3 | **Total price can go negative** | `index.js:246` | `totalPrice = basePrice - validPromoDiscount - validReferralDiscount`. If promo discount (percentage) + referral discount exceeds base price, total becomes negative. A user could theoretically get paid to place an order. |

### 🟠 HIGH

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| P4 | **Promo discount calculated on pre-discount price** | `index.js:236` | `validPromoDiscount = Math.round(basePrice * promo.discount_percent / 100)` — this is correct, but the referral discount is a flat amount. If both are applied, referral is subtracted from already-reduced price. This means promo+referral combined could exceed 100% of base price. |
| P5 | **No transaction wrapping** | `index.js:231-255` | Order creation + promo reservation + referral deduction are separate DB calls. If any fails mid-way, the system is left in an inconsistent state (e.g., promo reserved but order not created). |
| P6 | **Referral reward uses `referral_discount_amount` from settings, not order creation time** | `index.js:365-369` | If admin changes `referral_discount_amount` between order creation and payment confirmation, the referrer gets a different reward than expected. |
| P7 | **No financial audit trail** | All payment operations | No separate `transactions` or `payment_log` table. Refund amounts, rewards, and discounts are computed on-the-fly. Impossible to audit financially. |

### 🟡 MEDIUM

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| P8 | **Promo discount rounding** | `index.js:236` | `Math.round` can result in off-by-one-so'm errors when summing across many orders. Not significant individually but compounds over thousands. |
| P9 | **No maximum order price cap** | `index.js:246` | `totalPrice` is passed directly from client. While the server recalculates, there's no sanity check. A manipulated `language_surcharge` or `geographic_surcharge` from client could inflate price. |

---

## 7. CONCURRENCY & RACE CONDITION EXPERT

### Implemented Safeguards
- ✅ Order code uniqueness via UUID suffix
- ✅ TOCTOU fix on receipt upload (`WHERE status = 'pending_payment'`)
- ✅ Promo reserved/used lifecycle
- ✅ `used_count + reserved_count` validation

### 🔴 CRITICAL

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| C1 | **Promo code double-use race condition** | `index.js:228-243` + `index.js:249-253` | Between checking "already used" and inserting reservation, another request can pass the same check. Two concurrent orders from the same user with same promo can both succeed. The `promo_code_usage` table has no unique constraint on `(promo_code_id, user_id)`. |
| C2 | **Referral balance double-spend** | `index.js:239-242` | Two concurrent orders from the same user both checking `referral_balance >= discountAmount` can both deduct. The `UPDATE users SET referral_balance = referral_balance - ?` is not atomic with the preceding SELECT. |

### 🟠 HIGH

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| C3 | **`confirm-payment` can be called multiple times** | `index.js:341-375` | No check if order is already `in_progress`. Double-confirming a payment credits the referrer twice and double-marks the promo as used. |
| C4 | **`reject-payment` doesn't check current status** | `index.js:377-402` | Rejecting an already-rejected or already-confirmed order still attempts to refund promo/referral. |
| C5 | **Bot `createOrder` has no idempotency** | `bot.js:563-618` | If the bot handler fires twice (e.g., webhook retry), two orders are created. |

### Recommendations:
1. Add `UNIQUE(promo_code_id, user_id)` constraint to `promo_code_usage`
2. Use `SELECT ... FOR UPDATE` pattern (or SQLite `BEGIN IMMEDIATE`) for balance checks
3. Add status checks in confirm/reject handlers (`WHERE status = 'pending_confirmation'`)
4. Use idempotency keys for order creation

---

## 8. UX/UI EXPERT

### Strengths
- ✅ Beautiful, polished Home page with animations and social proof
- ✅ Clear step-by-step order form with progress indicator
- ✅ Review system with star ratings
- ✅ Profile page with referral link and stats
- ✅ Payment countdown with copy-to-clipboard for card/amount

### 🔴 CRITICAL

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| U1 | **8-step order form is too many steps** | `OrderForm.jsx` | 8 sequential screens (F.I.Sh → Viloyat → Tuman → Maktab → Maktab turi → Sinf → Fan → Mavzu) creates high abandonment. Steps 2-4 could be combined into one address screen with dropdown + autocomplete. |
| U2 | **No back navigation from step 1** | `OrderForm.jsx:193` | The Header `onBack` calls `navigate(-1)` from step 1, which may go to the wrong page depending on navigation history. |

### 🟠 HIGH

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| U3 | **No confirmation before order submission** | `OrderForm.jsx` | The "Buyurtma berish" button immediately submits. No "Are you sure?" dialog for a paid order. |
| U4 | **No undo for accidental receipt upload** | `OrderDetail.jsx` | Once a receipt is uploaded, there's no way to cancel or replace it within the 2-minute window. |
| U5 | **Review modal doesn't reset on close** | `OrderDetail.jsx:158-190` | If user closes the review modal and reopens, previous state persists. Could lead to accidental double-submission. |
| U6 | **Geographic level pricing description is vague** | `OrderForm.jsx:374-396` | "Viloyat miqyosida sifat kafolati" and "Respublika miqyosida premium sifat" don't clearly explain what the user gets for +60k/+110k. |

### 🟡 MEDIUM

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| U7 | **No subject list for Ingliz tili in grades 1-4** | `OrderForm.jsx:55-64` | "Ingliz tili" IS in the list but the language surcharge check (`isEnglish`) looks for lowercase match. Case sensitivity issue. |
| U8 | **Bottom nav doesn't highlight when on order-detail** | `BottomNav.jsx:56-57` | `isActive('/my-orders')` doesn't match `/order-detail/123`, so no tab is highlighted when viewing order details. |
| U9 | **No dark mode for admin panel** | `admin/` | Admin panel is light-only. No dark mode option despite being used extensively. |

---

## 9. TELEGRAM BOT EXPERT

### Architecture
- `node-telegram-bot-api` with webhook (preferred) or polling fallback
- Webhook cleared and re-set on every bot start
- Callback query-based ordering flow (disabled for ordering, only used for info/orders list)

### 🔴 CRITICAL

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| T1 | **Bot still has full ordering flow code** | `bot.js:340-618` | `data.startsWith('order_')`, `data.startsWith('subject_')`, `data.startsWith('grade_')`, `global.userStates` — all the ordering flow code is still active in callback handlers. While "📚 Xizmatlar" button is removed from keyboards, the `order_` callback_data prefix is still handled at line 428. If a user somehow triggers `order_1` (e.g., via old deep link), the flow starts but there's no way to complete it since grade/subject callbacks are still handled. |

### 🟠 HIGH

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| T2 | **Bot ordering doesn't apply promo/referral discounts** | `bot.js:569` | `createOrder` uses `service.price` directly as `total_price`, ignoring language surcharge, geographic surcharge, promo codes, and referral discounts. Even though the ordering flow is disabled, this is a latent bug. |
| T3 | **Webhook path uses bot token in URL** | `bot.js:127` | `/webhook/${BOT_TOKEN}` — the token is part of the webhook path. If logs capture URLs, the token is exposed. Telegram's webhook system requires this, but it's still a risk. |
| T4 | **`bot.on('message')` handles ALL messages** | `bot.js:440-560` | If `global.userStates[telegramId]` exists, ANY text message is processed as a step input. This means if a user has an active state and sends a normal message, it's consumed by the state machine. |
| T5 | **`buildPaymentText` says "4 daqiqangiz bor"** | `bot.js:115` | Hardcoded "4 minutes" text while the actual timeout is 2 minutes. **This is a production bug.** |

### 🟡 MEDIUM

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| T6 | **No bot command list registered** | `bot.js` | No `setMyCommands()` call. Bot menu won't show available commands in Telegram. |
| T7 | **Bot doesn't handle `chat_member` updates** | `bot.js` | If a user subscribes to required channels and then unsubscribes, the bot doesn't know. |
| T8 | **`answerCallbackQuery` called at end of handler** | `bot.js:437` | `bot.answerCallbackQuery(query.id)` is called at the very end of the callback handler, after all the `if/return` blocks. This means for many handlers that already `return`, the callback is never answered (loading spinner on button persists). |

---

## 10. API DESIGN EXPERT

### Overview
- REST API, no versioning
- No pagination on most endpoints
- No HATEOAS or consistent response format

### 🔴 CRITICAL

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| A1 | **Inconsistent error response format** | `index.js` | Some errors return `{ error: 'message' }`, others return `{ success: false, error: 'message' }`. No HTTP status code consistency. |
| A2 | **`PUT /api/settings` accepts arbitrary keys** | `index.js:414-419` | No schema validation. Any key-value pair can be written to settings. |

### 🟠 HIGH

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| A3 | **No API versioning** | All routes | `/api/orders` today, breaking changes tomorrow. Should use `/api/v1/orders`. |
| A4 | **`POST /api/orders` doesn't return full order** | `index.js:254` | Returns the order without joined `service_name`, `username`, etc. Client has to make another GET request. |
| A5 | **`GET /api/orders` uses inconsistent count params** | `index.js:180-183` | The count query uses `params.slice(0, params.length - 2)` to remove LIMIT/OFFSET, but this is fragile. If query structure changes, the slice breaks. |
| A6 | **No `Content-Type` validation** | `index.js` | Accepts any content type for JSON endpoints. Should enforce `application/json`. |

---

## 11. PERFORMANCE EXPERT

### 🔴 CRITICAL

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| PR1 | **N+1 query in order list** | `index.js:175-177` | For every order in the list, `order.images = await queryAll(...)` fires a separate query. 20 orders = 20 extra queries per page load. |
| PR2 | **Stats endpoint fires 10+ queries** | `index.js:429-456` | `GET /api/stats` runs ~10 separate `queryOne` calls. Should be a single query with subqueries or a materialized view. |

### 🟠 HIGH

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| PR3 | **No response caching** | `index.js` | The `cached()` utility at line 27 is defined but never used. Every API call hits the database. |
| PR4 | **Admin panel loads all data upfront** | `admin/src/pages/Users.jsx` | `GET /api/users` returns ALL users with no pagination. With thousands of users, this will be slow. |
| PR5 | **No connection pooling** | `database.js` | Turso client creates individual connections. No pooling configured. |
| PR6 | **Broadcast sends messages sequentially** | `index.js:462-470` | Messages are sent one-by-one in a `for` loop with `await`. Should be batched with `Promise.allSettled` in groups of 30. |

### 🟡 MEDIUM

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| PR7 | **No static asset caching headers** | `index.js:406-407` | `express.static` without `maxAge` option. Client/admin bundles are re-downloaded on every visit. |
| PR8 | **Large inline SVGs in Home.jsx** | `Home.jsx` | Multiple inline SVGs and complex CSS animations. Could be extracted to reduce initial parse time. |

---

## 12. CODE QUALITY & MAINTAINABILITY EXPERT

### 🔴 CRITICAL

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| Q1 | **Zero tests** | Entire project | No test files, no test framework configured, no test scripts in `package.json`. Zero automated verification of any feature. |
| Q2 | **No ESLint/Prettier configuration** | Project root | No `.eslintrc`, no `.prettierrc`. Code style is inconsistent (mixed quotes, semicolons, indentation). |
| Q3 | **Dead code: bot ordering flow** | `bot.js:340-618` | ~280 lines of dead code (bot ordering). If ordering is permanently disabled via bot, this should be removed. |

### 🟠 HIGH

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| Q4 | **Magic numbers everywhere** | `index.js`, `bot.js`, `OrderForm.jsx` | `50000`, `60000`, `110000`, `2 * 60 * 1000`, `10 * 1024 * 1024` — all unexplained. Should be constants with names. |
| Q5 | **No TypeScript** | All files | Entire codebase is plain JavaScript. No type safety. Easy to pass wrong types, miss properties, or break contracts. |
| Q6 | **Massive monolithic files** | `index.js:864`, `bot.js:721`, `OrderForm.jsx:658` | Files are too large. Should be split into route modules, components, and utilities. |
| Q7 | **Inconsistent naming** | Various | `telegram_id` vs `user_id` vs `order_id` — sometimes IDs are used by model PK, sometimes by Telegram ID. This creates confusion. |
| Q8 | **Hardcoded URLs and values** | `bot.js:263`, `OrderForm.jsx` | `'https://metodikish.fly.dev/'` hardcoded in bot. Should be a setting. |

### 🟡 MEDIUM

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| Q9 | **No JSDoc or type annotations** | All files | Functions have no parameter type documentation. |
| Q10 | **Inconsistent error handling** | `index.js` | Some handlers try/catch and return 500, others let errors propagate. Some return `{ error: err.message }`, others `{ success: false }`. |
| Q11 | **Client `api/api.js` doesn't exist** | `client/src/` | Despite being referenced in the initial exploration, no API module exists. Each page creates its own axios instance or uses raw axios. |

---

## 13. BUSINESS LOGIC EXPERT

### Verified Business Rules
| Rule | Status | Notes |
|------|--------|-------|
| Language surcharge (10 cases) | ✅ Correct | All 10 cases match spec |
| Geographic pricing (3 levels) | ✅ Correct | maktab=+0, viloyat=+60k, respublika=+110k |
| Payment timeout 2 min | ✅ Server-side | Bot correctly enforces. Client countdown is cosmetic only. |
| Promo reserved→used lifecycle | ✅ Correct | With TOCTOU fix using `used_count + reserved_count` |
| Referral system (full lifecycle) | ✅ Correct | Deep link → referred_by → balance credit on confirm → spend on order → refund on reject |
| Bot ordering disabled | ✅ Button removed | But code is dead, not removed |

### 🔴 CRITICAL

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| B1 | **No minimum order price validation** | `index.js:246` | After discounts, `totalPrice` can be 0 or negative. No business rule preventing this. |
| B2 | **Referral can be self-referred** | `bot.js:220` | Check exists (`referrerTelegramId !== msg.from.id`) but only in bot flow. The MiniApp doesn't handle referral links at all — users must use bot links. |
| B3 | **Promo code validation endpoint doesn't reserve** | `index.js:505-527` | Validation is stateless. The actual reservation happens during order creation. Between validation and creation, the promo code limit could be reached by another user. |

### 🟠 HIGH

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| B4 | **No "already ordered this service" check** | `index.js:231` | A user can order the same service unlimited times. Business rule says "each teacher needs 1 document" but there's no enforcement. |
| B5 | **Referral reward doesn't scale** | `index.js:365-369` | Flat reward regardless of order size. A 250k order and a 400k order (with language surcharge) give the same referral reward. |
| B6 | **Promo discount applied to surcharges too** | `index.js:236` | `basePrice` includes language + geographic surcharges. Promo percentage is applied to the full amount, not just the base service price. This may be intentional but should be explicit. |
| B7 | **No geographic validation** | `OrderForm.jsx` | User can select "Toshkent viloyati" but enter any district text. No validation that the district is actually in the selected region. |

---

## 14. TESTING EXPERT

### Current State: **ZERO TESTS**

| Test Category | Coverage | Priority |
|---------------|----------|----------|
| Unit tests | 0% | — |
| Integration tests | 0% | — |
| E2E tests | 0% | — |
| API tests | 0% | — |
| Payment flow tests | 0% | — |
| Race condition tests | 0% | — |

### Recommended Test Plan

**Phase 1: Critical Path (Priority 1)**
1. `POST /api/orders` — order creation with various surcharge/discount combinations
2. `POST /api/orders/:id/receipt` — receipt upload with timeout check
3. `PUT /api/orders/:id/confirm-payment` — payment confirmation + referral credit
4. `PUT /api/orders/:id/reject-payment` — rejection + refund
5. `POST /api/promo-codes/validate` — promo validation under concurrent access

**Phase 2: Business Logic (Priority 2)**
6. `getLanguageSurcharge()` — all 10 test cases
7. `getSubjects()` — all grade ranges
8. Price calculation with multiple discounts
9. Referral link deep link parsing
10. Auto-cancel timer behavior

**Phase 3: Integration (Priority 3)**
11. Full order lifecycle (create → pay → confirm → ready → sent)
12. Bot webhook handling
13. Admin CRUD operations

### Recommended Tools:
- **Jest** for unit/integration tests
- **Supertest** for API testing
- **MSW** (Mock Service Worker) for client-side API mocking
- **k6** for load testing promo code race conditions

---

## 15. SCALABILITY EXPERT

### Current Capacity Estimate
| Metric | Current | Limit |
|--------|---------|-------|
| Concurrent users | ~50 | 256MB RAM, single process |
| Orders/day | ~50-100 | Bot polling + manual admin |
| Database size | Unbounded | Turso free tier: 500MB |
| File storage | Unbounded | Fly.io volume: no size limit |

### 🔴 CRITICAL

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| SC1 | **In-memory state doesn't survive restarts** | `bot.js:106-107` | `global.paymentTimers`, `global.userStates`, `global.receiptStates`, `global.paymentMessages` — all lost on restart. A server restart mid-transaction leaves users in broken states. |
| SC2 | **Single process, no clustering** | `server/index.js` | Node.js single-threaded. One blocked event loop (e.g., large file processing) blocks all requests. |

### 🟠 HIGH

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| SC3 | **No connection limits** | `server/index.js` | No limit on concurrent connections. A burst of traffic can exhaust file descriptors. |
| SC4 | **Bot polling interval may be too aggressive** | `bot.js:161` | `interval: 2000` (2 seconds) for polling. With many bots on Telegram, this could hit rate limits. |
| SC5 | **No database connection retry** | `database.js` | If Turso connection drops, the server crashes without retry. |

### Future Scalability Recommendations:
1. **Move to Redis** for in-memory state (sessions, timers, caches)
2. **Add worker processes** for heavy operations (image processing, broadcast)
3. **Implement database connection pooling** via `@libsql/client` pool mode
4. **Add queue system** (Bull/BullMQ) for order processing
5. **Consider Turso read replicas** for read-heavy admin queries

---

## 📊 EXECUTIVE SUMMARY

### Score Card

| Category | Score | Grade |
|----------|-------|-------|
| Security | 2/10 | 🔴 Critical |
| Backend Architecture | 5/10 | 🟡 Fair |
| Database Design | 4/10 | 🟡 Fair |
| Frontend Quality | 6/10 | 🟡 Fair |
| DevOps | 5/10 | 🟡 Fair |
| Payment Safety | 3/10 | 🔴 Critical |
| Concurrency | 4/10 | 🟡 Fair |
| UX/UI | 7/10 | 🟢 Good |
| Telegram Bot | 6/10 | 🟡 Fair |
| API Design | 4/10 | 🟡 Fair |
| Performance | 3/10 | 🔴 Critical |
| Code Quality | 3/10 | 🔴 Critical |
| Business Logic | 6/10 | 🟡 Fair |
| Testing | 0/10 | 🔴 Critical |
| Scalability | 3/10 | 🔴 Critical |

### Overall: **4.1/10** — Requires significant hardening before production use with real payments.

---

## 🎯 TOP 10 PRIORITY FIXES

| # | Issue | Expert | Effort | Impact |
|---|-------|--------|--------|--------|
| 1 | Add admin API authentication | Security | 2 hours | Prevents total system compromise |
| 2 | Validate Telegram WebApp initData | Security | 3 hours | Prevents identity spoofing |
| 3 | Clamp totalPrice to minimum 0 | Financial | 15 min | Prevents negative-price orders |
| 4 | Fix `basePrice` undefined in `validatePromo` | Frontend | 5 min | Fixes broken promo discount on client |
| 5 | Fix "4 daqiqangiz bor" → "2 daqiqangiz bor" in bot | Bot | 5 min | Fixes misleading payment text |
| 6 | Add `WHERE status = 'pending_confirmation'` to confirm-payment | Concurrency | 10 min | Prevents double-confirmation |
| 7 | Add unique constraint on `promo_code_usage` | Database | 10 min | Prevents promo double-use |
| 8 | Add health check endpoint | DevOps | 15 min | Enables Fly.io auto-restart |
| 9 | Add rate limiting | Security | 1 hour | Prevents abuse and DDoS |
| 10 | Remove dead bot ordering code | Code Quality | 30 min | Reduces confusion and attack surface |

---

*Report generated by 15-expert audit team. Each finding includes file path and line number for traceability.*
