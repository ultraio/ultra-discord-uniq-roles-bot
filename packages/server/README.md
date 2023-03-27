# Server

This utilizes express, and discord.js to create a Discord Bot with a page served alongside the bot.

## Commands

From the root directory of this monorepo; run any of the following commands.

### Dev

Spins up a localhost server to perform development against for the server-side.

```
npm run -w server
```

### Build

Builds the client-side into a single page application, and pushes it to the server folder under `packages/server/dist/html`.

```
npm run build -w server
```

