# MERN Portfolio + Admin

A modern, animated portfolio for a full-stack / DevOps engineer, with a **full-control admin panel**.
Everything on the public site is editable from `/admin`, with no code changes needed.

**Stack:** MongoDB · Express · React (Vite) · Node.js. Docker and Compose files are included.

## What the admin controls

| Tab | You can… |
| --- | --- |
| Profile & hero | Name, logo, availability badge, headline, intro, typing phrases, email and social links, résumé link |
| Sections & text | Turn the pipeline animation, tech ticker, About, Work, Experience and Contact on or off, and rewrite every section heading and blurb |
| Appearance | Default theme (light, dark or device), accent colour, browser-tab title, footer text |
| Projects / Skills / Experience | Add, edit, delete, hide, and reorder (↑ ↓) |
| Messages | Read messages from the contact form, mark read or unread, reply, delete (unread badge in the sidebar) |
| Backup | Download everything as JSON, or restore from a backup file |
| Account | Change the admin email and password |

Visitors still get the light/dark toggle button, and their choice is remembered.

## Quick start

Requires Node 18+ and a MongoDB instance (local or Atlas).

```bash
cp server/.env.example server/.env     # then edit it (MONGO_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD)
npm run install:all
npm run dev
```

- Site: http://localhost:5173
- Admin: http://localhost:5173/admin
- API: http://localhost:5000/api

On first boot the server creates the admin user from `ADMIN_EMAIL` / `ADMIN_PASSWORD` and fills the site with sample content.
**Sign in, then change the password in Admin → Account.**

## Production

```bash
npm run build     # builds client/dist
npm start         # Express serves the API and the built React app on :5000
```

### Docker

```bash
JWT_SECRET=$(openssl rand -hex 32) ADMIN_PASSWORD='a-long-password' docker compose up --build -d
```

The site is then served on http://localhost:5000, with MongoDB persisted in a volume.

## Project layout

```
server/src   index.js (app), routes.js (API), models.js (Mongoose), seed.js (first-run data)
client/src   Portfolio.jsx (public site), admin/ (panel), api.js, theme.js, styles.css
```

## Security notes

- Passwords are hashed with bcrypt; the API uses JWT (7 days). Set a long random `JWT_SECRET`.
- Login is rate-limited (10 attempts per 15 min), the contact form is limited and has a honeypot field.
- Only known schema fields are accepted on writes. Helmet sets security headers and a strict CSP.
- The token lives in `localStorage`. Serve the site over HTTPS in production.
- Everything under `/api/admin` requires the token. Only `/api/content`, `/api/messages` (POST) and `/api/auth/login` are public.
