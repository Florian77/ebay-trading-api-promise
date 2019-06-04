const wrapArray = require('wrap-array');
const {path, is, split} = require('ramda');

/**
 *
 */
class EbayApiResponse {

    /**
     *
     * @param data
     */
    constructor(data) {
        this.data = data;
        // console.log(JSON.stringify(data, null, 2));
    }

    /**
     *
     * @returns {boolean}
     */
    ackSuccess() {
        return this.getAck() === 'Success'
    }

    /**
     *
     * @returns {boolean}
     */
    ackWarning() {
        return this.getAck() === 'Warning'
    }

    /**
     *
     * @returns {boolean}
     */
    ackFailure() {
        return this.getAck() === 'Failure'
    }

    /**
     *
     * @returns {string}
     */
    getAck() {
        if (this.data && this.data.Ack) {
            return String(this.data.Ack);
        }
        return 'Missing';
    }

    /**
     *
     * @returns {Array}
     */
    getErrors() {
        return this.getArray('Errors');
    }

    /**
     *
     * @param key
     * @returns {*}
     */
    get(key = false) {
        return key === false
            ? this.data
            : is(Array, key)
                ? path(wrapArray(key), this.data)
                : this.data[key];
    }

    /**
     *
     * @param key
     * @returns boolean
     */
    exist(key) {
        return undefined !== this.get(key);
    }

    /**
     *
     * @param dataPath
     * @returns {*}
     */
    getPath(dataPath) {
        dataPath = is(String, dataPath) ? split('.', dataPath) : dataPath;
        return this.get(dataPath);
    }

    /**
     *
     * @param dataPath
     * @returns {Array}
     */
    getPathArray(dataPath) {
        return wrapArray(this.getPath(dataPath));
    }

    /**
     *
     * @param key
     * @returns {Array}
     */
    getArray(key = false) {
        return wrapArray(this.get(key));
    }
}

module.exports = EbayApiResponse;