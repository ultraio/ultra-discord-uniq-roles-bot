export interface Response<T = Object> {
    status: 'success' | 'fail' | 'error';
    data: T;
    message?: string;
}

type ConnectFunction = () => Promise<Response<{ blockchainid: string; publicKey: string }>>;

export interface UltraApi {
    /**
     * Connect to the ultra wallet extension
     *
     * @memberof UltraApi
     */
    connect: ConnectFunction;

    /**
     * Disconnect the wallet extension
     *
     * @memberof UltraApi
     */
    disconnect(): Promise<void>;

    /**
     * Sign a message and return the result.
     *
     * Message must start with 0x or UOSx
     *
     * @param {string} message
     * @return {Promise<string>}
     * @memberof UltraApi
     */
    signMessage(message: string): Promise<Response<{ signature: string }>>;
}
