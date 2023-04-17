import { factory, shared, user } from '../database';
import * as util from '../../utility';
import * as Services from '..';
import * as I from '../../interfaces';

let isUpdating = false;
let interval: NodeJS.Timer;

const tokenTables = ['token.a', 'token.b'];

export async function refreshUser(discord: string, blockchainid: string) {
    // Get all user tokens
    let tokens: Array<I.Token> = [];

    for (let table of tokenTables) {
        const rows = await Services.blockchain.getAllTableData<I.Token>('eosio.nft.ft', blockchainid, table);
        if (!Array.isArray(rows)) {
            continue;
        }

        tokens = tokens.concat(rows);
    }

    // Remove duplicates
    const tokenIds = [
        ...new Set(
            tokens.map((x) => {
                return x.token_factory_id;
            })
        ),
    ];

    // Get all user roles
    const userData = await Services.discord.getMemberAndRoles(discord);
    if (typeof userData === 'undefined') {
        return;
    }

    let amountAdded = 0;
    let amountRemoved = 0;

    // Loop through each role, and check if a factory exists.
    for (let role of userData?.roles) {
        const response = await factory.getFactoryByRole(role);
        if (!response || !response.status) {
            continue;
        }

        if (typeof response.data === 'string') {
            continue;
        }

        const factoryId = response.data.factory;
        const tokenIndex = tokenIds.findIndex((tokenId) => tokenId === factoryId);

        // If the factory exists; and the user has the token; keep the role.
        if (tokenIndex >= 0) {
            tokenIds.splice(tokenIndex, 1);
            continue;
        }

        // If the factory exists, and the user does not have the token; remove the role.
        await userData.member.roles.remove(role, 'No Longer Owns Token').catch((err) => {
            util.log.warn('Cannot Assign Roles');
            util.log.warn(`- Does bot role have manage roles?`);
            util.log.warn(`- Is bot role above all roles that it manages?`);
        });

        tokenIds.splice(tokenIndex, 1);
        amountRemoved += 1;
    }

    // Re-loop the tokens; and determine if a role exists for it
    // If it does exist; append the role.
    for (let token of tokenIds) {
        const response = await factory.getFactory(token);
        if (!response.status) {
            continue;
        }

        if (typeof response.data === 'string') {
            continue;
        }

        if (userData.member.roles.cache.has(response.data.role)) {
            continue;
        }

        await userData.member.roles.add(response.data.role).catch((err) => {
            util.log.warn('Cannot Assign Roles');
            util.log.warn(`- Does bot role have manage roles?`);
            util.log.warn(`- Is bot role above all roles that it manages?`);
        });

        amountAdded += 1;
    }

    util.log.info(
        `${userData.member.user.username}#${userData.member.user.discriminator} | Roles +${amountAdded} & -${amountRemoved} | Token Count: ${tokenIds.length}`
    );
}

/**
 * This function updates all users in a database by iterating through each user and calling the
 * updateUser function. This is done periodically, and if called while still waiting for updates to finish
 * it will decline to update until the original call is completed.
 */
async function updateUsers() {
    if (isUpdating) {
        return;
    }

    isUpdating = true;
    const startTime = Date.now();
    util.log.info(`Refresh Started`);

    const db = await shared.getDatabase();
    if (typeof db === 'undefined') {
        isUpdating = false;
        return;
    }

    const promises: Array<Promise<void>> = [];
    const collection = db.collection(user.getCollectionName());
    const cursor = collection.find();

    let document: I.db.dDiscordUser | null;

    while ((document = (await cursor.next()) as I.db.dDiscordUser)) {
        promises.push(refreshUser(document.discord, document.blockchain));
    }

    await Promise.all(promises);

    util.log.info(`Refresh Finished | ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
    isUpdating = false;
}

/**
 * Initialize the user update loop
 *
 * @export
 * @param {number} [msTimeBetweenUpdates=60000]
 * @return {true}
 */
export function init(msTimeBetweenUpdates = 60000) {
    if (!interval) {
        interval = setInterval(updateUsers, msTimeBetweenUpdates);
        util.log.info(`User Refresh Every ${Math.floor(msTimeBetweenUpdates / 1000)}s`);
        updateUsers();
    }

    return true;
}
