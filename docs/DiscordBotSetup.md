# Discord Bot Setup

- Visit [Discord Developer Panel](https://discord.com/developers/applications/) and create a new application.

![](https://i.imgur.com/FdD2bQH.png)

- Open the new application, and click on the Bot tab.

- Turn the application into a bot.

_You will need to reset the secret to use it in the `.env` file that will be created during setup.

![](https://i.imgur.com/221WgdJ.png)

- You will also need to deploy the presence of the bot to your Discord server.

- In the Discord Developer Panel click on OAuth2, and go to URL Generator.

![](https://i.imgur.com/ckQPe1n.png)

- In the first section tick `bot`.

![](https://i.imgur.com/QEleOTF.png)

- In the second section tick `Read Messages / View Channels`

![](https://i.imgur.com/YIEXNFI.png)

- Copy the link at the bottom, and paste it into your browser.

![](https://i.imgur.com/ZebiVtR.png)

- The link will let you determine where you can add the bot based on the servers you have Administrative priviledge for.

_Never ever, give a bot Administrative Priviledge_