import * as Utility from './utility';
import * as Services from './services';

async function start() {
    const config = Utility.config.get();
    if (!config.DISCORD_BOT_TOKEN) {
        Utility.log.error('Discord bot token was not provided');
        process.exit(1);
    }

    let isRunning = await Services.discord.init(config.DISCORD_BOT_TOKEN);
    if (!isRunning) {
        Utility.log.error('Discord bot could not authenticate with given token');
        process.exit(1);
    }

    isRunning = await Services.express.init(config.WEBSERVER_PORT);
    if (!isRunning) {
        Utility.log.error('Express service could not be started.');
        process.exit(1);
    }
}

start();
