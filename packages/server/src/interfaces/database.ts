import { BSON } from 'mongodb';

/**
 * A discord user schema that has not been pushed to the Databse.
 */
export type DiscordUser = Omit<dDiscordUser, '_id'>;

/**
 * A discord user schema that is pulled from the database.
 *
 * @export
 * @interface dDiscordUser
 * @extends {Document}
 */
export interface dDiscordUser extends Document {
    /**
     * Discord User ID
     *
     * @type {string}
     * @memberof DiscordUser
     */
    discord: string;

    /**
     * Blockchain ID
     *
     * @type {string}
     * @memberof DiscordUser
     */
    blockchain: string;

    /**
     * Signature verifying discord, against factory.
     *
     * @type {string}
     * @memberof DiscordUser
     */
    signature: string;

    /**
     * Usually Date.now()
     *
     * @type {number}
     * @memberof DiscordUser
     */
    creation: number;
}

/**
 * A token factory schema that has not been pushed to the Databse.
 */
export type TokenFactory = Omit<dTokenFactory, '_id'>;

/**
 * A token factory schema that is pulled from the database.
 *
 * @export
 * @interface TokenFactory
 * @extends {Document}
 */
export interface dTokenFactory extends Document {
    /**
     * Factory associated with this document.
     *
     * @type {number}
     * @memberof dTokenFactory
     */
    factory: number;

    /**
     * The role associated with this document.
     *
     * @type {string}
     * @memberof dTokenFactory
     */
    role: string;
}

/**
 * A MongoDB Document Representation
 *
 * @export
 * @interface Document
 */
export interface Document {
    _id: BSON.ObjectId;
}
