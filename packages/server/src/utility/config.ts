import * as I from '../interfaces';
import dotenv from 'dotenv';

const dotEnvConfig = dotenv.config();
let isInit = false;
let defaultConfig: I.Config = {
    CNAME: 'localhost',
    DISCORD_BOT_TOKEN: undefined,
    WEBSERVER_PORT: 3000,
    VITE_PORT: 3102,
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
