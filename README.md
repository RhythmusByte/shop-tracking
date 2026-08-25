# Store Tracker

A self-hosted daily operations tracker for small multi-store retail businesses.
Log sales, expenses, staff salaries, purchases, opening times, and daily checklists
per store, then generate PNL reports and export everything to spreadsheets.

**Live demo:** [shoptracker.akhilmahesh.com](https://shoptracker.akhilmahesh.com)

Built with Next.js (React + API routes), Tailwind CSS, and MongoDB. Deploys to Vercel
in a few minutes on free tiers.

## Features

- **Daily entry per store**: sales (order counts + payment-method breakdown: cash,
  UPI, card, credit), itemized expenses (including staff salary payments), itemized
  purchases, ad performance tracking (6 AM start time + conversion count), opening
  time, stock received/left, bank statement confirmation with an FMO reference
  figure, damages log, and a call/deposit confirmation checklist.
- **Dashboard**: pick any date, see gradient stat cards for total sales/expenses/
  reporting stores, per-store checklist completion, opening-time status (on time /
  late / not logged), and the previous day's sales at a glance.
- **Staff**: track each store's employees and their monthly salary, log salary
  payments as itemized expenses tied to a specific staff member.
- **TODO**: a daily checklist, an auto-generated "call the store" task per store,
  and free-form tasks you can optionally assign to a store or a person.
- **PNL Generator**: pick a store and date range, get a stat dashboard (sales,
  expenses, purchases, net profit/loss) plus bar and line charts, with a spreadsheet
  export (summary + daily sales + expenses + purchases, each on its own tab).
- **FMO Account dashboard**: a dedicated page totaling the personal-reference figures
  logged on each daily entry, by store and with a chart, kept separate from all
  sales/expense/PNL totals.
- **Stores**: add stores, edit name/code/store number/manager name & contact/
  expected opening & stock-check time, one-tap WhatsApp button to message the
  manager (validated as a real 10-digit Indian mobile number before the button
  is shown).
- **Export**: client-side spreadsheet generation for a date range, combined,
  per-store-tab, or single store.
- **Multi-user accounts**: admin and staff roles. Admins can create accounts and
  reset anyone's password from the Users page; every user can change their own
  password and profile from Settings.
- **Dark mode**: purple-accented glassmorphism theme, toggle in the nav, persists
  across visits, no flash of the wrong theme on load.
- Mobile-responsive throughout, including a proper hamburger nav on small screens.
- All dates and "today" logic run on IST (Asia/Kolkata), not the visitor's browser
  timezone, so the day boundary doesn't shift depending on where the app is opened.

Re-saving an entry for the same store and date **edits it in place** (upsert on
`store+date`), so you can't accidentally create duplicates for the same day.

## Tech stack

- [Next.js 14](https://nextjs.org/) (App Router, API routes)
- [Tailwind CSS](https://tailwindcss.com/) with class-based dark mode
- [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- [SheetJS (xlsx)](https://sheetjs.com/) for client-side spreadsheet export
- [Recharts](https://recharts.org/) for PNL and FMO dashboard charts
- [Lucide](https://lucide.dev/) for icons
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) for password hashing, JWT
  (`jsonwebtoken` on the server, `jose` in Edge middleware) for sessions
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
| `ADMIN_USERNAME` | Bootstrap admin username, used only on first run |
| `ADMIN_PASSWORD` | Bootstrap admin password, used only on first run |

`ADMIN_USERNAME`/`ADMIN_PASSWORD` only matter the very first time anyone logs in:
if no user accounts exist yet, that first login attempt creates the initial admin
account (password properly bcrypt-hashed into the database) from those env values.
After that, accounts are managed entirely through the app's Users page and the env
vars are ignored, they can be removed from Vercel once the first admin exists.

Then:

```bash
npm run dev
```

Visit `http://localhost:3000`, log in with your bootstrap credentials, and add your
stores on the Stores page.

### Deploying

1. Push this repo to GitHub.
2. Import it into [Vercel](https://vercel.com/new).
3. Add the same environment variables from `.env.local` in the Vercel project settings.
4. Deploy. Every push to the main branch redeploys automatically.

## Project structure

```
app/                 Next.js App Router pages and API routes
  api/                 Backend endpoints: auth, users, stores, staff, entries,
                        expenses, purchases, tasks, todo, export, profile
  store/[id]/          Daily entry form for a single store
  stores/               Store management (add/edit/deactivate, staff, WhatsApp)
  pnl/                  PNL Generator with charts
  fmo/                  FMO Account dashboard
  todo/                 Daily TODO checklist
  export/               Spreadsheet export
  settings/             Profile settings and password change
  users/                Admin-only user management
  not-found.js          Custom 404 page
  error.js              Route-level error boundary
  global-error.js        Root-level error boundary (replaces the whole layout)
components/          Shared UI (Nav, Footer, Avatar, PageLoader, theme toggle)
lib/                 Shared helpers (DB connection, auth/session, IST date
                     utilities, calculation helpers)
models/              Mongoose schemas
middleware.js        Route-level auth guard (session + admin-only gating)
```

## Security notes

- Passwords are bcrypt-hashed (cost factor 10) before being stored; the plaintext
  password never touches the database.
- Sessions are JWTs stored in an `httpOnly`, `secure`, `sameSite: strict` cookie,
  so they're inaccessible to JavaScript and won't be sent cross-site.
- `middleware.js` enforces auth on every route except `/login`, this includes
  direct API calls, not just page navigation. User-management routes (`/users`,
  `/api/users/*`) additionally require the `admin` role.
- The Users page won't let you delete the last remaining admin account, to avoid
  accidentally locking everyone out.
- MongoDB Atlas network access is typically configured to allow all IPs
  (`0.0.0.0/0`) since Vercel doesn't use static IPs; this is safe only because the
  DB connection still requires a username and password. Don't weaken those in
  exchange.

## Known limitations

- Dates and "today" are computed in IST regardless of the visitor's device
  timezone, this is deliberate (see Features), not a bug, but worth knowing if
  you ever need multi-timezone support.
- The WhatsApp quick-contact link only supports 10-digit Indian mobile numbers.
- No automated reminders yet (e.g. a nudge if the ad hasn't started by 6 AM). A
  Vercel Cron Job calling a notification webhook would be the natural next step.
- Charting uses `recharts` v2, which works fine but is no longer the actively
  developed branch (v3 exists).

---

Made by [Akhil Mahesh](https://akhilmahesh.com)
