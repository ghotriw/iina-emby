# iina-emby

Emby plugin for [IINA](https://iina.io).

> ⚠️ **WIP:** Playback sync, subtitles, and server auth are working, but the media browser UI is still in development.

## Setup

```bash
pnpm install
pnpm build

# Link to IINA plugins folder
ln -s "$(pwd)" ~/Library/Application\ Support/com.colliderli.iina/plugins/iina-emby.iinaplugin-dev
```

## Development

- `pnpm dev:plugin` — watch & rebuild plugin script
- `pnpm dev` — run web UI in browser (`localhost:5173`)
- `pnpm typecheck` — run `tsc --noEmit`

## License

MIT
