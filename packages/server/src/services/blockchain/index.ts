import { Api, JsonRpc, RpcError } from 'enf-eosjs';
import { JsSignatureProvider } from 'enf-eosjs/dist/eosjs-jssig';
import { TextEncoder, TextDecoder } from 'text-encoding';
import crossFetch from 'cross-fetch';

// This is an unused private key, it's meant for testing but in this case we just need it to exist here.
const defaultPrivateKey = '5JtUScZK2XEp3g9gh7F8bwtPTRAkASmNrrftmx4AxDKD5K4zDnr';
const rpc = new JsonRpc('https://api.mainnet.ultra.io/', {
    fetch(input, init) {
        return crossFetch(input as string, init);
    },
});

const api = new Api({
    rpc,
    textEncoder: new TextEncoder(),
    textDecoder: new TextDecoder(),
    signatureProvider: new JsSignatureProvider([defaultPrivateKey]),
});

/**
 * Returns an array of blockchain ids that belong to a public key.
 *
 * @export
 * @param {string} publicKey
 * @return {Promise<string[]>}
 */
export async function getAccountsByKey(publicKey: string): Promise<string[]> {
    const { account_names } = await api.rpc.history_get_key_accounts(publicKey);
    return account_names;
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
    return api.rpc
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
}