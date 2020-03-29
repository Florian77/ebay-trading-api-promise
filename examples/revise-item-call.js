'use strict';

const ebayApi = require('../index');

ebayApi
    .initQueue(25)
    .setAppKeySet(require('./app-key-set-demo'))
    .setDefaultCompatLevel(1063)
    .setDefaultSiteId(77)
    .setDebugOutput(true)
;

console.time("TotalCallTime     -----------------> ");

let authToken = '...';

(async () => {
    try {

        const result = await ebayApi.execute(ebayApi
            .newRequest('ReviseItem')
            .authToken(authToken)
            .body({
                Item: {
                    ItemID: '1234567890123',
                    Title: 'NEW TITLE'
                }
            })
        );
        // console.log('Result', JSON.stringify(result, null, 2));

        console.log('ackSuccess():', result.ackSuccess());
        console.log('ackWarning():', result.ackWarning());
        console.log('ackFailure():', result.ackFailure());

        console.log('getErrors():', JSON.stringify(result.getErrors(), null, 2));

        // console.log(JSON.stringify(result.get('ItemArray'), null, 2));

        console.timeEnd("TotalCallTime     -----------------> ");

    } catch (e) {
        console.error('Call Faild:', e.message);
    }
})();

