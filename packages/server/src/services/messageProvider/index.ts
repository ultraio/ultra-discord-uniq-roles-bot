import * as I from '../../interfaces';
import * as Utility from '../../utility';
import { ecc } from 'enf-eosjs/dist/eosjs-ecc-migration';
import MersenneTwister from 'mersenne-twister';

const EXPIRATION_TIME_IN_MS = 60000 * 5; // 5 Minutes
const rng = new MersenneTwister();
const MessageRequests: Array<I.MessageRequest> = [];

/**
 * Returns the index of an entry based on discord identifier.
 *
 * @param {string} discord
 * @return {*}
 */
function getIndex(discord: string) {
    return MessageRequests.findIndex((x) => x.discordUser === discord);
}

/**
 * Automatically removes expired entries.
 */
function removeExpiredEntries() {
    let count = 0;

    for (let i = MessageRequests.length - 1; i >= 0; i--) {
        if (MessageRequests[i].timestamp + EXPIRATION_TIME_IN_MS < Date.now() && !MessageRequests[i].markAsExpired) {
            continue;
        }

        MessageRequests.splice(i, 1);
        count += 1;
    }

    if (count >= 1) {
        Utility.log.info(`Removed ${count} expired linking requests.`);
    }
}

/**
 * Returns a hash to pass to the client and stores the original data in memory.
 *
 * When generating entries, it automatically removes old entries.
 *
 * @export
 * @param {I.MessageRequest} message
 * @return {undefined | string}
 */
export function generate(message: Omit<I.MessageRequest, 'markAsExpired' | 'nonce'>): string | undefined {
    removeExpiredEntries();

    const index = getIndex(message.discordUser);
    if (index >= 0) {
        return undefined;
    }

    const request: I.MessageRequest = {
        ...message,
        nonce: rng.random_int(),
    };

    MessageRequests.push(request);
    return 'UOSx' + Utility.hash.sha256(JSON.stringify(request));
}

/**
 * When verifying an entry, it automatically removes expired entries.
 *
 * Pass a discord id for lookup, a signature to verify against, and the public key used for the signature.
 *
 * If everything passes; a response will be given.
 *
 * If the verification attempt fails it automatically marks the entry to be removed, and removes it.
 *
 * @export
 * @param {string} discord
 * @param {string} signedMessage
 * @return {{ message: string; status: boolean }}
 */
export function verify(discord: string, signature: string, publicKey: string): { message: string; status: boolean } {
    removeExpiredEntries();

    const index = getIndex(discord);
    if (index <= -1) {
        return { message: 'Failed to find linking request.', status: false };
    }

    const originalData = MessageRequests[index];
    const hashedData = 'UOSx' + Utility.hash.sha256(JSON.stringify(originalData));
    const didVerify = ecc.verify(signature, hashedData, publicKey);

    MessageRequests[index].markAsExpired = true;
    removeExpiredEntries();

    return didVerify ? { status: true, message: 'verified' } : { status: false, message: 'failed to verify signature' };
}
