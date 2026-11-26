# Hostel Connect

A fast, real-time community platform for hostel residents to connect, collaborate, and message securely—bridging the gap between seniors and juniors.

## Features

- **Authentication & Demo Mode**: Google OAuth and Email/Password sign-in via Supabase Auth (with password reset), plus a one-click **Demo Login** mode for local/offline exploration.
- **Home Pulse Dashboard (`/`)**: Live online resident count, open board & unread message stats, quick skill discovery pills, Community Board highlights, Recently Joined residents, and Saved Contacts.
- **Resident Directory (`/search`)**: Search by name, course, expertise, or room number with course pills, year/block filters, `Ctrl/Cmd + K` shortcut, clickable skill chips, deferred filtering, and progressive rendering.
- **Community Board (`/community`)**: Tabbed feed for **Ask a Senior**, **Study & Hackathons**, **Borrow & Lost**, **Marketplace** (with price tags), and **Notices**, with post creation, tags, resolution toggles, and one-click **"Reply in DM"**.
- **Resident Profiles (`/profile`, `/profile/:userId`, `/profile/edit`)**: Verified student badges, live online indicators, availability status (`Open to Connect`, `Open to Mentor`, `In Room`, `At Library`, `Busy (Exams)`), clickable skill chips, saved/bookmarked contacts, and safe avatar upload.
- **Immersive Real-Time Messaging (`/messages`, `/messages/:userId`)**:
  - Live Supabase Realtime sync (`INSERT`, `UPDATE` read receipts, `DELETE`), typing indicators, and live online presence.
  - Live unread message count badges across the sidebar, mobile drawer, topbar, and conversation list.
  - Optimistic delivery (`sending` / `sent` / `failed` + inline retry), multi-line `textarea` (`Enter` to send, `Shift+Enter` for newline), and 2,000-character limit.
  - Built-in **Emoji Picker**, emoji-only sizing, quick **Message Reactions**, **Clickable URLs & Domain Link Cards**, **Image Attachments** (max 5MB), **In-Conversation Search**, and **Browser Push Notifications**.
- **Safety, Moderation & Resilience**:
  - Database-enforced `CHECK` constraints (non-empty, max 2,000 chars, no self-messaging) and strict Row Level Security (RLS).
  - **Block / Unblock** residents (`blocked_users`), **Report Resident** modal (`message_reports`), **Safety Reports** review page (`/admin`), client-side spam rate limiting (5 msgs / 5s), and a global React `ErrorBoundary`.
- **Performance & PWA**: Route-level code splitting (`React.lazy` + `Suspense`), Vite vendor chunking, non-blocking font loading, SWR in-memory caching, and installable PWA (`manifest.json` + service worker `sw.js`).

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend / Realtime**: Supabase (Auth, PostgreSQL + RLS, Realtime, Storage)
- **Hosting & Keep-Alive**: Vercel (SPA + `/api/keep-alive` serverless endpoint) & Render

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
4. Run `database_setup.sql` in your Supabase SQL Editor to create all tables (`profiles`, `messages`, `blocked_users`, `message_reports`, `community_posts`, `saved_contacts`), RLS policies, Realtime publications, indexes, and storage buckets (`profiles`, `chat-attachments`).
5. Start the development server:
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` — Start Vite development server
- `npm run build` — Type-check with `tsc` and build production bundle
- `npm run lint` — Run ESLint across TypeScript/TSX files (`--max-warnings 0`)
- `npm run preview` — Preview production build locally

## Project Structure

- `/api` - Vercel serverless functions (`keep-alive.js`)
- `/public` - Static assets & PWA (`favicon.svg`, `manifest.json`, `sw.js`)
- `/src` - Source code
  - `/components` - Reusable UI components (`AppShell`, `ErrorBoundary`, `Layout`, `ProtectedRoute`, `LoadingScreen`)
  - `/context` - React context providers (`AuthContext`, `PresenceContext`)
  - `/lib` - Supabase client, SWR cache (`cache.ts`), notifications (`notifications.ts`), and Demo Mode helpers (`demoData.ts`)
  - `/pages` - Route-split application pages (`Home`, `Login`, `Search`, `Community`, `Profile`, `EditProfile`, `Messages`, `Conversation`, `Admin`, `NotFound`)
  - `/types` - TypeScript database definitions (`supabase.ts`)

## Deployment

- **Frontend (Vercel)**: Configured via `vercel.json` for SPA client-side routing and `/api/keep-alive`. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and optionally `UPTIME_KEEPALIVE_SECRET` in Vercel environment variables.
- **Render**: `vite.config.ts` allows `.onrender.com` hosts in both `server.allowedHosts` and `preview.allowedHosts`.
- **Database (Supabase)**: Run the idempotent `database_setup.sql` in SQL Editor and ensure Google OAuth redirect URLs include your production domain(s).
