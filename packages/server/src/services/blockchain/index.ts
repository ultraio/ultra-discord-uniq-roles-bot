import { Api, JsonRpc } from 'enf-eosjs';
import { JsSignatureProvider } from 'enf-eosjs/dist/eosjs-jssig';
import { TextEncoder, TextDecoder } from 'text-encoding';
import crossFetch from 'cross-fetch';

// This is an unused private key, it's meant for testing but in this case we just need it to exist here.
const defaultPrivateKey = '5JtUScZK2XEp3g9gh7F8bwtPTRAkASmNrrftmx4AxDKD5K4zDnr';
let lastApiNodeIndex = 0;
const apiNodes = [
    'https://api.mainnet.ultra.io/',
    'http://ultra.api.eosnation.io/',
    'https://ultra.eosrio.io/',
    'https://api.ultra.cryptolions.io/',
    'https://ultra.eosusa.io',
    'https://api.ultra.eossweden.org',
    'https://ultra-api.eoseoul.io/'
];
const maxApiRetries = apiNodes.length;

const apis = apiNodes.map((n) => new Api({
    rpc: new JsonRpc(n, {
        fetch(input, init) {
            return crossFetch(input as string, init);
        },
    }),
    textEncoder: new TextEncoder(),
    textDecoder: new TextDecoder(),
    signatureProvider: new JsSignatureProvider([defaultPrivateKey])
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
 * @return {Promise<string[]>} 
 */
const roundRobinHistoryGetKeyAccounts = async (publicKey: string) => {
    const { account_names } = await roundRobingRequest((api) => { return api.rpc.history_get_key_accounts(publicKey); });
    if (account_names) return account_names;
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
 * @return {Promise<string[]>}
 */
export async function getAccountsByKey(publicKey: string): Promise<string[] | null> {
    const { account_names } = await roundRobinHistoryGetKeyAccounts(publicKey);
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
    if (!data)
    {
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
