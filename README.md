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
Footer → **Admin**. Password `Vaishnav@2026`, PIN `1234` — change both inside the panel.
Edit every word, number and list; upload photos / episode videos; add or remove brands, people, episodes, featured cards, testimonials, journey entries; see enquiries.

## Files
| File | What |
|---|---|
| `src/content.js` | All default text, numbers and image paths |
| `public/img/` | Photos (replace a file to change it everywhere) |
| `src/pages/*.jsx` | One file per page |
| `src/lib.jsx` | Marquee, strip, tiles, reveal, count-up helpers |
| `src/Admin.jsx` | Login + editor + enquiries |
| `src/store.js` | Storage layer (see below) |
| `src/base.css`, `src/site.css` | Styling (colours in `:root`, dark mode included) |

## Storage (read this)
`src/store.js` keeps admin edits, uploads and enquiries in the browser's **localStorage** (≈5 MB).
They are visible only on the device where they were made. To make them shared across devices,
connect `store.js` to a backend (Firebase, Supabase, or your own API) and host uploads there —
it is the only file to change.
