export interface Response<T = Object> {
    status: 'success' | 'fail' | 'error';
    data: T;
    message?: string;
}

export interface UltraApi {
    /**
     * Connect to the ultra wallet extension
     *
     * @memberof Ultra
     */
    connect: () => Promise<Response<{ blockchainid: string; publicKey: string }>>;

    /**
     * Disconnect the wallet extension
     *
     * @memberof UltraApi
     */
    disconnect: () => Promise<void>;
}
