import { Db, MongoClient } from 'mongodb';
import * as Utility from '../../utility';

let client: MongoClient | undefined;
let isInitialized = false;

/**
 * Connect to a MongoDB Server
 *
 * @export
 * @return {Promise<boolean>}
 */
export async function init(): Promise<boolean> {
    const config = Utility.config.get();

    client = await MongoClient.connect(config.MONGODB_URL).catch((err) => {
        console.error(err);
        return undefined;
    });

    if (!client) {
        Utility.log.warn(`Failed to connect to MongoDB URL`);
        return false;
    }

    isInitialized = true;
    Utility.log.info('Connected to Database');
    return true;
}

/**
 * Check if the database has connected yet.
 *
 * @export
 * @return {*}
 */
export async function isConnected() {
    return new Promise((resolve: Function) => {
        const interval = setInterval(() => {
            if (isInitialized) {
                clearInterval(interval);
                return resolve();
            }
        }, 200);
    });
}

/**
 * Return the daatabase driver.
 *
 * @export
 */
export async function getDatabase(): Promise<Db | undefined> {
    await isConnected();
    const config = Utility.config.get();

    return client?.db(config.DATABASE_NAME);
}
