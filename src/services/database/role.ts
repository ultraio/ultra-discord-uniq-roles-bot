import * as shared from './shared';
import * as I from '../../interfaces';
import { Role, dRole } from 'interfaces/database';

const COLLECTION_NAME = 'roles';

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

    const roleDocument = await getDocumentByRole(discordRole);
    if (typeof roleDocument.data !== 'string') {
        if (roleDocument.data.uosThreshold && roleDocument.data.uosThreshold > 0) {
            return { status: false, data: 'cannot use factory and UOS threshold requirement in the same role' };
        }
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
 * Returns associated roles that contain factory requirement.
 *
 * @export
 * @return {(Promise<I.Response<dRole[] | string>>)}
 */
export async function getFactoryDocuments(): Promise<I.Response<dRole[] | string>> {
    const db = await shared.getDatabase();
    if (typeof db === 'undefined') {
        return { status: false, data: 'database could not be found' };
    }

    const collection = db.collection(COLLECTION_NAME);
    const roleDocuments = await collection.find<dRole>({ factory: { $ne : null } });
    let response: dRole[] = [];
    while (await roleDocuments.hasNext().catch((err) => {
        return null;
    })) {
        let document = await roleDocuments.next().catch((err) => {
            return null;
        });
        // Search filter already checked that factories is not null
        if (document){
            if (document.factories.length > 0) response.push(document);
        }
        else break;
    }

    return { status: true, data: response };
}

/**
 * Returns associated role document based on role id.
 *
 * @export
 * @param {string | number} role
 * @return {(Promise<I.Response<dRole | string>>)}
 */
export async function getDocumentByRole(role: number | string): Promise<I.Response<dRole | string>> {
    const db = await shared.getDatabase();
    if (typeof db === 'undefined') {
        return { status: false, data: 'database could not be found' };
    }

    const collection = db.collection(COLLECTION_NAME);
    const roleDocument = await collection.findOne<dRole>({ role }).catch((err) => {
        return null;
    });

    if (roleDocument === null || typeof roleDocument === 'undefined') {
        return { status: false, data: 'role document was not found' };
    }

    return { status: true, data: roleDocument };
}

/**
 * Deletes a role from the db. Returns the role object that was deleted
 *
 * @export
 * @param {string | number} role
 * @return {(Promise<I.Response<dRole | string>>)}
 */
export async function deleteRole(role: number | string): Promise<I.Response<dRole | string>> {
    const roleDocument = await getDocumentByRole(role);
    if (roleDocument.status === false) {
        return { status: false, data: 'role does not exist in the database' };
    }

    const db = await shared.getDatabase();
    if (typeof db === 'undefined') {
        return { status: false, data: 'database could not be found' };
    }

    if (typeof roleDocument.data === 'string') {
        return { status: false, data: 'role does not exist in the database' };
    }

    // Delete role from database
    const collection = db.collection<Role>(COLLECTION_NAME);
    await collection.deleteOne({ _id: roleDocument.data._id });

    return { status: true, data: roleDocument.data };
}

/**
 * Checks if UOS threshold exists in the database.
 * Returns the associated role object, if found.
 *
 * @export
 * @param {number} factory
 * @return {(Promise<I.Response<dRole | string>>)}
 */
export async function getUosThreshold(uosThreshold: number): Promise<I.Response<dRole | string>> {
    const db = await shared.getDatabase();
    if (typeof db === 'undefined') {
        return { status: false, data: 'database could not be found' };
    }

    const collection = db.collection(COLLECTION_NAME);
    const uosThresholdDocument = await collection.findOne<dRole>({ uosThreshold: uosThreshold }).catch((err) => {
        return null;
    });

    if (uosThresholdDocument === null || typeof uosThresholdDocument === 'undefined') {
        return { status: false, data: 'UOS threshold was not found' };
    }

    return { status: true, data: uosThresholdDocument };
}

/**
 * Add a UOS threshold to a role.
 * If the role doesn't exists, a new document is created.
 *
 * @export
 * @param {number} uosThreshold
 * @param {string} discordRole
 * @return {Promise<I.Response<string>>}
 */
export async function addUosThreshold(uosThreshold: number, discordRole: string): Promise<I.Response<string>> {
    const uosThresholdDocument = await getUosThreshold(uosThreshold);
    if (uosThresholdDocument.status === true) {
        return { status: true, data: 'UOS threshold already has an entry' };
    }

    const db = await shared.getDatabase();
    if (typeof db === 'undefined') {
        return { status: false, data: 'database could not be found' };
    }

    const roleDocument = await getDocumentByRole(discordRole);
    if (typeof roleDocument.data !== 'string') {
        if (roleDocument.data.factories && roleDocument.data.factories.length > 0) {
            return { status: false, data: 'cannot use factory and UOS threshold requirement in the same role' };
        }
    }

    const collection = db.collection<Role>(COLLECTION_NAME);
    const result = await collection
        .findOneAndUpdate(
            { role: discordRole }, // query filter
            { $set: { role: discordRole, uosThreshold: uosThreshold }}, // data to update
            { upsert: true }
        )
        .catch((err) => {
            console.error(err);
            return undefined;
        });

    if (!result || !result.ok) {
        return { status: false, data: 'could not UOS threshold' };
    }

    return { status: true, data: 'added UOS threshold' };
}

/**
 * Removes a UOS threshold from a role. Returns the role object that was updated
 *
 * @export
 * @param {number} uosThreshold
 * @return {Promise<I.Response<dRole | string>>}
 */
export async function removeUosThreshold(uosThreshold: number): Promise<I.Response<dRole | string>> {
    const uosThresholdDocument = await getUosThreshold(uosThreshold);
    if (uosThresholdDocument.status === false) {
        return { status: false, data: 'UOS threshold does not exist in the database' };
    }

    const db = await shared.getDatabase();
    if (typeof db === 'undefined') {
        return { status: false, data: 'database could not be found' };
    }

    if (typeof uosThresholdDocument.data === 'string') {
        return { status: false, data: 'UOS threshold does not exist in the database' };
    }

    // Remove UOS threshold from the role object
    const collection = db.collection<Role>(COLLECTION_NAME);
    await collection.updateOne({ _id: uosThresholdDocument.data._id }, { $set: { uosThreshold: undefined } });

    return { status: true, data: uosThresholdDocument.data };
}

/**
 * Returns associated roles that contain UOS threshold requirement.
 *
 * @export
 * @return {(Promise<I.Response<dRole[] | string>>)}
 */
export async function getUosThresholdDocuments(): Promise<I.Response<dRole[] | string>> {
    const db = await shared.getDatabase();
    if (typeof db === 'undefined') {
        return { status: false, data: 'database could not be found' };
    }

    const collection = db.collection(COLLECTION_NAME);
    const roleDocuments = await collection.find<dRole>({ uosThreshold: { $ne : null } });
    let response: dRole[] = [];
    while (await roleDocuments.hasNext().catch((err) => {
        return null;
    })) {
        let document = await roleDocuments.next().catch((err) => {
            return null;
        });
        // Search filter already checked that uosThreshold is not null
        if (document){
            if (document.uosThreshold > 0) {
                console.log(`[DB Debug] UOS Threshold role found: threshold=${document.uosThreshold}, isHolder=${document.isUosHolderRole || false}`);
                response.push(document);
            }
        }
        else break;
    }

    return { status: true, data: response };
}

/**
 * Returns all roles that are currently managed by the Discord bot.
 *
 * @export
 * @return {(Promise<I.Response<dRole[] | string>>)}
 */
export async function getAllDocuments(): Promise<I.Response<dRole[] | string>> {
    const db = await shared.getDatabase();
    if (typeof db === 'undefined') {
        return { status: false, data: 'database could not be found' };
    }

    const collection = db.collection(COLLECTION_NAME);
    const roleDocuments = await collection.find<dRole>({});
    let response: dRole[] = [];
    while (await roleDocuments.hasNext().catch((err) => {
        return null;
    })) {
        let document = await roleDocuments.next().catch((err) => {
            return null;
        });
        if (document) response.push(document);
        else break;
    }

    return { status: true, data: response };
}

/**
 * Gets the current UOS holder role configuration.
 *
 * @export
 * @return {(Promise<I.Response<dRole | string>>)}
 */
export async function getUosHolderRole(): Promise<I.Response<dRole | string>> {
    const db = await shared.getDatabase();
    if (typeof db === 'undefined') {
        return { status: false, data: 'database could not be found' };
    }

    const collection = db.collection(COLLECTION_NAME);
    const uosHolderDocument = await collection.findOne<dRole>({ isUosHolderRole: true }).catch((err) => {
        return null;
    });

    if (uosHolderDocument === null || typeof uosHolderDocument === 'undefined') {
        return { status: false, data: 'UOS holder role was not found' };
    }

    console.log(`[DB Debug] UOS Holder role found: threshold=${uosHolderDocument.uosThreshold}`);
    return { status: true, data: uosHolderDocument };
}

/**
 * Sets the UOS holder role, removing any existing UOS holder role.
 * This creates a special role that is managed separately from regular UOS threshold roles.
 *
 * @export
 * @param {number} uosThreshold
 * @param {string} discordRole
 * @return {Promise<I.Response<string>>}
 */
export async function setUosHolderRole(uosThreshold: number, discordRole: string): Promise<I.Response<string>> {
    const db = await shared.getDatabase();
    if (typeof db === 'undefined') {
        return { status: false, data: 'database could not be found' };
    }

    const collection = db.collection<Role>(COLLECTION_NAME);

    // First, remove any existing UOS holder role
    await collection.updateMany(
        { isUosHolderRole: true },
        { $unset: { isUosHolderRole: true } }
    );

    // Check if the role already exists and has factories
    const roleDocument = await getDocumentByRole(discordRole);
    if (typeof roleDocument.data !== 'string') {
        if (roleDocument.data.factories && roleDocument.data.factories.length > 0) {
            return { status: false, data: 'cannot use factory and UOS holder role requirement in the same role' };
        }
    }

    // Set the new UOS holder role
    const result = await collection
        .findOneAndUpdate(
            { role: discordRole }, // query filter
            { 
                $set: { 
                    role: discordRole, 
                    uosThreshold: uosThreshold,
                    isUosHolderRole: true 
                }
            }, // data to update
            { upsert: true }
        )
        .catch((err) => {
            console.error(err);
            return undefined;
        });

    if (!result || !result.ok) {
        return { status: false, data: 'could not set UOS holder role' };
    }

    return { status: true, data: 'UOS holder role set successfully' };
}