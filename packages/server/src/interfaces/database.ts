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
 * A role schema that has not been pushed to the Database.
 */
export type Role = Omit<dRole, '_id'>;

/**
 * A role schema that is pulled from the database.
 *
 * @export
 * @interface Role
 * @extends {Document}
 */
export interface dRole extends Document {
    /**
     * Factories associated with this role.
     *
     * @type {Array<number>}
     * @memberof dRole
     */
    factories: Array<number>;

    /**
     * The role id for this role.
     *
     * @type {string}
     * @memberof dRole
     */
    role: string;

    /**
     * Flag to specify is this role is a custom role.
     * Custom roles are managed by this service.
     */
    isManaged: boolean;
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
