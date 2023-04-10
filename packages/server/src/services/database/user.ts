import * as shared from './shared';
import * as I from '../../interfaces';

import { DiscordUser, dDiscordUser } from 'interfaces/database';

const COLLECTION_NAME = 'users';

/**
 * Add a discord user to the database.
 *
 * Automatically checks if the discord, or blockchain id are already linked.
 *
 * @export
 * @param {string} discord
 * @param {string} blockchain
 * @return {(Promise<I.Response<dDiscordUser | string>>)}
 */
export async function addUser(
    discord: string,
    blockchain: string,
    signature: string
): Promise<I.Response<dDiscordUser | string>> {
    const user = await getUser(discord, blockchain);
    if (user.status === true) {
        return { status: true, data: 'user is already linked with discord or blockchain id' };
    }

    const db = await shared.getDatabase();
    if (typeof db === 'undefined') {
        return { status: false, data: 'database could not be found' };
    }

    const collection = db.collection<DiscordUser>(COLLECTION_NAME);
    const result = await collection.insertOne({ discord, blockchain, signature, creation: Date.now() }).catch((err) => {
        console.error(err);
        return undefined;
    });

    if (!result || !result.acknowledged) {
        return { status: false, data: 'could not add user' };
    }

    return { status: true, data: 'added user' };
}

/**
 * Remove a discord user from the database
 *
 * @export
 * @param {string} discord
 * @return {Promise<I.Response<string>>}
 */
export async function removeUser(discord: string): Promise<I.Response<string>> {
    const discordUserDocument = await getUser(discord);
    if (discordUserDocument.status === false) {
        return { status: false, data: 'discord user does not exist in the database' };
    }

    const db = await shared.getDatabase();
    if (typeof db === 'undefined') {
        return { status: false, data: 'database could not be found' };
    }

    if (typeof discordUserDocument.data === 'string') {
        return { status: false, data: 'discord user does not exist in the database' };
    }

    const collection = db.collection<DiscordUser>(COLLECTION_NAME);
    await collection.deleteOne({ _id: discordUserDocument.data._id });

    return { status: true, data: 'discord user removed' };
}

/**
 * Return a database doucment for a user.
 *
 * Can use either the discord, or blockchain id for lookup.
 *
 * @export
 * @param {string} discord
 * @param {(string | undefined)} [blockchain=undefined]
 * @return {(Promise<I.Response<dDiscordUser | string>>)}
 */
export async function getUser(
    discord: string,
    blockchain: string | undefined = undefined
): Promise<I.Response<dDiscordUser | string>> {
    const db = await shared.getDatabase();
    if (typeof db === 'undefined') {
        return { status: false, data: 'database could not be found' };
    }

    const collection = db.collection(COLLECTION_NAME);
    const user = await collection.findOne<dDiscordUser>({ $or: [{ discord, blockchain }] }).catch((err) => {
        return null;
    });

    if (user === null || typeof user === 'undefined') {
        return { status: false, data: 'user is already linked with a discord or blockchain id' };
    }

    return { status: true, data: user };
}
