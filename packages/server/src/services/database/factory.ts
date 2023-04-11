import * as shared from './shared';
import * as I from '../../interfaces';

import { TokenFactory, dTokenFactory } from 'interfaces/database';

const COLLECTION_NAME = 'factories';

/**
 * Add a factory with a discord role to the database.
 *
 * @export
 * @param {number} factory
 * @param {string} discordRole
 * @return {Promise<I.Response<string>>}
 */
export async function addFactory(factory: number, discordRole: string): Promise<I.Response<string>> {
    const factoryDocument = await getFactory(factory);
    if (factoryDocument.status === true) {
        return { status: true, data: 'factory already has an entry' };
    }

    const db = await shared.getDatabase();
    if (typeof db === 'undefined') {
        return { status: false, data: 'database could not be found' };
    }

    const collection = db.collection<TokenFactory>(COLLECTION_NAME);
    const result = await collection.insertOne({ factory, role: discordRole }).catch((err) => {
        console.error(err);
        return undefined;
    });

    if (!result || !result.acknowledged) {
        return { status: false, data: 'could not add factory' };
    }

    return { status: true, data: 'added factory' };
}

/**
 * Remove a token factory based on id
 *
 * @export
 * @param {number} factory
 * @return {Promise<I.Response<string>>}
 */
export async function removeFactory(factory: number): Promise<I.Response<string>> {
    const factoryDocument = await getFactory(factory);
    if (factoryDocument.status === false) {
        return { status: false, data: 'factory does not exist in the database' };
    }

    const db = await shared.getDatabase();
    if (typeof db === 'undefined') {
        return { status: false, data: 'database could not be found' };
    }

    if (typeof factoryDocument.data === 'string') {
        return { status: false, data: 'factory does not exist in the database' };
    }

    const collection = db.collection<TokenFactory>(COLLECTION_NAME);
    await collection.deleteOne({ _id: factoryDocument.data._id });

    return { status: true, data: 'factory removed' };
}

/**
 * Return a matching factory based on factory id.
 *
 * @export
 * @param {number} factory
 * @return {(Promise<I.Response<dTokenFactory | string>>)}
 */
export async function getFactory(factory: number): Promise<I.Response<dTokenFactory | string>> {
    const db = await shared.getDatabase();
    if (typeof db === 'undefined') {
        return { status: false, data: 'database could not be found' };
    }

    const collection = db.collection(COLLECTION_NAME);
    const factoryDocument = await collection.findOne<dTokenFactory>({ factory }).catch((err) => {
        return null;
    });

    if (factoryDocument === null || typeof factoryDocument === 'undefined') {
        return { status: false, data: 'factory was not found' };
    }

    return { status: true, data: factoryDocument };
}
