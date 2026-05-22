# World Cup 2026 office pool

Next.js app for group-stage score predictions, knockout picks, leaderboard, supporter wall, and per-match live chat.

## Setup

1. Copy `.env.example` to `.env` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ADMIN_PASSWORD`
   - `PREDICTION_LOCK_AT` (optional)

2. In the [Supabase SQL Editor](https://supabase.com/dashboard), run `supabase/schema.sql`.

3. Seed matches:

   ```bash
   npm run db:seed
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

## Auth

No Supabase Auth. Players enter a **display name** stored in `localStorage` (`wc2026_player`). The app creates or reuses a row in `players` by name.

## Realtime chat

`match_chat_messages` is in the Realtime publication (see schema). Chat opens 15 minutes before kickoff and closes 2 hours after.

## Admin

Open `/admin` with the password from `ADMIN_PASSWORD`. Enter results, knockout answers, and manage players.
