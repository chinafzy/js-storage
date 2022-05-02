declare type SetOpts = {
    expireAt?: number;
    expireAfter?: number;
};
declare type RegisterOpts = SetOpts & {
    initNow?: boolean;
};
/**
 * A jsStorage,
 */
declare class JsStorage {
    #private;
    zone: string;
    /**
     *
     * @param zone Separate zone for saving data.
     * @param engine localStorage(default) or sessionStorage
     */
    constructor(zone?: string, engine?: Storage);
    /**
     * Get  value in sync mode.
     *
     * @param key
     * @returns undefined on missing, any value(include null) on succeed.
     */
    get(key: string): any;
    /**
     * Set value.
     *
     * @param key
     * @param value any value, includes null
     * @param opts
     */
    set(key: string, value: any, opts?: SetOpts): void;
    remove(key: string): void;
    /**
     * Get all the keys under current zone.
     *
     * @returns Array for keys, or empty array if none is found.
     */
    keys(): string[];
    /**
     * Register a value getter.
     *
     * @param key
     * @param fnLoader function to load the value. Both sync mode and Promise are supported.
     * @param opts
     * @see getRegistered
     * @see get2
     */
    register(key: string, fnLoader: Function, opts?: RegisterOpts): void;
    /**
     * Return a registered value in Promise mode.
     *
     * @param key
     * @returns
     */
    getRegistered(key: string): any;
    /**
     * Alias for getRegistered(key)
     *
     * @param key
     * @returns
     * @see getRegistered
     */
    get2(key: string): any;
}
export default JsStorage;
