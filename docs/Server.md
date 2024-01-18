# Server

This utilizes express, and discord.js to create a Discord Bot with a page served alongside the bot.

## Folder Structure

The main logic lives inside of the `src/services` folder.

The bot will not start without starting every service successfully.

### services/blockchain

Handles various calls to the ultra main network chain
  
### services/database

Handles writing to a MongoDB collection for an individual user, or a token factory binding to a discord role
  
### services/discord

Handles all slash commands that are integrated with discord
  
### services/express

Handles feeding the compiled HTML static site to users who access the available endpoint that is provided by this bot
  
### services/messageProvider

Generates cached messages which are used to help identify a signature after a signature is signed by a blockchain account
  
### services/users

Handles refreshing user data and inventories and rebinding roles.