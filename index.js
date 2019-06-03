'use strict';

/**
 * Node client for eBay Trading API.
 */

const https = require('https');
const js2xmlparser = require('js2xmlparser');
const xml2jsPareseString = require('xml2js').parseString;

const Queue = require('promise-queue');
let queue = null; // new Queue(25, Infinity);

let defaultCompatLevel = 1081; // released 2018-Sep-28
let defaultSiteId = 77; // Germany
let debugOutput = false;

// Application keys
const appKeySet = {
    appId: '',
    devId: '',
    certId: ''
};

// TODO: load appKeySet from ENV vars


module.exports.initQueue = initQueue;
module.exports.setAppKeySet = setAppKeySet;
module.exports.setDefaultCompatLevel = setDefaultCompatLevel;
module.exports.setDefaultSiteId = setDefaultSiteId;
module.exports.setDebugOutput = setDebugOutput;
module.exports.newRequest = newRequest;
module.exports.execute = execute;


/**
 *
 * @param appId
 * @param devId
 * @param certId
 */
function setAppKeySet({appId, devId, certId}) {
    appKeySet.appId = appId;
    appKeySet.devId = devId;
    appKeySet.certId = certId;
    return this;
}

/**
 *
 * @param maxConcurrent
 * @param maxQueue
 */
function initQueue(maxConcurrent = 25, maxQueue = Infinity) {
    queue = new Queue(maxConcurrent, maxQueue);
    return this;
}

/**
 *
 * @param value
 * @returns {setDefaultCompatLevel}
 */
function setDefaultCompatLevel(value) {
    defaultCompatLevel = value;
    return this;
}

/**
 *
 * @param value
 * @returns {setDefaultSiteId}
 */
function setDefaultSiteId(value) {
    defaultSiteId = value;
    return this;
}

/**
 *
 * @param value
 * @returns {setDefaultSiteId}
 */
function setDebugOutput(value) {
    debugOutput = value;
    return this;
}

/**
 *
 * @param apiCallName
 * @returns {EbayApiRequest}
 */
function newRequest(apiCallName) {
    return new EbayApiRequest(apiCallName);
}

/**
 *
 * @param request
 * @returns {Promise<any>}
 */
function execute(request) {
    return new Promise((resolve, reject) => {
        getQueue()
            .add(() => processCall(request))
            /** @var result typeof EbayApiResponse */
            .then(result => {

                if (debugOutput) console.log('Queue Length:', getQueue().getQueueLength(), 'Pending:', getQueue().getPendingLength(), 'request', request.apiCallName(), 'Ack:', result.getAck());

                // check for Error 10007 and try again
                if (result.ackFailure() === true) {

                    // Interner Anwendungsfehler
                    // TODO: create and add method: [for check] isErrorCode(10007)
                    if (result.getErrors().length === 1 && result.getErrors()[0].ErrorCode === '10007' && request.retryAllowed()) {
                        // console.log('PageNumber Request:', request.body.Pagination.PageNumber, 'Result: ERROR -- RETRY -- ', JSON.stringify(result.getErrors(),null,2));
                        execute(request)
                            .then(retryResult => {
                                resolve(retryResult);
                            })
                            .catch(err => {
                                reject(err);
                            })
                        ;
                    } else {
                        // console.log('PageNumber Request:', request.body.Pagination.PageNumber, 'Result: ERROR', JSON.stringify(result.getErrors(),null,2));

                        resolve(result);
                    }

                } else {
                    // console.log('PageNumber Request:', request.body.Pagination.PageNumber, 'Result:', result.get('PageNumber'));
                    resolve(result);
                }

                /*if( typeof result.get('PageNumber') === "undefined"  ) {
                    console.log(JSON.stringify(result.get(), null, 2));
                }*/
                // console.log('PageNumber ', JSON.stringify( result.get('PageNumber'),null, 2));

            })
            .catch(err => {
                reject(err);
            })
        ;
    });

}

/**
 *
 * @param request typeof EbayApiRequest
 * @returns {Promise<any>}
 */
function processCall(request) {
    return new Promise(async (resolve, reject) => {
            try {
                request.markRequestSend();
                const resultXml = await sendRequest(request);
                // console.log('Result XML', resultXml);
                if (!resultXml) {
                    return reject(Error('Empty response'));
                }
                const result = await convertXmlResultBody(resultXml);
                // console.log(result);
                const xmlRoot = request.apiCallName() + 'Response';
                const resultObj = new EbayApiResponse(result[xmlRoot] ? result[xmlRoot] : result);

                // Check For API Over use Error -> Anfragen werden gedrosselt
                // Hier eine verzögerung einbauen bevor der nächste Call ausgeführt wird

                resolve(resultObj);
            } catch (e) {
                // console.error('ERROR', e);
                return reject(e);
            }
        }
    );
}


/**
 * call eBay Trading API
 * @param request typeof EbayApiRequest
 * @returns {Promise<any>}
 */
function sendRequest(request) {

    const httpsOptions = {
        host: 'api.ebay.com',
        path: '/ws/api.dll',
        port: 443,
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml',
            'X-EBAY-API-COMPATIBILITY-LEVEL': request.compatLevel() ? request.compatLevel() : defaultCompatLevel,
            'X-EBAY-API-CALL-NAME': request.apiCallName(),
            'X-EBAY-API-SITEID': request.siteId(),
            'X-EBAY-API-APP-NAME': appKeySet.appId,
            'X-EBAY-API-DEV-NAME': appKeySet.devId,
            'X-EBAY-API-CERT-NAME': appKeySet.certId,
            // 'X-EBAY-API-DETAIL-LEVEL': 0
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(httpsOptions, function (res) {
            res.setEncoding('utf8');
            let result = '';
            res.on('data', c => {
                result += c;
            });
            res.on('end', () => {
                // console.log('rawResult:', result);
                resolve(result);
            });
        });
        req.on('error', e => {
            // console.log('problem with request: ' + e.message);
            reject(e);
        });
        req.write(createXmlRequestBody(request));
        req.end();
    });
}

/**
 *
 * @param request typeof EbayApiRequest
 * @returns {string}
 */
function createXmlRequestBody(request) {
    const xmlRootTag = request.apiCallName() + 'Request';
    const data = {
        RequesterCredentials: {
            eBayAuthToken: request.authToken()
        },
        ...request.body(),
    };
    // console.log('createXmlRequestBody() data:', JSON.stringify(data,null, 2));
    const xml = js2xmlparser.parse(xmlRootTag, data, {
        declaration: {
            encoding: 'UTF-8'
        }
    });
    // console.log('createXmlRequestBody() xml:',xml);
    return xml.replace(
        '<' + xmlRootTag + '>',
        '<' + xmlRootTag + ' xmlns="urn:ebay:apis:eBLBaseComponents">'
    );
}


/**
 *
 * @param xmlString
 * @returns {Promise<*>}
 */
async function convertXmlResultBody(xmlString) {
    return new Promise((resolve, reject) => {
        xml2jsPareseString(
            xmlString,
            {
                attrkey: '@',
                charkey: '#text',
                explicitArray: false
            },
            (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result);
            }
        )
    });
}

/**
 *
 * @returns queue typeof Queue
 */
function getQueue() {
    if (queue === null) {
        initQueue();
    }

    return queue;
}

// TODO: Move classes to external files?

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
        if (this.data.Ack) {
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
        // TODO: add more key for getting elements from deeper structure
        return key === false ? this.data : this.data[key];
    }

    /**
     *
     * @param key
     * @returns {Array}
     */
    getArray(key = false) {
        // TODO: add more key for getting elements from deeper structure
        if (!Array.isArray(this.get(key))) {
            return [this.get(key)];
        } else if (this.get(key)) {
            return this.get(key);
        }

        return [];
    }
}

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

