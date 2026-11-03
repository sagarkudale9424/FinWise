# FinWise — AI Finance Tracker

FinWise is a responsive finance dashboard built with Next.js 14, React, TypeScript, custom CSS, and Recharts. Its Express API uses MongoDB/Mongoose and Google OAuth for sign-in. The dark interface includes a monthly overview, cash-flow chart, category spending, recent activity, savings goals, and an AI assistant view.

## Run locally

Install and start the frontend from its own folder:

```bash
cd frontend
npm install
npm run dev
```

In a second terminal, install the API dependencies:

```bash
cd backend
npm install
```

Copy `backend/.env.example` to `backend/.env`, then set `MONGODB_URI` to the URI from Atlas. Add your Google OAuth client ID and secret if you want Google sign-in, and set a long random `JWT_SECRET`. In Google Cloud Console, add this authorized redirect URI to your OAuth client:

```text
http://localhost:4000/auth/google/callback
```

Start the API from the `backend` directory:

```bash
npm run dev
```

The frontend is available at [http://localhost:3000](http://localhost:3000). If the API runs on another address, copy `frontend/.env.local.example` to `frontend/.env.local` and set `NEXT_PUBLIC_API_URL`.

For production, configure HTTPS URLs for `FRONTEND_URL`, `API_URL`, and `GOOGLE_CALLBACK_URL`; use a production MongoDB connection and private secrets. The API issues an HTTP-only JWT cookie and validates OAuth state on callback.

## Current interactions

- Sign up or log in with email and password or Google, then log out from the profile area. The dashboard greets the signed-in user by their first name.
- Create, edit, delete, search, filter by type/category/date, and export transactions as CSV.
- Create monthly category budgets and track actual spending against each limit.
- Create savings goals, add contributions, and remove goals.
- Save payment-card references with only issuer, nickname, type, and last four digits.
- View analytics built from saved transactions; update display currency in Settings.
- Ask the finance assistant about recorded transactions, budgets, and savings goals.
- Open Help & support for FAQs and a support email link.

## Roadmap

1. Foundation: Express API, MongoDB/Mongoose, Google OAuth authentication.
2. Transactions: persistent CRUD, server validation, category/date filters.
3. Dashboard: calculate metrics from the authenticated user's transaction history.
4. Budgets and goals: monthly category limits, alerts, and savings progress.
5. AI insights: provide the model with only relevant, aggregated financial data.
6. Deployment: Vercel frontend, Render API, environment configuration, and operations docs.

Transactions, budgets, goals, and card references are stored in MongoDB and scoped to the signed-in user. Google sign-in and email/password authentication share HTTP-only JWT sessions. The finance assistant currently uses deterministic summaries from saved data, not an external LLM.
