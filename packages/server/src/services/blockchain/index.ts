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

const api = apiNodes.map((n) => new Api({
    rpc: new JsonRpc(n, {
        fetch(input, init) {
            return crossFetch(input as string, init);
        },
    }),
    textEncoder: new TextEncoder(),
    textDecoder: new TextDecoder(),
    signatureProvider: new JsSignatureProvider([defaultPrivateKey])
}));

const getNextApi = () => {
    lastApiNodeIndex++;
    if (lastApiNodeIndex >= api.length) lastApiNodeIndex = 0;

    return api[lastApiNodeIndex];
}

/**
 * Returns an array of blockchain ids that belong to a public key.
 *
 * @export
 * @param {string} publicKey
 * @return {Promise<string[]>}
 */
export async function getAccountsByKey(publicKey: string): Promise<string[] | null> {
    for (let i = 0; i < maxApiRetries; i++) {
        console.log(`Using ${lastApiNodeIndex + 1}`);
        const { account_names } = await getNextApi().rpc.history_get_key_accounts(publicKey);

        if (account_names) return account_names;
        console.log(`API ${lastApiNodeIndex} failed, trying the next one`);
    }
    console.log(`Got accounts by key result`);
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
export function getTableData(
    contract: string,
    scope: string,
    table: string,
    lowerBound: number | null = null,
    upperBound: number | null = null
) {
    for (let i = 0; i < maxApiRetries; i++) {
        console.log(`Using ${lastApiNodeIndex + 1}`);
        let result = getNextApi().rpc
            .get_table_rows({
                json: true,
                code: contract,
                scope,
                table,
                upper_bound: upperBound,
                lower_bound: lowerBound,
            })
            .catch((err) => {
                console.error(err);
                return null;
            });

        if (result) return result;
        console.log(`API ${lastApiNodeIndex} failed, trying the next one`);
    }
    console.log(`Got table data result`);
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
    let data: any;
    for (let i = 0; i < maxApiRetries; i++) {
        console.log(`Using ${lastApiNodeIndex + 1}`);
        data = await getNextApi().rpc.get_table_rows({ code, scope, table, json: true, lower_bound }).catch((err) => {
            console.log(err);
            return undefined;
        });

        if (typeof data !== 'undefined') break;
        console.log(`API ${lastApiNodeIndex} failed, trying the next one`);
    }
    console.log(`Got all table data result`);

    if (typeof data === 'undefined' ) {
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
