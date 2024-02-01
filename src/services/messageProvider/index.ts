import * as I from '../../interfaces';
import * as Utility from '../../utility';
import { Signer } from '@ultraos/ultra-signer-lib'
import MersenneTwister from 'mersenne-twister';

const EXPIRATION_TIME_IN_MS = 60000 * 5; // 5 Minutes
const rng = new MersenneTwister();
const MessageRequests: Array<I.MessageRequest> = [];

/**
 * Returns the index of an entry based on discord identifier.
 *
 * @param {string} discord
 * @return {number}
 */
function getIndex(discord: string): number {
    return MessageRequests.findIndex((x) => x.discordUser === discord);
}

/**
 * Return the index that belongs to a specific hash.
 *
 * @param {string} hash
 * @return {number}
 */
function getIndexByHash(hash: string): number {
    return MessageRequests.findIndex((x) => x.originalHash && x.originalHash === hash);
}

/**
 * Generate a hash based on data for signing.
 *
 * @param {string} data
 * @return {string}
 */
function getHash(data: string): string {
    return 'UOSx' + Utility.hash.sha256(data);
}

/**
 * Automatically removes expired entries.
 */
function removeExpiredEntries() {
    let count = 0;
    const currentTime = Date.now();

    for (let i = MessageRequests.length - 1; i >= 0; i--) {
        if (currentTime < MessageRequests[i].expiration && !MessageRequests[i].markAsExpired) {
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
export function generate(
    message: Omit<I.MessageRequest, 'markAsExpired' | 'nonce' | 'expiration'>
): string | undefined {
    removeExpiredEntries();

    const index = getIndex(message.discordUser);
    if (index >= 0) {
        return undefined;
    }

    const request: I.MessageRequest = {
        ...message,
        expiration: Date.now() + EXPIRATION_TIME_IN_MS,
        nonce: rng.random_int(),
        markAsExpired: false,
    };

    const originalHash = getHash(JSON.stringify(request));
    request.originalHash = originalHash;
    MessageRequests.push(request);
    return originalHash;
}

/**
 * When verifying an entry, it automatically removes expired entries.
 *
 * Pass the original hash for lookup, a signature to verify against, and the public key used for the signature.
 *
 * If everything passes; a response will be given.
 *
 * If the verification attempt fails it automatically marks the entry to be removed, and removes it.
 *
 * @export
 * @param {string} hash The original hash passed to the client
 * @param {string} signedMessage
 * @param {string} publicKey
 * @return {Promise<{ response: { message: string; status: boolean }; discord?: string }>}
 */
export async function verify(
    hash: string,
    signature: string,
    publicKey: string
): Promise<{ response: { message: string; status: boolean }; discord?: string }> {
    removeExpiredEntries();

    const index = getIndexByHash(hash);
    if (index <= -1) {
        return {
            response: {
                message: 'failed to find linking request',
                status: false,
            },
        };
    }

    const linkingRequest = MessageRequests[index];

    if (typeof linkingRequest.originalHash === 'undefined') {
        return {
            response: {
                message: 'failed to find linking request',
                status: false,
            },
        };
    }

    let didVerify = false;

    try {
        didVerify = await Signer.verify(signature, linkingRequest.originalHash, publicKey);
    } catch (err) {
        console.error(err);
    }

    const discord = MessageRequests[index].discordUser;
    MessageRequests[index].markAsExpired = true;
    removeExpiredEntries();

    return didVerify
        ? { response: { status: true, message: 'verified' }, discord }
        : { response: { status: false, message: 'failed to verify signature' } };
}
