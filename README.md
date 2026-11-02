# Vaishnav Dhole — Portfolio (React + Vite)

## Run locally
```
npm install
npm run dev
```
Open the URL Vite prints (usually http://localhost:5173).

## Build for hosting
```
npm run build
```
Upload the `dist/` folder to any static host (Vercel, Netlify, GitHub Pages, cPanel…).

## Pages (hash routes — work on any host without server config)
| URL | Page |
|---|---|
| `/#/` | Home: hero, stats, expertise ticker, clients & collaborators marquees, featured content, testimonials |
| `/#/about` | About + Field & documentary |
| `/#/journey` | Sticky-scroll career timeline |
| `/#/episodes` | Selected episodes (hover / tap video preview) |
| `/#/pipeline` | What I handle |
| `/#/contact` | Contact + enquiry form |
| `/#/admin` | Admin panel |

## Admin
Footer → **Admin** (or `/#/admin`). Starting password `Vaishnav@2026`, PIN `1234` — change both inside the panel.
Edit every word, number and list; upload photos / episode videos (up to 50 MB); add or remove brands, people, episodes,
featured cards, testimonials, journey entries; read and delete enquiries.

## Files
| File | What |
|---|---|
| `src/content.js` | All default text, numbers and image paths |
| `public/img/` | Photos (replace a file to change it everywhere) |
| `src/pages/*.jsx` | One file per page |
| `src/lib.jsx` | Marquee, strip, tiles, reveal, count-up helpers |
| `src/Admin.jsx` | Login + editor + enquiries |
| `src/store.js` | Browser side of the storage layer |
| `api/*.js` | Backend (Vercel serverless functions) |
| `src/base.css`, `src/site.css` | Styling (colours in `:root`, dark mode included) |

## Backend (Vercel functions + Vercel Blob)
Everything saved in the admin panel is stored permanently on the server and shown to every visitor.

| Route | What | Who |
|---|---|---|
| `GET /api/content` | Saved site content | Anyone |
| `PUT /api/content` | Save site content (last 20 versions kept) | Admin |
| `POST /api/login` | Check password, then password + PIN → 12-hour session | Anyone |
| `POST /api/credentials` | Change password / PIN (signs out other sessions) | Admin |
| `POST /api/enquiries` | Submit the contact form (with spam honeypot) | Anyone |
| `GET`/`DELETE /api/enquiries` | Read / delete enquiries | Admin |
| `POST /api/upload` | Token for direct photo/video upload to Blob | Admin |

Storage layout in the Blob store: `content/` (site content), `enquiries/`, `uploads/` (media), `auth/` (salted scrypt
password + PIN hashes — never sent to the browser).

### One-time setup on Vercel
1. Vercel dashboard → this project → **Storage** → **Create Database** → **Blob** → create it and **connect it to this
   project** (all environments). This adds `BLOB_READ_WRITE_TOKEN` automatically.
2. **Deployments** → latest → **Redeploy** (env vars only apply to new deployments).
3. Open `/#/admin`, sign in with `Vaishnav@2026` / `1234`, then set a new password and PIN and press **Save changes**.

Optional env vars (Settings → Environment Variables): `ADMIN_PASSWORD` / `ADMIN_PIN` (starting credentials before
you change them in the panel), `SESSION_SECRET` (session signing key; defaults to one derived from the Blob token).

### Local development
- `npm run dev` — front end only; saves go to this browser's localStorage.
- `npm run dev:full` — runs the real backend locally via the Vercel CLI (`npm i -g vercel`, `vercel link`,
  `vercel env pull`).
