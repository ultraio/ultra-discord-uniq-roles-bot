import * as Utility from './utility';
import * as Services from './services';

const args = process.argv;

async function start() {
    let config = Utility.config.get();
    if (args.includes('--mode=dev')) {
        Utility.log.info(`Started in Development Mode`);
        Utility.config.set('VITE_PORT', 3102);
        Utility.config.set('WEBSERVER_PORT', 3101);
        config = Utility.config.get();
    }

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

    isRunning = await Services.database.shared.init();
    if (!isRunning) {
        Utility.log.error('Database service could not be started.');
        process.exit(1);
    }

    isRunning = Services.users.init();
    if (!isRunning) {
        Utility.log.error('User update service could not be started.');
        process.exit(1);
    }
}

start();
