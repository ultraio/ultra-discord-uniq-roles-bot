# Ultra Uniq Discord Bot

Our goal with this bot is to allow users of our Blockchain to easily bind Uniq Factories against Discord Roles. 

Which allows for users of Discord to bind their Discord Account to the Ultra Blockchain.

Upon connecting their account to this bot it will then periodically update roles for a user based on what roles have bindings with a uniq factory.

## Brief Concept

* A user uses a command in your Discord Server to bind their Discord Account to the Ultra Blockchain.
* A user will then receive a private message with a prefilled URL that points to a WebServer that this bot is running alongside itself.
* The user will then visit the attached URL.
* The user will either be prompted to connect to the Ultra Wallet extension, or obtain the Ultra Wallet Extension.
* Upon connecting they will be asked to `sign` a message with their blockchain account.
* Doing so will prove that they own a blockchain account.
* A callback URL will be invoked back to the host with the signed message.
* We now have identified that the user owns the blockchain account and we can store that into a database.
  * Stores the Discord ID
  * Stores the Blockchain ID
* After the internal logic of the bot will lookup the blockchain id and bind roles to the discord user based on what Uniq's they own and have in their inventory.

## Discord Bot Setup

* Visit [Discord Developer Panel](https://discord.com/developers/applications/) and create a new application.

* Open the new application, and click on the Bot tab.

* Turn the application into a bot.

* Create an `.env` file for this bot, or find a way to pass environment variables for this bot.
  * If testing locally `.env` should be located in `packages/server`.

* Append the following likes to the `.env` file.
  * DISCORD_BOT_TOKEN
    * Obtained under the Bot tab in the Developer Panel
  * APPLICATION_ID
    * Obtained under the General Information tab in the Developer Panel
  * GUILD_ID
    * ID of the server where this bot is added
  * WEBSERVER_PORT
    * What port to run the WebServer under
  * CNAME
    * Change this to a real URL, or the address of your host if deploying into production.
```sh
DISCORD_BOT_TOKEN=
APPLICATION_ID=
GUILD_ID=
WEBSERVER_PORT=3000
CNAME=localhost
```

* Upon filling out this information, you will also need to deploy the presence of the bot to your Discord server.

* In the Discord Developer Panel click on OAuth2, and go to URL Generator.

* In the first section tick `bot`.

* In the second section tick `Read Messages / View Channels`

* Copy the link at the bottom, and paste it into your browse.

* The link will let you determine where you can add the bot based on the servers you have Administrative priviledge for.

_Never ever, give a bot Administrative Priviledge_

## Deploying the Bot

* [NodeJS 16+](https://nodejs.org/en/download)

* Install Dependencies First
    * `npm install`

* Create an `.env` file or pass environment variables to the application.

### Production

Builds both Client & Server, then Starts the Bot.

HTML files are automatically built to `packages/server/dist/html`.

```
npm run start -ws
```

### Development

Use this if you are making changes; it builds the client-side, and then starts the server-side. It is recommended

HTML files are automatically built to `packages/server/dist/html`.

```
npm run dev -ws
```