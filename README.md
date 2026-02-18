# Smart Bookmark Manager

A minimal, fast bookmark manager built with **Next.js 15** and **Supabase**. Save, organize, and access your favourite links from anywhere — with real-time sync and Google authentication.

## Features

- 🔐 **Google OAuth** — one-click sign-in via Supabase Auth
- ⚡ **Optimistic UI** — bookmarks appear instantly before the server confirms
- 🔄 **Real-time sync** — changes reflect live across tabs via Supabase Realtime
- 🗂️ **Favicon + metadata** — each bookmark shows its site icon, domain, and date saved
- 🎨 **Clean, minimal UI** — Inter + Outfit fonts, light theme, no clutter

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database & Auth | Supabase (PostgreSQL + Auth) |
| Styling | Tailwind CSS v4 + custom CSS |
| Fonts | Inter, Outfit (Google Fonts) |
| Language | TypeScript |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with Google OAuth enabled

### 1. Clone the repo

```bash
git clone https://github.com/apurba-striker/smart-bookmark-app.git
cd smart-bookmark-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set up the database

Run this SQL in your Supabase SQL editor:

```sql
create table bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  url text not null,
  title text not null,
  created_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table bookmarks enable row level security;

create policy "Users can manage their own bookmarks"
  on bookmarks for all
  using (auth.uid() = user_id);

-- Enable Realtime
alter publication supabase_realtime add table bookmarks;
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
├── actions/
│   ├── auth.ts          # Server actions: signInWithGoogle, signOut
│   └── bookmarks.ts     # Server actions: add/delete bookmarks
├── auth/
│   └── callback/
│       └── route.ts     # OAuth callback handler
├── globals.css          # Global styles & design tokens
├── layout.tsx           # Root layout with font setup
└── page.tsx             # Main page (auth + bookmark UI)
lib/
└── supabase/
    ├── client.ts        # Browser Supabase client
    └── server.ts        # Server Supabase client
```

## Deployment

Deploy instantly on [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import the repo on Vercel
3. Add your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables
4. Set the Supabase Auth redirect URL to `https://your-domain.vercel.app/auth/callback`

## License

MIT
