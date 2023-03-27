import { createHash } from 'crypto';

/**
 * Generates a sha256 hash
 *
 * @export
 * @param {string} data
 */
export function sha256(data: string) {
    return createHash('sha256').update(data).digest('hex');
}
