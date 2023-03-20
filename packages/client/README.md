# Client Page

This utilizes Vite to create a single page application that utilizes Vue.

## Commands

From the root directory of this monorepo; run any of the following commands.

### Vue Development Server

Spins up a localhost server to perform development against for the client-side.

```
npm run vue-dev -w client
```

### Build

Builds the client-side into a single page application, and pushes it to the server folder under `packages/server/dist/html`.

```
npm run build -w client
```

