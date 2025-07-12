# Ultra Uniq Discord Bot

Our goal with this bot is to allow users of our Blockchain to easily bind Uniq Factories against Discord Roles.

Which allows for users of Discord to bind their Discord Account to the Ultra Blockchain.

Upon connecting their account to this bot it will then periodically update roles for a user based on what roles have bindings with a uniq factory.

[Read More...](./docs/Summary.md)

[Read About Client...](https://github.com/ultraio/ultra-discord-uniq-roles-bot-website/blob/main/README.md)

[Read About Server...](./docs/Server.md)

<br />

## ⚙️ Prerequisites

- [NodeJS 16+](https://nodejs.org/en/download)

- [Discord Bot Setup](./docs/DiscordBotSetup.md)

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

Create an `.env` file in the root repository folder by copying the `.env.example`.

Fill it out with the environment variable information.

See [the Environment Variables section for more info](./docs/EnvironmentVariables.md).

See [the Discord Bot Setup](./docs//DiscordBotSetup.md) to deploy your bot.

```
DISCORD_BOT_TOKEN=
APPLICATION_ID=
GUILD_ID=
WEBSERVER_PORT=3000
CNAME=localhost
SIGNING_CNAME=https://discord.ultra.io/
MONGODB_URL=mongodb://USERNAME:PASSWORD@HOST
SINGLE_USER_REFRESH_INTERVAL_MS=50
DATABASE_NAME=UltraUniqLinks
```

## 🏁 Start the Bot

Depending on your environment and usecase you will want to use one of the following commands to start the bot.

### Production

Builds the Server, then Starts the Bot. Uses `.env` values

```
npm run start
```

### Development

Use this if you are making changes.

Ultra Wallet requires an HTTP(s) server to work with it.

This starts the server and uses default values for config instead of `.env`

Development mode may require you to run your own version of client for message signing. [Read About Client...](https://github.com/ultraio/ultra-discord-uniq-roles-bot-website/blob/main/README.md) instead of default one provided in `.env.example` under `SIGNING_CNAME`.

```
npm run dev
```

## Docker

These are general purpose docker instructions based off this repository.

Start by creating your `.env` at repository root (near the `Dockerfile`)

Run the following to start the bot.

```
docker build -t uniqbot .
```

```
docker compose up
```

## 📋 Discord Commands

### User Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `/link` | Link Discord account to Ultra blockchain | `/link` |
| `/unlink` | Unlink Discord account from Ultra blockchain | `/unlink` |
| `/hello` | Send greeting message with link button | `/hello` |

### Administrator Commands

#### Factory Management
| Command | Description | Usage |
|---------|-------------|-------|
| `/addfactory` | Bind factory to role | `/addfactory factory:123 role:@Role` |
| `/removefactory` | Remove factory from role | `/removefactory factory:123` |

#### UOS Threshold Management
| Command | Description | Usage |
|---------|-------------|-------|
| `/adduosthreshold` | Add UOS threshold to role | `/adduosthreshold uos_threshold:1000 role:@Role` |
| `/removeuosthreshold` | Remove UOS threshold from role | `/removeuosthreshold uos_threshold:1000` |

#### UOS Holder Role Management
| Command | Description | Usage |
|---------|-------------|-------|
| `/setuosholderrole` | Set single UOS holder role (replaces existing) | `/setuosholderrole uos_threshold:5000 role:@UOS_Holder` |

#### Role Management
| Command | Description | Usage |
|---------|-------------|-------|
| `/deleterole` | Delete role from database | `/deleterole role:@Role` |
| `/printrole` | List all managed roles | `/printrole [role:@Role]` |

### Command Details

- **User Commands**: Available to all users for account linking
- **Administrator Commands**: Require Administrator permissions
- **UOS Holder Role**: Special role system that allows only one UOS threshold role at a time
- **Factory Roles**: Based on Uniq token ownership
- **UOS Threshold Roles**: Based on UOS token balance

For detailed information about the UOS holder role system, see [UOS_HOLDER_ROLE_SOLUTION.md](./UOS_HOLDER_ROLE_SOLUTION.md).
