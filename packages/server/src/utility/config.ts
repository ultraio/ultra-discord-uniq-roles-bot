import * as I from '../interfaces';
import dotenv from 'dotenv';

const dotEnvConfig = dotenv.config();
let defaultConfig: I.Config = {
    CNAME: 'localhost',
    DISCORD_BOT_TOKEN: undefined,
    WEBSERVER_PORT: 3000,
};

/**
 * Get the current configuration passed to the application.
 *
 * @export
 * @return {Config}
 */
export function get(): I.Config {
    if (dotEnvConfig.parsed) {
        defaultConfig = Object.assign(defaultConfig, dotEnvConfig.parsed);
    }

    return defaultConfig;
}
