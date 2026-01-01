export { FixedSizeSet } from './FixedSizeSet.js';
export { ObjectCache } from './ObjectCache.js';
export { CompareCache } from './CompareCache.js';
export { Lazy } from './Lazy.js';
export { StringWalker } from './StringWalker.js';
/**
 * Applies the mixin to a given class.
 *
 * @param baseClass - class to receive the mixin
 * @param mixinClass - mixin class
 * @param overrides - an array with names of function overrides. Base class
 * functions whose names are in this array will be kept by prepending an
 * underscore to their names.
 */
export function applyMixin(baseClass, mixinClass, ...overrides) {
    Object.getOwnPropertyNames(mixinClass.prototype).forEach(name => {
        if (name !== "constructor") {
            if (overrides.indexOf(name) !== -1) {
                const orgPropDesc = Object.getOwnPropertyDescriptor(baseClass.prototype, name);
                /* istanbul ignore else */
                if (orgPropDesc) {
                    Object.defineProperty(baseClass.prototype, "_" + name, orgPropDesc);
                }
            }
            const propDesc = Object.getOwnPropertyDescriptor(mixinClass.prototype, name);
            /* istanbul ignore else */
            if (propDesc) {
                Object.defineProperty(baseClass.prototype, name, propDesc);
            }
        }
    });
}
/**
 * Applies default values to the given object.
 *
 * @param obj - an object
 * @param defaults - an object with default values
 * @param overwrite - if set to `true` defaults object always overwrites object
 * values, whether they are `undefined` or not.
 */
export function applyDefaults(obj, defaults, overwrite = false) {
    const result = clone(obj || {});
    forEachObject(defaults, (key, val) => {
        if (isPlainObject(val)) {
            result[key] = applyDefaults(result[key], val, overwrite);
        }
        else if (overwrite || result[key] === undefined) {
            result[key] = val;
        }
    });
    return result;
}
/**
 * Iterates over items of an array or set.
 *
 * @param arr - array or set to iterate
 * @param callback - a callback function which receives each array item as its
 * single argument
 * @param thisArg - the value of this inside callback
 */
export function forEachArray(arr, callback, thisArg) {
    arr.forEach(callback, thisArg);
}
/**
 * Iterates over key/value pairs of a map or object.
 *
 * @param obj - map or object to iterate
 * @param callback - a callback function which receives object key as its first
 * argument and object value as its second argument
 * @param thisArg - the value of this inside callback
 */
export function forEachObject(obj, callback, thisArg) {
    if (isMap(obj)) {
        obj.forEach((value, key) => callback.call(thisArg, key, value));
    }
    else {
        for (const key in obj) {
            /* istanbul ignore else */
            if (obj.hasOwnProperty(key)) {
                callback.call(thisArg, key, obj[key]);
            }
        }
    }
}
/**
 * Returns the number of entries in an array or set.
 *
 * @param arr - array or set
 */
export function arrayLength(obj) {
    if (isSet(obj)) {
        return obj.size;
    }
    else {
        return obj.length;
    }
}
/**
 * Returns the number of entries in a map or object.
 *
 * @param obj - map or object
 */
export function objectLength(obj) {
    if (isMap(obj)) {
        return obj.size;
    }
    else {
        return Object.keys(obj).length;
    }
}
/**
 * Gets the value of a key from a map or object.
 *
 * @param obj - map or object
 * @param key - the key to retrieve
 */
export function getObjectValue(obj, key) {
    if (isMap(obj)) {
        return obj.get(key);
    }
    else {
        return obj[key];
    }
}
/**
 * Removes a property from a map or object.
 *
 * @param obj - map or object
 * @param key - the key to remove
 */
export function removeObjectValue(obj, key) {
    if (isMap(obj)) {
        obj.delete(key);
    }
    else {
        delete obj[key];
    }
}
/**
 * Deep clones the given object.
 *
 * @param obj - an object
 */
export function clone(obj) {
    if (isFunction(obj)) {
        return obj;
    }
    else if (isArray(obj)) {
        const result = [];
        for (const item of obj) {
            result.push(clone(item));
        }
        return result;
    }
    else if (isPlainObject(obj)) {
        const result = {};
        for (const key in obj) {
            /* istanbul ignore next */
            if (obj.hasOwnProperty(key)) {
                const val = obj[key];
                result[key] = clone(val);
            }
        }
        return result;
    }
    else {
        return obj;
    }
}
/**
 * Type guard for boolean types
 *
 * @param x - a variable to type check
 */
export function isBoolean(x) {
    return typeof x === "boolean";
}
/**
 * Type guard for numeric types
 *
 * @param x - a variable to type check
 */
export function isNumber(x) {
    return typeof x === "number";
}
/**
 * Type guard for strings
 *
 * @param x - a variable to type check
 */
export function isString(x) {
    return typeof x === "string";
}
/**
 * Type guard for function objects
 *
 * @param x - a variable to type check
 */
export function isFunction(x) {
    return !!x && typeof x === 'function';
}
/**
 * Type guard for JS objects
 *
 * _Note:_ Functions are objects too
 *
 * @param x - a variable to type check
 */
export function isObject(x) {
    const type = typeof x;
    return !!x && (type === 'function' || type === 'object');
}
/**
 * Type guard for arrays
 *
 * @param x - a variable to type check
 */
export function isArray(x) {
    return Array.isArray(x);
}
/**
 * Type guard for sets.
 *
 * @param x - a variable to check
 */
export function isSet(x) {
    return x instanceof Set;
}
/**
 * Type guard for maps.
 *
 * @param x - a variable to check
 */
export function isMap(x) {
    return x instanceof Map;
}
/**
 * Determines if `x` is an empty Array or an Object with no own properties.
 *
 * @param x - a variable to check
 */
export function isEmpty(x) {
    if (isArray(x)) {
        return !x.length;
    }
    else if (isSet(x)) {
        return !x.size;
    }
    else if (isMap(x)) {
        return !x.size;
    }
    else if (isObject(x)) {
        for (const key in x) {
            if (x.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    }
    return false;
}
/**
 * Determines if `x` is a plain Object.
 *
 * @param x - a variable to check
 */
export function isPlainObject(x) {
    if (isObject(x)) {
        const proto = Object.getPrototypeOf(x);
        const ctor = proto.constructor;
        return proto && ctor &&
            (typeof ctor === 'function') && (ctor instanceof ctor) &&
            (Function.prototype.toString.call(ctor) === Function.prototype.toString.call(Object));
    }
    return false;
}
/**
 * Determines if `x` is an iterable Object.
 *
 * @param x - a variable to check
 */
export function isIterable(x) {
    return x && (typeof x[Symbol.iterator] === 'function');
}
/**
 * Gets the primitive value of an object.
 */
export function getValue(obj) {
    if (isFunction(obj.valueOf)) {
        return obj.valueOf();
    }
    else {
        return obj;
    }
}
/**
 * UTF-8 encodes the given string.
 *
 * @param input - a string
 */
export function utf8Encode(input) {
    const bytes = new Uint8Array(input.length * 4);
    let byteIndex = 0;
    for (let i = 0; i < input.length; i++) {
        let char = input.charCodeAt(i);
        if (char < 128) {
            bytes[byteIndex++] = char;
            continue;
        }
        else if (char < 2048) {
            bytes[byteIndex++] = char >> 6 | 192;
        }
        else {
            if (char > 0xd7ff && char < 0xdc00) {
                if (++i >= input.length) {
                    throw new Error("Incomplete surrogate pair.");
                }
                const c2 = input.charCodeAt(i);
                if (c2 < 0xdc00 || c2 > 0xdfff) {
                    throw new Error("Invalid surrogate character.");
                }
                char = 0x10000 + ((char & 0x03ff) << 10) + (c2 & 0x03ff);
                bytes[byteIndex++] = char >> 18 | 240;
                bytes[byteIndex++] = char >> 12 & 63 | 128;
            }
            else {
                bytes[byteIndex++] = char >> 12 | 224;
            }
            bytes[byteIndex++] = char >> 6 & 63 | 128;
        }
        bytes[byteIndex++] = char & 63 | 128;
    }
    return bytes.subarray(0, byteIndex);
}
/**
 * UTF-8 decodes the given byte sequence into a string.
 *
 * @param bytes - a byte sequence
 */
export function utf8Decode(bytes) {
    let result = "";
    let i = 0;
    while (i < bytes.length) {
        var c = bytes[i++];
        if (c > 127) {
            if (c > 191 && c < 224) {
                if (i >= bytes.length) {
                    throw new Error("Incomplete 2-byte sequence.");
                }
                c = (c & 31) << 6 | bytes[i++] & 63;
            }
            else if (c > 223 && c < 240) {
                if (i + 1 >= bytes.length) {
                    throw new Error("Incomplete 3-byte sequence.");
                }
                c = (c & 15) << 12 | (bytes[i++] & 63) << 6 | bytes[i++] & 63;
            }
            else if (c > 239 && c < 248) {
                if (i + 2 >= bytes.length) {
                    throw new Error("Incomplete 4-byte sequence.");
                }
                c = (c & 7) << 18 | (bytes[i++] & 63) << 12 | (bytes[i++] & 63) << 6 | bytes[i++] & 63;
            }
            else {
                throw new Error("Unknown multi-byte start.");
            }
        }
        if (c <= 0xffff) {
            result += String.fromCharCode(c);
        }
        else if (c <= 0x10ffff) {
            c -= 0x10000;
            result += String.fromCharCode(c >> 10 | 0xd800);
            result += String.fromCharCode(c & 0x3FF | 0xdc00);
        }
        else {
            throw new Error("Code point exceeds UTF-16 limit.");
        }
    }
    return result;
}
//# sourceMappingURL=index.js.map