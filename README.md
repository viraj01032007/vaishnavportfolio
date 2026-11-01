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

## Firebase (shared storage across all devices)
`src/store.js` uses Firebase when `.env` has the config; otherwise it falls back to this browser's localStorage.

| Data | Where |
|---|---|
| Site content (admin edits) | Firestore doc `content/site` (live-updates every visitor) |
| Enquiries | Firestore collection `enquiries` |
| Photo / video uploads | Firebase Storage `uploads/` |
| Admin login | Firebase Auth (email + password), then the PIN |

### Setup (one time)
1. https://console.firebase.google.com → **Add project**.
2. **Build → Firestore Database → Create database** (production mode).
3. **Build → Storage → Get started** (Storage needs the Blaze pay-as-you-go plan; the free quota covers a portfolio).
4. **Build → Authentication → Get started → Email/Password → Enable**. Then **Users → Add user** with your admin email and the password you want.
5. **Project settings → Your apps → Web (</>)** → register app → copy the config.
6. `cp .env.example .env` and paste the values; set `VITE_ADMIN_EMAIL` to the user from step 4.
7. In `firestore.rules` and `storage.rules`, replace `admin@example.com` with that same email.
8. Deploy the rules:
   ```
   npm i -g firebase-tools
   firebase login
   firebase use --add        # pick your project
   firebase deploy --only firestore:rules,storage
   ```
9. `npm run dev`, go to `/#/admin`, sign in with the Firebase password + PIN `1234`, press **Save** once to create `content/site`.

### Hosting
- **Vercel / Netlify**: add the same `VITE_*` variables in the project's Environment Variables, then redeploy.
- **Firebase Hosting**: `npm run build && firebase deploy --only hosting`.

The `VITE_FIREBASE_*` values are public by design; the security rules are what protect the data
(anyone can read content and submit enquiries; only the admin email can edit, upload, or read enquiries).
Changing the password in the admin panel updates the Firebase password too.
