# Hostel Connect

A platform for hostel residents to connect, interact, and network, breaking the barrier between seniors and juniors.

## Features

- User Registration & Authentication (Google OAuth)
- User Profiles (year of study, expertise, domain, room number, contact info)
- Search Functionality (filter by year, domain, room number)
- Direct Messaging (real-time communication)
- Responsive Design (mobile-friendly)

## Tech Stack

- **Frontend**: React.js with TypeScript
- **Backend**: Supabase (Authentication, Database, Storage)
- **Styling**: Tailwind CSS
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env.local` file with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Start the development server:
   ```
   npm run dev
   ```

## Project Structure

- `/src` - Source code
  - `/components` - Reusable UI components
  - `/pages` - Application pages
  - `/hooks` - Custom React hooks
  - `/lib` - Utility functions and services
  - `/types` - TypeScript type definitions
  - `/context` - React context providers

## Deployment

The application can be deployed to Vercel with minimal configuration.
