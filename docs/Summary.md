# Summary

Below explains the general workflow of the program, and what it does

- An Administrator of the server will assign a factory to a discord role.
- A user uses a command in your Discord Server to bind their Discord Account to the Ultra Blockchain.
- A user will then receive a private message with a prefilled URL that points to a WebServer that this bot is running alongside itself.
- The user will then visit the attached URL.
- The user will either be prompted to connect to the Ultra Wallet extension, or obtain the Ultra Wallet Extension.
- Upon connecting they will be asked to `sign` a message with their blockchain account.
- A callback URL will be invoked back to this bot with the signed message.
- We now have identified that the user owns the blockchain account and we can store that into a database.
  - Stores the Discord ID
  - Stores the Blockchain ID
  - Stores the Signature
- After the internal logic of the bot will lookup the blockchain id and bind roles to the discord user based on what Uniq's they own and have in their inventory.
- If a matching token factory is found in the user's inventory they are given a discord role that matches it.
- Perioidic updates are done to add / remove roles based on users who are stored in the Database.

## Folder Structure

This repository uses a small `monorepo` structure and both the `client` and `server` files can be found under the `packages` folder.

### Client

This is where the HTML data lives, and includes all the necessary files for a small single page application. 

[Read more about the client...](../packages/client/README.md)

### Server

This is where the backend data lives. This handles database writing, verifying signatures, and Discord commands.

[Read more about the server...](../packages/server/README.md)