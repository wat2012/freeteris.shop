# FreeTetris.shop

A free online Tetris game with leaderboard functionality.

## Development Setup

1. Install Vercel CLI globally:
```bash
npm install -g vercel
```

2. Install project dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Open http://localhost:3000 in your browser

## Deployment

1. Deploy to Vercel:
```bash
npm run deploy
```

## Features

- Classic Tetris gameplay
- Real-time leaderboard
- Score persistence
- Daily and weekly rankings
- Responsive design
- Audio effects and background music

## API Endpoints

- `GET /api/scores?type=today&limit=10` - Get today's top scores
- `GET /api/scores?type=week&limit=10` - Get this week's top scores
- `POST /api/scores` - Submit a new score

## File Structure

```
d:\repo\freeteris.shop\
├── index.html          # Main game page
├── tetris.js          # Game logic
├── api/
│   └── scores.js      # Score management API
├── package.json       # Project configuration
├── vercel.json        # Vercel deployment config
└── README.md          # This file
```

## Local Development

For local development, you can use:
```bash
npx vercel dev
```

This will start the Vercel development server which properly handles the API routes.
