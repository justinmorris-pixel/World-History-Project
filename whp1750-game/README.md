# World History 1750 · Map Quest

A mapping enrichment game for DHS World History teachers, built the same
way as County Quest: React + Vite + Tailwind, Supabase backend, deployed
on Vercel. Students place empires/regions on a world map, unlocking
progressive difficulty groups per unit; teachers control which of the
9 course units are open and manage rosters and content.

## 1. Set up the database (5 min)

You're reusing your **existing** Supabase project — this does not use up
your second project slot.

1. Go to your Supabase project → **SQL Editor** → **New query**.
2. Open `supabase/schema.sql` from this folder, copy the whole file, paste
   it into the SQL Editor, and click **Run**. This creates all the
   `whp_` tables, security rules, and functions, and seeds the 9 units.
3. New query again. Open `supabase/seed_unit1_locations.sql`, copy/paste,
   and **Run**. This loads the starter Unit 1 location set.
4. Go to **Project Settings → API**. Copy your **Project URL** and
   **anon public key** — you'll need both in step 3 below.

## 2. Push this code to GitHub

1. Go to [github.com/new](https://github.com/new), create a new repository
   (e.g. `whp1750-game`), keep it **empty** (no README/gitignore).
2. On the new repo's page, click **uploading an existing file** (or use
   Add file → Upload files).
3. Drag in every file and folder from this project **except**
   `node_modules` (there isn't one in this download) — just drag the whole
   unzipped folder contents in.
4. Commit directly to `main`.

## 3. Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub
   repo you just created.
2. Vercel will auto-detect Vite — leave the build settings as-is.
3. Before deploying, open **Environment Variables** and add:
   - `VITE_SUPABASE_URL` → your Project URL from step 1.4
   - `VITE_SUPABASE_ANON_KEY` → your anon public key from step 1.4
4. Click **Deploy**. When it finishes, click the link — the site is live.

## 4. Create your teacher account

1. On the live site, click **I'm a Teacher → Need an account? Sign up**.
2. Enter your name, email, and a password. (If Supabase asks for email
   confirmation, check your inbox and confirm, then log in.)
3. Once logged in, create a class — you'll get a **class code** to give
   your students.
4. Add your roster (just names — students set their own PIN the first
   time they log in, exactly like County Quest).
5. Check the box next to **Unit 1: The World in 1750** to open it for
   that class.

## 5. Try it as a student

1. On the live site, click **I'm a Student**, enter the class code.
2. Pick your name from the roster, set a PIN.
3. Open Unit 1 and start placing locations on the map.

## What's built vs. what's next

**Working now:** student join + PIN login, the core map game with
progressive group unlock, teacher signup/login, class + roster
management, per-class unit open/close toggles, a content editor for
adding/editing/deleting locations per unit, and a teacher progress view.

**Not built yet (future phase, same as we discussed):** class
leaderboard, Speed Round, Daily Challenge, Boss Round. Units 2–9 have no
locations yet — add them from **Teacher Dashboard → Unit Content**, or
tell me the empires/events/places you want per unit and I'll draft the
full set like I did for Unit 1.

## Local development (optional)

If you ever want to run this on your own machine before pushing:

```
npm install
cp .env.example .env    # then fill in your Supabase URL + anon key
npm run dev
```
