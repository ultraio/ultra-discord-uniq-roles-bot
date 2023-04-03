export interface ServerResponse {
    /**
     * Was the check successful
     *
     * @type {boolean}
     * @memberof ServerResponse
     */
    status: boolean;

    /**
     * Was the message successful
     *
     * @type {string}
     * @memberof ServerResponse
     */
    message: string;
}
