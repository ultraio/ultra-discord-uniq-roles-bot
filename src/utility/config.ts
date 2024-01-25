import * as I from '../interfaces';
import dotenv from 'dotenv';

const dotEnvConfig = dotenv.config();
let isInit = false;
let defaultConfig: I.Config = {
    CNAME: process.env.CNAME || 'localhost',
    SIGNING_CNAME: process.env.SIGNING_CNAME || 'https://discord.ultra.io/',
    DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
    APPLICATION_ID: process.env.APPLICATION_ID,
    GUILD_ID: process.env.GUILD_ID,
    WEBSERVER_PORT: process.env.WEBSERVER_PORT || 3000,
    VITE_PORT: 3102,
    MONGODB_URL: process.env.MONGODB_URL || 'mongodb://0.0.0.0:27017',
    SINGLE_USER_REFRESH_INTERVAL_MS: Number(process.env.SINGLE_USER_REFRESH_INTERVAL_MS) || 50,
};

/**
 * Get the current configuration passed to the application.
 *
 * @export
 * @return {Config}
 */
export function get(): I.Config {
    if (isInit) {
        return defaultConfig;
    }

    if (dotEnvConfig.parsed) {
        defaultConfig = Object.assign(defaultConfig, dotEnvConfig.parsed);
    }

    isInit = true;
    return defaultConfig;
}

/**
 * Used to override a configuration value
 *
 * @export
 * @param {string} key
 * @param {string} value
 */
export function set(key: string, value: string | number) {
    defaultConfig = Object.assign(defaultConfig, { [key]: value });
}
