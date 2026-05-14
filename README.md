# Casino-Sim

A web-based casino simulator built with Next.js and React. Currently features a fully playable Blackjack table with chip-based betting, splits, doubles, and a Five Card Charlie rule. Additional games (Craps, Roulette, Poker, Slots) are stubbed in the menu and coming soon.

## Tech Stack

- **Next.js** 16 (App Router)
- **React** 19
- **TypeScript** 5
- **Tailwind CSS** 4
- **ESLint** 9

## Project Structure

```
Casino-Sim/
├── blackjack-casino/        # Next.js application
│   ├── app/
│   │   ├── page.tsx         # Main menu (game selection)
│   │   ├── game/page.tsx    # Blackjack table
│   │   └── layout.tsx
│   ├── lib/                 # Deck + blackjack rules
│   ├── components/          # CardView and other UI
│   ├── types/               # Shared TS types (Card, etc.)
│   └── public/
│       ├── BlackJackTable.png
│       └── Cards/           # Card face/back sprites
└── CasinoAssets/            # Source art and fonts
```

## Getting Started

From the `blackjack-casino/` directory:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and pick a game from the menu.

### Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start the dev server     |
| `npm run build` | Production build         |
| `npm run start` | Run the production build |
| `npm run lint`  | Lint with ESLint         |

## Blackjack Rules

- Starting balance: **$1000**
- Chip denominations: **1, 5, 10, 50, 100**
- Standard actions: **Hit**, **Stand**, **Double Down**, **Split**
- Blackjack pays **3:2**
- **Five Card Charlie**: drawing five cards without busting pays **3:1**
- Dealer hits on 16, stands on 17
- Push returns the bet

readme created by Claude Code
