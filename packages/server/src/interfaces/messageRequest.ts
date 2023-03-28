export default interface MessageRequest {
    /**
     * When this message was created.
     *
     * @type {number}
     * @memberof MessageRequest
     */
    timestamp: number;

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
}
