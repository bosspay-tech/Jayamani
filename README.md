# Jayamani Export

Modern e-commerce website for [Jayamani Collections](https://jayamanicollections.com/), built with **Next.js**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

## Features

- Modern UI with plum, gold, and ivory brand palette
- Product catalog powered by Supabase
- Shop with category and collection filters
- Product detail pages with add-to-cart
- Cart with local storage persistence
- Contact form and newsletter subscription
- User login and registration with Supabase Auth
- Responsive mobile-first layout

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_or_publishable_key
```

### 3. Set up Supabase database

In your [Supabase SQL Editor](https://supabase.com/dashboard), run:

1. `supabase/schema.sql` — creates tables and policies
2. `supabase/seed.sql` — adds sample products from your old catalog

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Auth API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account (`fullName`, `email`, `password`, `phone?`) |
| POST | `/api/auth/login` | Sign in (`email`, `password`) |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Get current logged-in user |

Pages: `/login` and `/register`

**Supabase setup:** Enable Email auth in your Supabase project (Authentication → Providers → Email). If email confirmation is on, users must confirm before they can log in.

Set **`SITE_URL`** in Coolify (runtime) to your live domain, e.g. `https://jayamanicollections.com`. This fixes confirmation emails linking to localhost when `NEXT_PUBLIC_SITE_URL` was missing at build time.

Also set `NEXT_PUBLIC_SITE_URL` to the same value (enable **build-time** in Coolify if available).

In Supabase → **Authentication → URL Configuration**:

- **Site URL:** `https://jayamanicollections.com`
- **Redirect URLs:** add `https://jayamanicollections.com/auth/callback` and `http://localhost:3000/auth/callback`

## Project Structure

```
src/
  app/           # Pages (home, shop, cart, about, contact)
  components/    # UI components
  lib/           # Supabase clients, data fetching, utilities
supabase/
  schema.sql     # Database schema
  seed.sql       # Sample product data
```

## Deploy

Deploy to Vercel, Netlify, or any Node.js host. Set the same environment variables in your hosting dashboard.
