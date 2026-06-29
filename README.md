# Hotel Flow

Booking site for a fictional beach resort — search, filter and book rooms, a
booking flow with a confirmation screen, and a small admin panel to manage
reservations. Built with [Next.js](https://nextjs.org) (App Router) and
[Tailwind CSS](https://tailwindcss.com), in Spanish/English/Portuguese.

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- Next.js (App Router)
- React
- Tailwind CSS
- pnpm

## Structure

- `components/HotelFlowApp.jsx` — the app: home, results, room detail,
  booking, confirmation and admin screens, all client-side state.
- `lib/data.js` — room catalog and seed reservations.
- `lib/i18n.js` — es/en/pt copy.
- `lib/icons.js` + `components/Icon.jsx` — inline icon set.

## Deploy

Deploys to [Vercel](https://vercel.com) with no extra configuration.
