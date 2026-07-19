# Mussalla de Montréal — « La caisse »

A transparency app for a Montréal prayer space: every contribution and every expense
is visible to the community — live on a TV in the prayer hall and on members' phones —
and people give toward shared goals together. The whole interface is in **Québec French**;
money is in **CAD** (`18 360 $`).

Built on a Next.js 16 (App Router) + React 19 + Tailwind v4 skeleton, following its
feature-slice architecture (`app → features → shared → core`).

## The four surfaces

| Surface | Route | What it is |
| --- | --- | --- |
| **Accueil** | `/accueil` | Landing/launcher — hero, live totals, links to the surfaces |
| **Vue téléphone** | `/` | The public board a QR scan opens. Mobile-first, read-only, `Faire un don` |
| **Faire un don** | `/don` | 5-step donation wizard (montant → destination → affichage → paiement → reçu) |
| **Écran TV** | `/tv` | Full-screen kiosk for the prayer hall — 4 auto-rotating pages + a real QR |
| **Backoffice** | `/admin` | Private manager console — dashboard, contributions, dépenses, objectifs, affichage, membres |

**Anonymity is enforced:** the backoffice shows the real name behind an anonymous gift;
the public surfaces (TV + phone) never do — but anonymous gifts still count in every total
and toward every goal.

## Run it

Requires **Node ≥ 22** and **pnpm**.

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

Then open:

- `http://localhost:3000/` — the phone board
- `http://localhost:3000/tv` — the TV kiosk (fullscreen the browser on the actual TV)
- `http://localhost:3000/admin` — the backoffice

**Backoffice demo login:** any non-empty email + password signs in (prototype auth; see
"Wiring the backend"). The Affichage section controls what the TV shows and how fast it rotates.

## Where the data lives (today)

There is **no database yet**. Every screen is computed from a typed seed layer in
[`src/core/data/`](src/core/data/) — `types.ts`, `seed.ts` (the sample board, transcribed
from the design), and `derive.ts` (balance, totals, goal progress). Money is stored as
**integer cents** everywhere; only [`src/lib/format.ts`](src/lib/format.ts) turns cents into
`fr-CA` text. This is the swappable seam: replace `getCaisseData()` with Supabase reads and
every surface keeps working unchanged.

## Quality gates

```bash
pnpm lint           # ESLint incl. module-boundary rules
pnpm typecheck      # tsc --noEmit (strict)
pnpm test           # vitest (incl. a test that locks the reference figures)
pnpm build          # production build
```

## Wiring the backend (next phase)

The UI is built against the seed layer so the backend drops in behind it. Planned:

1. **Supabase** — tables `members`, `contributions`, `expenses`, `goals`, `settings`
   (money as `*_cents` integers). RLS: public read of non-personal fields; writes behind
   manager auth. Swap `getCaisseData()` for server reads; the backoffice CRUD becomes
   zod-validated **server actions**. Real login replaces the prototype gate in
   [`src/features/backoffice/login.tsx`](src/features/backoffice/login.tsx) (the
   `src/features/auth` + `src/lib/supabase` scaffolding is already here).
2. **Realtime** — the TV subscribes to `settings` so backoffice changes (pin a page,
   change speed) reflect **live, no reload**. The seam is `setDisplay` in
   [`src/features/tv-display/store.ts`](src/features/tv-display/store.ts).
3. **Square (CAD, sandbox first)** — the Web Payments SDK mounts on the `Paiement` step
   (placeholder today in [`donation-flow.tsx`](src/features/donation/donation-flow.tsx)).
   On success a **signature-verified webhook** (`payment.created` / `payment.updated`)
   records the gift automatically; **Square Subscriptions** handle *mensuel* givers. Copy
   `.env.example` → `.env.local` and fill the `SQUARE_*` vars.

## Point the mussalla TV at the screen

Open `/tv` fullscreen on the TV's browser. It runs itself — the clock ticks and pages
rotate at the speed set in the backoffice (**Affichage**). The QR on screen links to the
phone board (`NEXT_PUBLIC_SITE_URL`).
