import { Api, JsonRpc } from 'enf-eosjs';
import { JsSignatureProvider } from 'enf-eosjs/dist/eosjs-jssig';
import { TextEncoder, TextDecoder } from 'text-encoding';
import crossFetch from 'cross-fetch';

let lastApiNodeIndex = 0;
export const apiNodes = [
    'https://api.mainnet.ultra.io/',
    'https://ultra.eosrio.io/',
    'https://ultra.eosusa.io/',
    'https://api.ultra.eossweden.org/',
    // Cryptolions is capability-correct but rate-limits by dropping TCP
    // connections, so keep it as the last-resort endpoint.
    'https://api.ultra.cryptolions.io/'
];
const maxApiRetries = apiNodes.length;

export const accountNamesFromAuthorizers = (
    accounts: Array<{ account_name: string }>
): string[] => [...new Set<string>(accounts.map(({ account_name }) => account_name))];

// Every chain request MUST have a hard timeout. cross-fetch delegates to node-fetch,
// whose default timeout is 0 — i.e. wait forever. With no timeout a single stalled socket
// makes refreshUser() never settle, so Promise.all in updateUsers() never resolves, the
// `finally` that clears isUpdating never runs, and every subsequent interval returns early
// at the `if (isUpdating) return` guard. The bot then stops refreshing roles PERMANENTLY
// while staying 1/1 Ready and passing its liveness probe, so nothing alarms.
//
// That is not hypothetical: uniq-token-discord-bot-prod hung this way on 2026-07-17 and
// was not noticed for 3 days 10 hours. A timeout turns that silent permanent hang into an
// ordinary request failure, which roundRobingRequest already handles by rotating to the
// next API node.
const REQUEST_TIMEOUT_MS = Number(process.env.BLOCKCHAIN_REQUEST_TIMEOUT_MS) || 15000;

const apis = apiNodes.map((n) => new Api({
    rpc: new JsonRpc(n, {
        fetch(input, init) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
            return crossFetch(input as string, { ...init, signal: controller.signal } as any)
                .finally(() => clearTimeout(timer));
        },
    }),
    textEncoder: new TextEncoder(),
    textDecoder: new TextDecoder(),
    // The bot performs read-only RPC calls and must not carry a signing key.
    signatureProvider: new JsSignatureProvider([])
}));

/**
 * Allows to provide arbitrary callback to perform on the available Blockchain API.
 * In case request fails the function will try to use the callback on the next API
 *
 * @param {(api: Api) => Promise<any>} callback
 * @return {*} 
 */
const roundRobingRequest = async (callback: (api: Api) => Promise<any>) => {
    let requestErrors: any[] = [];
    for (let i = 0; i < maxApiRetries; i++) {
        let newLastApiNodeIndex = lastApiNodeIndex;
        const result = await callback(apis[lastApiNodeIndex])
            .catch((err) => {
                requestErrors.push(err);
                //console.error(err);
                return null;
            });
        if (result) return result;
        newLastApiNodeIndex++;
        if (newLastApiNodeIndex >= apis.length) newLastApiNodeIndex = 0;
        // Parallel requests may try to independently increment the counter
        // To combat that we only increment it up (or to 0 in case it loops back)
        if (newLastApiNodeIndex > lastApiNodeIndex || newLastApiNodeIndex == 0) {
            lastApiNodeIndex = newLastApiNodeIndex;
            console.log(`Switching to API with index ${lastApiNodeIndex}`);
        }
    }
    console.log(`Failed to make blockchain API request: ${requestErrors}`);
    return null;
}

/**
 * Makes a request to blockchain API to get account names associated with public key and will retry
 * with different API node in case of failure
 *
 * @param {string} publicKey
 * @return {Promise<string[] | null>}
 */
const roundRobinGetAccountsByAuthorizers = async (publicKey: string) => {
    const result = await roundRobingRequest((api) => api.rpc.fetch(
        '/v1/chain/get_accounts_by_authorizers',
        { keys: [publicKey], accounts: [] }
    ));
    if (result?.accounts) {
        return accountNamesFromAuthorizers(result.accounts);
    }
    return null;
}

/**
 * Makes a request to blockchain API to get table rows and will retry with different API node in case
 * of failure
 *
 * @param {*} - get_table_rows request arguments
 * @return {*} - Blockchain smart contract table rows
 */
const roundRobingGetTableRows = async ({ json, code, scope, table, table_key, lower_bound, upper_bound, index_position, key_type, limit, reverse, show_payer, }: any) => {
    const result = await roundRobingRequest((api) => { return api.rpc.get_table_rows(
        {
            json,
            code,
            scope,
            table,
            table_key,
            lower_bound,
            upper_bound,
            index_position,
            key_type,
            limit,
            reverse,
            show_payer
        });
    });
    if (result) return result;
    return null;
}

/**
 * Returns an array of blockchain ids that belong to a public key.
 *
 * @export
 * @param {string} publicKey
 * @return {Promise<string[] | null>}
 */
export async function getAccountsByKey(publicKey: string): Promise<string[] | null> {
    const account_names = await roundRobinGetAccountsByAuthorizers(publicKey);
    if (account_names) return account_names;
    console.log(`Failed to get accounts by key from any API`);
    return null;
}

/**
 * Retrieves data from a specified table in a smart contract on the blockchain.
 *
 * @export
 * @param {string} contract - The name of the smart contract on the blockchain that contains the table.
 * @param {string} scope - The scope within the contract in which the table is found.
 * @param {string} table - The name of the table as specified by the contract abi.
 * @param {number} lowerBound - `lowerBound` is an optional parameter that specifies the lower bound of
 * the primary key value of the table rows to be retrieved. If provided, only table rows with primary
 * key values greater than or equal to `lowerBound` will be returned. If not provided, all table rows
 * will be returned.
 * @param {number} upperBound - The `upperBound` parameter is an optional parameter used to specify the
 * upper bound of the primary key value of the table rows to be retrieved. If specified, only table
 * rows with primary key values less than or equal to the `upperBound` will be returned. If not
 * specified, all table rows
 *
 * @returns a Promise that resolves to the result containing table rows. If there is an error, the function catches it and returns `null`.
 */
export async function getTableData(
    contract: string,
    scope: string,
    table: string,
    lowerBound: number | null = null,
    upperBound: number | null = null
) {
    let result = await roundRobingGetTableRows({
        json: true,
        code: contract,
        scope,
        table,
        upper_bound: upperBound,
        lower_bound: lowerBound,
    });
    if (result) return result;
    console.log(`Failed to get table data from any API`);
    return null;
}

/**
 * This function retrieves all data from a specified table in a blockchain and returns it as an array.
 *
 * This recursively calls itself until all data is returned.
 *
 * @param {string} code The contract to call
 * @param {string} scope The scope of the table
 * @param {string} table The name of the table
 * @param {number | null} [lower_bound=null] Used to identify where to fetch rows from a table.
 * @returns An array of objects which can be specified as a generic type.
 */
export async function getAllTableData<T = Object>(
    code: string,
    scope: string,
    table: string,
    lower_bound: number | null = null
): Promise<T[] | null> {
    let rows: any[] = [];

    let data = await roundRobingGetTableRows({ code, scope, table, json: true, lower_bound });
    if (!data) {
        return null;
    }
    if (!data.rows) {
        return [];
    }

    rows = rows.concat(data.rows);
    if (data.more) {
        const newRows = await getAllTableData<T>(code, scope, table, data.next_key);
        if (newRows) {
            rows = rows.concat(newRows);
        }
        else {
            // failed to get the rest of the table data
            return null;
        }
    }

    return rows;
}
