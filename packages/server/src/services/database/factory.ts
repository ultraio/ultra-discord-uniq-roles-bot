import * as shared from './shared';
import * as I from '../../interfaces';
import { Role, dRole } from 'interfaces/database';

const COLLECTION_NAME = 'factories';

/**
 * Add a factory to a role.
 * If the role doesn't exists, a new document is created.
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

    const collection = db.collection<Role>(COLLECTION_NAME);
    const result = await collection
        .findOneAndUpdate(
            { role: discordRole }, // query filter
            { $set: { role: discordRole }, $push: { factories: factory } }, // data to update
            { upsert: true }
        )
        .catch((err) => {
            console.error(err);
            return undefined;
        });

    if (!result || !result.ok) {
        return { status: false, data: 'could not add factory' };
    }

    return { status: true, data: 'added factory' };
}

/**
 * Removes a token factory from a role. Returns the role object that was updated
 *
 * @export
 * @param {number} factory
 * @return {Promise<I.Response<dRole | string>>}
 */
export async function removeFactory(factory: number): Promise<I.Response<dRole | string>> {
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

    // Delete factoryId from the role object
    const collection = db.collection<Role>(COLLECTION_NAME);
    await collection.updateOne({ _id: factoryDocument.data._id }, { $pull: { factories: factory } });

    return { status: true, data: factoryDocument.data };
}

/**
 * Checks if a factory id exists in the database.
 * Returns the associated role object, if found.
 *
 * @export
 * @param {number} factory
 * @return {(Promise<I.Response<dRole | string>>)}
 */
export async function getFactory(factory: number): Promise<I.Response<dRole | string>> {
    const db = await shared.getDatabase();
    if (typeof db === 'undefined') {
        return { status: false, data: 'database could not be found' };
    }

    const collection = db.collection(COLLECTION_NAME);
    const factoryDocument = await collection.findOne<dRole>({ factories: factory }).catch((err) => {
        return null;
    });

    if (factoryDocument === null || typeof factoryDocument === 'undefined') {
        return { status: false, data: 'factory was not found' };
    }

    return { status: true, data: factoryDocument };
}

/**
 * Returns associated factories based on role id.
 *
 * @export
 * @param {string | number} role
 * @return {(Promise<I.Response<dRole | string>>)}
 */
export async function getFactoriesByRole(role: number | string): Promise<I.Response<dRole | string>> {
    const db = await shared.getDatabase();
    if (typeof db === 'undefined') {
        return { status: false, data: 'database could not be found' };
    }

    const collection = db.collection(COLLECTION_NAME);
    const factoryDocument = await collection.findOne<dRole>({ role }).catch((err) => {
        return null;
    });

    if (factoryDocument === null || typeof factoryDocument === 'undefined') {
        return { status: false, data: 'factory was not found' };
    }

    return { status: true, data: factoryDocument };
}
