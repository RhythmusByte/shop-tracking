# Store Tracker

A self-hosted daily operations tracker for small multi-store retail businesses.
Log sales, expenses, purchases, opening times, and daily checklists per store, then
generate PNL reports and export everything to spreadsheets.

Built with Next.js (React + API routes), Tailwind CSS, and MongoDB. Deploys to Vercel
in a few minutes on free tiers.

## Features

- **Daily entry per store**: sales (order counts + payment-method breakdown: cash,
  UPI, card, credit), itemized expenses, itemized purchases, ad performance tracking
  (6 AM start time + conversion count), opening time, stock received/left, bank
  statement confirmation, damages log, and a call/deposit confirmation checklist.
- **Dashboard**: pick any date, see per-store checklist completion, opening-time
  status (on time / late / not logged), and the previous day's sales at a glance.
- **TODO**: a daily checklist, an auto-generated "call the store" task per store,
  and free-form tasks you can optionally assign to a store or a person.
- **PNL Generator**: pick a store and date range, get sales minus expenses minus
  purchases, visualized with charts, and exportable to a multi-tab spreadsheet.
- **Export**: spreadsheet export for any date range, combined or per-store.
- **Single admin login**: no multi-user account system, session-based auth via a
  JWT stored in an httpOnly cookie.
- **Dark mode**, mobile-responsive layout, WhatsApp quick-contact for store managers.

## Tech stack

- [Next.js 14](https://nextjs.org/) (App Router, API routes)
- [Tailwind CSS](https://tailwindcss.com/) with class-based dark mode
- [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- [SheetJS (xlsx)](https://sheetjs.com/) for client-side spreadsheet export
- [Recharts](https://recharts.org/) for the PNL dashboard charts
- Deploys to [Vercel](https://vercel.com/)

## Getting started

### Prerequisites

- Node.js 18+
- A MongoDB Atlas cluster (free M0 tier is enough) or any MongoDB instance

### Setup

```bash
git clone <this-repo-url>
cd store-tracker
npm install
cp .env.local.example .env.local
```

Fill in `.env.local`:

| Variable | Description |
|---|---|
| `MONGODB_URI` | Your MongoDB connection string |
| `JWT_SECRET` | A random secret for signing session tokens (`openssl rand -base64 48`) |
| `ADMIN_USERNAME` | The login username |
| `ADMIN_PASSWORD` | The login password |

Then:

```bash
npm run dev
```

Visit `http://localhost:3000`, log in, and add your stores on the Stores page.

### Deploying

1. Push this repo to GitHub.
2. Import it into [Vercel](https://vercel.com/new).
3. Add the same environment variables from `.env.local` in the Vercel project settings.
4. Deploy. Every push to the main branch redeploys automatically.

## Project structure

```
app/                 Next.js App Router pages and API routes
  api/                 Backend endpoints (auth, stores, entries, expenses, purchases, tasks, todo, export, profile)
  store/[id]/          Daily entry form for a single store
  stores/               Store management (add/edit/deactivate)
  pnl/                  PNL Generator with charts
  todo/                 Daily TODO checklist
  export/               Spreadsheet export
  settings/             Admin profile (name/avatar)
components/          Shared UI (Nav, Avatar, theme toggle)
lib/                 Shared helpers (DB connection, auth, date/calc utilities)
models/              Mongoose schemas
middleware.js        Route-level auth guard
```

## Security notes

- Session auth is a single hardcoded admin account, not a full user system, by design.
- **The current codebase compares the admin password in plain text** (see
  `app/api/auth/login/route.js`), not as a bcrypt hash. If you're deploying this
  somewhere more than one person could reach, switch to hashed password comparison
  before doing so (a `bcryptjs`-based helper script is included at
  `scripts/hash-password.js` as a starting point).
- The session cookie is `httpOnly`, `secure`, and `sameSite: strict`.
- MongoDB Atlas network access is typically configured to allow all IPs (`0.0.0.0/0`)
  since Vercel doesn't use static IPs; this is safe only because the DB connection
  still requires a username and password. Don't weaken those in exchange.

## Known limitations

- Single-admin only, no multi-user support or audit log.
- Dates are computed from the browser's local time; if you access the app from a
  different timezone than your stores, the "today" boundary will shift.
- The WhatsApp quick-contact link assumes a 10-digit Indian mobile number format.
- No automated reminders (e.g. a nudge if the ad hasn't started by 6 AM). A Vercel
  Cron Job calling a notification webhook would be the natural next step.

## License

MIT, or add your own license terms here before making the repo public if you want
something different.