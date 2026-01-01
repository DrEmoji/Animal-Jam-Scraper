/**
 * Represents an object with lazy initialization.
 */
export class Lazy {
    _initialized = false;
    _initFunc;
    _value;
    /**
     * Initializes a new instance of `Lazy`.
     *
     * @param initFunc - initializer function
     */
    constructor(initFunc) {
        this._value = undefined;
        this._initFunc = initFunc;
    }
    /**
     * Gets the value of the object.
     */
    get value() {
        if (!this._initialized) {
            this._value = this._initFunc();
            this._initialized = true;
        }
        return this._value;
    }
}
//# sourceMappingURL=Lazy.js.map