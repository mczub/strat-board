# FF14 Strategy Board Renderer

A web application for viewing, sharing, and bundling FFXIV Strategy Board share codes. Renders strategy board visualizations from the in-game Strategy Board feature.

**Live Site:** [board.wtfdig.info](https://board.wtfdig.info)

## Features

- **View Strategy Boards** - Paste a `[stgy:...]` code to view the rendered strategy board
- **Share URLs** - Each board gets a shareable URL with OpenGraph image previews
- **Bundle Editor** - Create bundles of up to 10 strategy boards to share with a single link
- **In-Game Backgrounds** - Toggle between in-game accurate backgrounds and simple grid views
- **OG Image Generation** - Automatic preview images for social media sharing

## Getting Started

```bash
npm install
npm run dev
```

The app runs on Cloudflare Workers with wrangler:

```bash
npx wrangler dev
```

## Building For Production

```bash
npm run build
npx wrangler deploy
```

## Tech Stack

- **Framework:** TanStack Start (React + SSR)
- **Styling:** Tailwind CSS + Shadcn/ui
- **Hosting:** Cloudflare Workers
- **Storage:** Cloudflare KV (for bundles)
- **Decoding:** [xiv-strat-board](https://www.npmjs.com/package/xiv-strat-board) library

## Routes

| Route | Description |
|-------|-------------|
| `/` | Home page with paste-to-view |
| `/$code` | View a single strategy board |
| `/c/$code` | Compact view for embedding |
| `/b` | Bundle editor |
| `/b/$shareCode` | View a shared bundle |
| `/api/og` | OG image generation endpoint |

## Development

### Adding Icons

Strategy board icons are stored in `/public/icons/`. Run the icon data generator to update the embedded base64 data for OG images:

```bash
npx ts-node scripts/generate-icon-data.ts
```

### Background Images

In-game background images are stored in `/public/bg/` as WebP files.

## Credits

- **FINAL FANTASY XIV** is a registered trademark of Square Enix Holdings Co., Ltd.
- Made by Mara Kaminagi and S'aize Riya @ Adamantoise

## License

MIT License - see [LICENSE](LICENSE) file for details.
