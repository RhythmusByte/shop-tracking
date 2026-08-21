# Store Tracker

Daily operations tracker for your 4 stores. Single admin login, no other users.
Stack: Next.js (React + API routes) + Tailwind CSS + MongoDB (Mongoose) + Vercel.

## What it does

- **Dashboard**: today's checklist completeness per store, opening-time status (on time / late / not logged), and yesterday's total sales per store.
- **Store entry page**: logs everything per store per day:
  - Sales broken down by payment method: online, cash, UPI, card, credit (total is computed)
  - Total expense for the day
  - Ad start time (target 6 AM) and ad conversion **count** (number of orders, not an amount)
  - Opening time (compared against the store's expected opening time to flag late/on-time/not-logged)
  - Stock received time + notes
  - Stock left, checked next morning
  - Previous day's bank statement checked + credited by 12 PM
  - Damages checked / found + notes
  - Store called + money deposited confirmation
  - Purchases logged against that store/date (description, amount, vendor), running total shown
- **Today's TODO**: the 3 global daily checks, an auto-generated "Called <store>" task per active store, and a free-form task list you can add to and optionally assign to a store or a person.
- **P&L Generator**: pick a store and date range, get total sales minus purchases minus expenses, with a spreadsheet export (summary + daily sales + purchases, each on its own tab).
- **Stores page**: add stores, edit name/code/store number/manager name & contact/expected opening & stock-check time, deactivate if one closes (history is kept, not deleted).
- **Export**: client-side spreadsheet generation for a date range, either:
  - one combined sheet, all stores
  - one workbook with a tab per store
  - a single store only

Re-saving an entry for the same store and date **edits it in place** (upsert on `store+date`), so you can't accidentally create duplicates for the same day.

## Why these choices (so you're not just copying blindly)

- **Mongoose over the raw MongoDB driver**: schema validation and a unique compound index (`store + date`) enforced at the DB layer, not just in the UI. Prevents duplicate daily entries even if you open the app in two tabs.
- **Single admin via env-stored bcrypt hash, not a Users collection**: you said one admin, no other users, and that data must be secure. A hardcoded credentials table for one user is unnecessary attack surface. The hash lives in Vercel's encrypted environment variables, never in the database or the repo.
- **JWT in an httpOnly cookie + Next.js middleware**: middleware runs before every request (including API routes), so there's one place that enforces auth rather than repeating checks in every route handler. `jose` is used in middleware specifically because Vercel's Edge Runtime (where middleware runs) cannot run Node's `jsonwebtoken` library.
- **Client-side XLSX generation (SheetJS)**: Vercel's serverless functions have a read-only filesystem except `/tmp`, and that `/tmp` is wiped between invocations. Generating the spreadsheet in the browser sidesteps that entirely and it's actually simpler code.
- **`force-dynamic` on API routes**: without it, Next.js tries to prerender API routes at build time and fails because there's no DB during build. This is a genuine gotcha, not a stylistic choice.

## Setup

### 1. MongoDB Atlas (free tier)

1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account.
2. Create an M0 (free) cluster.
3. Database Access → add a database user with a strong password.
4. Network Access → add `0.0.0.0/0` (allow from anywhere) since Vercel's IPs aren't static. This is standard practice for serverless deployments; the connection is still authenticated.
5. Get your connection string from "Connect" → "Drivers", it looks like:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/store-tracker?retryWrites=true&w=majority`

### 2. Local setup

```bash
npm install
cp .env.local.example .env.local
```

Fill in `.env.local`:

- `MONGODB_URI`: from step 1 above.
- `JWT_SECRET`: run `openssl rand -base64 48` and paste the output.
- `ADMIN_USERNAME`: whatever you want, e.g. `admin`.
- `ADMIN_PASSWORD_HASH`: run `node scripts/hash-password.js "your-chosen-password"` and paste the printed hash. Never store the plaintext password anywhere, including this file.

```bash
npm run dev
```

Visit `http://localhost:3000`, log in, go to **Stores** and add your 4 stores first.

### 3. Deploy to Vercel

1. Push this project to a GitHub repo (private repo recommended, given your Codeberg preference you could mirror there too, but Vercel's GitHub integration is the path of least friction for auto-deploys).
2. Go to https://vercel.com, "Add New Project", import the repo.
3. In the project's Environment Variables settings, add the same 4 variables from `.env.local` (`MONGODB_URI`, `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`).
4. Deploy. Vercel auto-detects Next.js, no build config needed.

Every push to your main branch redeploys automatically.

## Security notes (read this, don't skip)

- **Current state: the admin password is stored in plain text** in `ADMIN_PASSWORD`, not hashed. This was a deliberate temporary swap to unblock local login debugging (see git history / conversation for why bcrypt comparisons were failing). Before this app is used for real data on a machine or deployment anyone else could access, switch back to bcrypt: restore `ADMIN_PASSWORD_HASH` + `bcrypt.compare` in `app/api/auth/login/route.js`, generate a hash with `node scripts/hash-password.js "your-password"`, and remove `ADMIN_PASSWORD` from your env entirely.
- Session cookie is `httpOnly`, `secure`, `sameSite: strict`, so it's inaccessible to JS and won't be sent cross-site. It expires after 7 days.
- `middleware.js` blocks every route except `/login` and the login API without a valid session, this includes direct API calls, not just page navigation.
- If you ever suspect the session is compromised, rotate `JWT_SECRET` in Vercel, that immediately invalidates all existing sessions.
- MongoDB Atlas network access allowing `0.0.0.0/0` is safe *only* because the connection still requires the database username/password. Do not also weaken the DB user's permissions or reuse that password elsewhere.

## Known limitations, stated plainly rather than hidden

- The "Today's TODO" 3-item checklist is global per day, not per store, since you described it as a single daily check. Per-store call/deposit confirmation already exists on each store's entry page (`storeCalled`, `moneyDeposited`).
- No email/SMS reminders. If you want a nudge at 6 AM to check the ad started, or a reminder to check the bank statement by 12 PM, that's a legitimate next step (e.g. a Vercel Cron Job hitting a `/api/reminder` route that calls a Telegram bot, which fits your existing aiogram experience) but it's out of scope for "basic website" as asked.
- No audit log of who changed what. Irrelevant with a single admin user, but worth knowing if you ever add a second user later.
- Timezone: dates are computed from the browser's local time. If you and the stores are all in IST, this is a non-issue. If you ever access this from a different timezone, the "today" boundary will shift.
