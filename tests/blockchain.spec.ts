import { strict as assert } from 'assert';
import {
    accountNamesFromAuthorizers,
    apiNodes,
} from '../src/services/blockchain';

describe('blockchain RPC configuration', () => {
    it('uses only the verified HTTPS mainnet endpoints', () => {
        assert.deepEqual(apiNodes, [
            'https://api.mainnet.ultra.io/',
            'https://ultra.eosrio.io/',
            'https://ultra.eosusa.io/',
            'https://api.ultra.eossweden.org/',
            'https://api.ultra.cryptolions.io/',
        ]);
    });

    it('maps authorizer rows to unique account names', () => {
        assert.deepEqual(accountNamesFromAuthorizers([
            { account_name: 'accountone' },
            { account_name: 'accountone' },
            { account_name: 'accounttwo' },
        ]), ['accountone', 'accounttwo']);
    });
});
