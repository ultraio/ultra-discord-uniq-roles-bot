import { role, shared, user } from '../database';
import * as util from '../../utility';
import * as Services from '..';
import * as I from '../../interfaces';

let isUpdating = false;
let interval: NodeJS.Timer;

const tokenTables = ['token.a', 'token.b'];

function defaultFailedToAssignRolesWarning(action: string) {
    util.log.warn(`Cannot Assign Roles. [Case: ${action}]`);
    util.log.warn(`- Does bot role have manage roles?`);
    util.log.warn(`- Is bot role above all roles that it manages?`);
}

export async function refreshUser(discord: string, blockchainId: string) {
    // Get all user tokens and UOS balance
    let tokens: Array<I.Token> = [];
    let uosBalance: number | undefined = undefined;

    for (let table of tokenTables) {
        const rows = await Services.blockchain.getAllTableData<I.Token>('eosio.nft.ft', blockchainId, table);
        if (!Array.isArray(rows)) {
            util.log.warn('Failed to get uniqs owned');
            return;
        }

        tokens = tokens.concat(rows);
    }
    {
        const rows = await Services.blockchain.getAllTableData<I.FungibleTokenBalance>('eosio.token', blockchainId, 'accounts');
        if (!Array.isArray(rows)) {
            util.log.warn('Failed to get UOS balance');
            return;
        }

        let uosBalanceObject = rows.find((r) => r.balance.split(' ')[1] === 'UOS');
        if (uosBalanceObject) {
            uosBalance = parseFloat(uosBalanceObject.balance.split(' ')[0]);
        }
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

    // Loop through each role, and check if it's a factory role and/or UOS threshold role
    for (let userRole of userData?.roles) {
        const response = await role.getDocumentByRole(userRole);

        // If record not found, then this role is not a factory role - don't remove
        if (!response || !response.status || typeof response.data === 'string') {
            continue;
        }

        // Check if the role is effectively empty
        // If so - remove it from the user
        if (I.db.isRoleEmpty(response.data)) {
            await userData.member.roles.remove(userRole, 'Role No Longer Managed').catch((err) => defaultFailedToAssignRolesWarning('User has a role that has no conditions'));
            amountRemoved += 1;
            continue;
        }

        // If the role exits in the database, and user owns at least one of the tokens
        // associated with the role, keep the role
        const factoryIds = response.data.factories;
        let tokenIndex = -1;

        // Skip if there is no factory array object
        if (!factoryIds) {
            continue;
        }

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
        await userData.member.roles.remove(userRole, 'No Longer Owns Token').catch((err) => defaultFailedToAssignRolesWarning('User no longer owns token'));

        amountRemoved += 1;
    }

    // Re-loop the tokens; and determine if a role exists for it
    // If it does exist; append the role.
    for (let token of tokenIds) {
        const response = await role.getFactory(token);
        if (!response.status) {
            continue;
        }

        if (typeof response.data === 'string') {
            continue;
        }

        // If user already has that role, skip
        if (userData.member.roles.cache.has(response.data.role)) {
            continue;
        }

        // If user doesn't have the role, and is eligible for it,
        // assign the role to user
        await userData.member.roles.add(response.data.role).catch((err) => defaultFailedToAssignRolesWarning('Adding factory role to user'));

        amountAdded += 1;
    }

    // Update UOS roles only if we were able to get UOS balance
    if (uosBalance) {
        // Handle regular UOS threshold roles
        let uosThresholdDocuments = await role.getUosThresholdDocuments();
        if (uosThresholdDocuments && uosThresholdDocuments.status && typeof uosThresholdDocuments.data !== 'string') {
            // Sort in descending order
            let roles = uosThresholdDocuments.data.sort((a, b) => b.uosThreshold - a.uosThreshold);
            let identifiedRole = null;
            for (let i = 0; i < roles.length; i++) {
                if (uosBalance >= roles[i].uosThreshold) {
                    // Only the highest role should be added
                    if (identifiedRole === null) {
                        identifiedRole = i;

                        // If user already has that role, skip
                        if (!userData.member.roles.cache.has(roles[i].role)) {
                            await userData.member.roles.add(roles[i].role).catch((err) => defaultFailedToAssignRolesWarning('Adding UOS threshold role to user'));
                            amountAdded += 1;
                        }
                    }
                }

                // If already has a role with higher UOS threshold - remove the lower roles
                if (i !== identifiedRole && userData.member.roles.cache.has(roles[i].role)) {
                    await userData.member.roles.remove(roles[i].role, 'No Longer Within the UOS Threshold').catch((err) => defaultFailedToAssignRolesWarning('User is no longer within UOS threshold'));
                    amountRemoved += 1;
                }
            }
        }

        // Handle UOS holder role (special role that replaces all other UOS threshold roles)
        let uosHolderRole = await role.getUosHolderRole();
        if (uosHolderRole && uosHolderRole.status && typeof uosHolderRole.data !== 'string') {
            const holderRole = uosHolderRole.data;
            
            // Check if user meets the UOS holder threshold
            if (uosBalance >= holderRole.uosThreshold) {
                // If user doesn't have the UOS holder role, add it
                if (!userData.member.roles.cache.has(holderRole.role)) {
                    await userData.member.roles.add(holderRole.role).catch((err) => defaultFailedToAssignRolesWarning('Adding UOS holder role to user'));
                    amountAdded += 1;
                }
            } else {
                // If user doesn't meet the threshold but has the role, remove it
                if (userData.member.roles.cache.has(holderRole.role)) {
                    await userData.member.roles.remove(holderRole.role, 'No Longer Meets UOS Holder Threshold').catch((err) => defaultFailedToAssignRolesWarning('User no longer meets UOS holder threshold'));
                    amountRemoved += 1;
                }
            }
        }
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
