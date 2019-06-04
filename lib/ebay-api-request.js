/**
 *
 */
class EbayApiRequest {

    /**
     *
     * @param apiCallName
     * @param compatLevel
     * @param siteId
     * @param authToken
     * @param body
     * @param retryCount
     */
    constructor(apiCallName, {compatLevel = null, siteId = null, authToken = '', body = '', retryCount = 2} = {}) {
        this.data = {};
        this.data.apiCallName = apiCallName;
        this.data.compatLevel = compatLevel ? compatLevel : defaultCompatLevel;
        this.data.siteId = siteId ? siteId : defaultSiteId;
        this.data.authToken = authToken;
        this.data.body = body;
        this.retryCount = retryCount;
    }

    /**
     *
     * @param value
     * @returns {*|this}
     */
    apiCallName(value = false) {
        if (value) {
            this.data.apiCallName = value;
            return this;
        }
        return this.data.apiCallName;
    }

    /**
     *
     * @param value
     * @returns {*|this}
     */
    compatLevel(value = false) {
        if (value) {
            this.data.compatLevel = value;
            return this;
        }
        return this.data.compatLevel;
    }

    /**
     *
     * @param value
     * @returns {*|this}
     */
    siteId(value = false) {
        if (value) {
            this.data.siteId = value;
            return this;
        }
        return this.data.siteId;
    }

    /**
     *
     * @param value
     * @returns {*|this}
     */
    authToken(value = false) {
        if (value) {
            this.data.authToken = value;
            return this;
        }
        return this.data.authToken;
    }

    /**
     *
     * @param value
     * @returns {*|this}
     */
    body(value = false) {
        if (value) {
            this.data.body = value;
            return this;
        }
        return this.data.body;
    }

    markRequestSend() {
        this.retryCount -= 1;
    }

    retryAllowed() {
        return this.retryCount > 0;
    }

    // TODO: at debug output remove token from String
    /*toString() {

    }*/
}

module.exports = EbayApiRequest;