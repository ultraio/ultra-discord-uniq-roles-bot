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
