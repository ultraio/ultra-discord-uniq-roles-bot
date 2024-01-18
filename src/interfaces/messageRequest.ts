export default interface MessageRequest {
    /**
     * When this message expires
     *
     * @type {number}
     * @memberof MessageRequest
     */
    expiration: number;

    /**
     * The expected discord user.
     *
     * @type {string}
     * @memberof MessageRequest
     */
    discordUser: string;

    /**
     * The original message that will be used for signing.
     *
     * @type {string}
     * @memberof MessageRequest
     */
    originalMessage: string;

    /**
     * Arbitrary number to associate with this request.
     *
     * @type {number}
     * @memberof MessageRequest
     */
    nonce?: number;

    /**
     * Force expire an entry.
     *
     * @type {boolean}
     * @memberof MessageRequest
     */
    markAsExpired?: boolean;

    /**
     * Assigned after hashing all othe properties in this object.
     *
     * Omit this value to create the original hash from the data set.
     *
     * @type {string}
     * @memberof MessageRequest
     */
    originalHash?: string;
}
