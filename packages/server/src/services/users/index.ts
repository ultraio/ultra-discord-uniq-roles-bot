import { factory, shared, user } from '../database';
import * as util from '../../utility';
import * as Services from '..';
import * as I from '../../interfaces';

let isUpdating = false;
let interval: NodeJS.Timer;

const tokenTables = ['token.a', 'token.b'];
const singleUserRefreshIntervalMs = 50;

export async function refreshUser(discord: string, blockchainId: string) {
    // Get all user tokens
    let tokens: Array<I.Token> = [];

    for (let table of tokenTables) {
        const rows = await Services.blockchain.getAllTableData<I.Token>('eosio.nft.ft', blockchainId, table);
        if (!Array.isArray(rows)) {
            util.log.warn('Failed to get uniqs owned');
            return;
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
    const tokenCount = tokenIds.length;

    // Get all user roles
    const userData = await Services.discord.getMemberAndRoles(discord);
    if (typeof userData === 'undefined') {
        return;
    }

    let amountAdded = 0;
    let amountRemoved = 0;

    // Loop through each role, and check if it's a factory role
    for (let role of userData?.roles) {
        const response = await factory.getFactoriesByRole(role);

        // If record not found, then this role is not a factory role - don't remove
        if (!response || !response.status || typeof response.data === 'string') {
            continue;
        }

        // If the role exits in the database, and user own at least one of the tokens
        // associated with the role, keep the role
        const factoryIds = response.data.factories;
        let tokenIndex = -1;

        // Try to find if the tokenIds are present in factoryIds for this role.
        // If present, it means user is eligible for this role.
        for (let i = 0; i < factoryIds.length; i++) {
            const factoryId = factoryIds[i];
            tokenIndex = tokenIds.findIndex((tokenId) => tokenId === factoryId);
            // if token was found, break the loop
            if (tokenIndex >= 0) {
                break;
            }
        }

        // If the factory exists; and the user has the token; keep the role.
        if (tokenIndex >= 0) {
            tokenIds.splice(tokenIndex, 1);
            continue;
        }

        // If the factory exists, and the user does not have the token; remove the role.
        await userData.member.roles.remove(role, 'No Longer Owns Token').catch((err) => {
            util.log.warn('Cannot Assign Roles. [Case: User no longer owns token]');
            util.log.warn(`- Does bot role have manage roles?`);
            util.log.warn(`- Is bot role above all roles that it manages?`);
        });

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

        // If user already have that role, skip
        if (userData.member.roles.cache.has(response.data.role)) {
            continue;
        }

        // If user doesn't have the role, and is eligible for it,
        // assign the role to user
        await userData.member.roles.add(response.data.role).catch((err) => {
            util.log.warn('Cannot Assign Roles. [Case: Adding role to user]');
            util.log.warn(`- Does bot role have manage roles?`);
            util.log.warn(`- Is bot role above all roles that it manages?`);
        });

        amountAdded += 1;
    }

    util.log.info(
        `${userData.member.user.username}#${userData.member.user.discriminator} | Roles +${amountAdded} & -${amountRemoved} | Token Count: ${tokenCount}`
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

    const config = util.config.get();

    const db = await shared.getDatabase();
    if (typeof db === 'undefined') {
        isUpdating = false;
        return;
    }

    const promises: Array<Promise<void>> = [];
    const collection = db.collection(user.getCollectionName());
    const cursor = collection.find();

    let document: I.db.dDiscordUser | null;
    let userInfo: I.db.dDiscordUser[] = [];
    while ((document = (await cursor.next()) as I.db.dDiscordUser)) {
        if (document) userInfo.push(document);
    }
    for (let i = 0; i < userInfo.length; i++) {
        promises.push(refreshUser(userInfo[i].discord, userInfo[i].blockchain));
        await new Promise((r) => setTimeout(r, config.SINGLE_USER_REFRESH_INTERVAL_MS));
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
