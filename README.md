# Hostel Connect

A fast, real-time platform for hostel residents to connect, discover peers, and message securely—breaking the barrier between seniors and juniors.

## Features

- **Authentication & Demo Mode**: Google OAuth and Email/Password login via Supabase Auth, plus a one-click **Demo Login** mode for local exploration without credentials.
- **Resident Profiles**: View your own profile (`/profile`), view other residents (`/profile/:userId`), and edit personal details (course, year of study, expertise, room number, WhatsApp contact, and avatar upload) with safe error handling.
- **Fast Resident Directory (`/search`)**: Search by name, course, expertise, or room number with course pills, year/block filters, `Ctrl/Cmd + K` shortcut, deferred filtering, and progressive rendering.
- **Real-Time Direct Messaging (`/messages`, `/messages/:userId`)**:
  - Live Supabase Realtime sync (`INSERT`, `UPDATE` read receipts, `DELETE`) and typing indicators.
  - Live unread message count badges across the sidebar, mobile drawer, topbar, and conversation list.
  - Optimistic message delivery with `sending` / `sent` / `failed` states and inline retry.
  - Multi-line `textarea` composer (`Enter` to send, `Shift+Enter` for newline), 2,000-character limit, per-day date dividers, message grouping, copy/delete actions, and smart auto-scroll with a "New messages" jump pill.
- **Safety & Moderation**:
  - Database-enforced `CHECK` constraints (non-empty, max 2,000 chars, no self-messaging) and Row Level Security (RLS).
  - **Block / Unblock** residents (`blocked_users` table + RLS enforcement) and **Report Resident** modal (`message_reports` table).
  - Client-side spam rate limiter (max 5 messages per 5 seconds) and self-messaging guard.
- **Performance**: Route-level code splitting (`React.lazy` + `Suspense`), Vite vendor chunking, non-blocking font loading, SWR in-memory caching, and non-blocking profile hydration.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend / Realtime**: Supabase (Auth, PostgreSQL + RLS, Realtime, Storage)
- **Hosting & Keep-Alive**: Vercel (SPA + `/api/keep-alive` serverless endpoint) & Render / UptimeRobot

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/MohdSajidJafri/Hostel-Connect.git
   cd Hostel-Connect
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Run `database_setup.sql` in your Supabase SQL Editor to set up tables, RLS policies, Realtime publication, indexes, and the `profiles` storage bucket.
5. Start the development server:
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` — Start Vite development server
- `npm run build` — Type-check with `tsc` and build production bundle
- `npm run lint` — Run ESLint across TypeScript/TSX files
- `npm run preview` — Preview production build locally

## Project Structure

- `/api` - Vercel serverless functions (`keep-alive.js`)
- `/public` - Static assets (`favicon.svg`)
- `/src` - Source code
  - `/components` - Reusable UI components (`AppShell`, `Layout`, `ProtectedRoute`, `LoadingScreen`)
  - `/context` - React context providers (`AuthContext`)
  - `/lib` - Supabase client, SWR cache (`cache.ts`), and Demo Mode helpers (`demoData.ts`)
  - `/pages` - Route-split application pages (`Home`, `Login`, `Search`, `Profile`, `EditProfile`, `Messages`, `Conversation`, `NotFound`)
  - `/types` - TypeScript database definitions (`supabase.ts`)

## Deployment

- **Frontend (Vercel)**: Configured via `vercel.json` for SPA client-side routing and `/api/keep-alive`. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and optionally `UPTIME_KEEPALIVE_SECRET` in Vercel environment variables.
- **Database (Supabase)**: Ensure `database_setup.sql` has been applied and Google OAuth redirect URLs include your Vercel/Render domain.
