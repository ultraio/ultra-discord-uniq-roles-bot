# Ultra Uniq Discord Bot

Our goal with this bot is to allow users of our Blockchain to easily bind Uniq Factories against Discord Roles.

Which allows for users of Discord to bind their Discord Account to the Ultra Blockchain.

Upon connecting their account to this bot it will then periodically update roles for a user based on what roles have bindings with a uniq factory.

[Read More...](./docs/Summary.md)

[Read About Client...](https://github.com/ultraio/ultra-discord-uniq-roles-bot-website/blob/main/README.md)

[Read About Server...](./packages/server/README.md)

<br />

## ⚙️ Prerequisites

- [NodeJS 16+](https://nodejs.org/en/download)

- [Discord Bot Setup](./docs/DiscordBotSetup.md)

- [Discord Bot Message Signing Website](https://github.com/ultraio/ultra-discord-uniq-roles-bot-website)

<br />

## 🚀 Setup

Clone the repository

```
git clone https://github.com/ultraio/ultra-discord-uniq-roles-bot
```

Navigate into the newly created folder

```
cd ultra-discord-uniq-roles-bot
```

Install npm packages

```
npm install
```

Create an `.env` file in the `packages/server` folder.

Fill it out with the environment variable information.

See [the Environment Variables section for more info](./docs/EnvironmentVariables.md).

See [the Discord Bot Setup](./docs//DiscordBotSetup.md) to deploy your bot.

```
DISCORD_BOT_TOKEN=
APPLICATION_ID=
GUILD_ID=
WEBSERVER_PORT=3000
BOT_CNAME=localhost
SIGNING_CNAME=localhost
MONGODB_URL=mongodb://USERNAME:PASSWORD@HOST
SINGLE_USER_REFRESH_INTERVAL_MS=50
```

## 🏁 Start the Bot

Depending on your environment and usecase you will want to use one of the following commands to start the bot.

### Production

Builds the Server, then Starts the Bot. Uses `.env` values

```
npm run start -ws
```

### Development

Use this if you are making changes.

Ultra Wallet requires an HTTP(s) server to work with it.

This starts the server and uses default values for config instead of `.env`

```
npm run dev -w packages/server
```

## Docker

These are general purpose docker instructions based off this repository.

Start by adding your `.env` file to `packages/server/.env`

Run the following to start the bot.

```
docker build -t uniqbot .
```

```
docker compose up
```
