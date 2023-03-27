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
}
