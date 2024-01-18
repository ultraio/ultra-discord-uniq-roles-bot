export default interface Config {
    /**
     * The Discord Bot token to authenticate with
     *
     * @type {string}
     * @memberof Config
     */
    DISCORD_BOT_TOKEN?: string;

    /**
     * Application ID from the developer panel for your bot.
     *
     * @type {string}
     * @memberof Config
     */
    APPLICATION_ID?: string;

    /**
     * The guild where this bot is deployed.
     *
     * @type {string}
     * @memberof Config
     */
    GUILD_ID?: string;

    /**
     * The port in which to run the express server on
     *
     * @type {number}
     * @memberof Config
     */
    WEBSERVER_PORT: number | string;

    /**
     * Default Vite Port for dev mode
     *
     * @type {number}
     * @memberof Config
     */
    VITE_PORT: number;

    /**
     * Change this to the webserver name, or a full url if deploying to production
     *
     * @type {string}
     * @memberof Config
     */
    CNAME: string;

    /**
     * Change this to the signing static website name, or a full url if deploying to production
     *
     * @type {string}
     * @memberof Config
     */
    SIGNING_CNAME: string;

    /**
     * MongoDB connection string
     *
     * @type {string}
     * @memberof Config
     */
    MONGODB_URL: string;

    /**
     * Delay between individual account role refresh requests
     *
     * @type {number}
     * @memberof Config
     */
    SINGLE_USER_REFRESH_INTERVAL_MS: number;
}
