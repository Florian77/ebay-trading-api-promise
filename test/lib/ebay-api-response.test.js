const EbayApiResponse = require('../../lib/ebay-api-response');

const chai = require('chai');
const expect = chai.expect;
//const should = chai.should();
const rawData = {
    ack: 'Success',
    data: {
        a: 'a',
        b: {
            x: 1
        },
    },
    c: ['c']
};
const response = new EbayApiResponse(rawData);

describe('class EbayApiResponse', function () {

    it('get(false)', function () {
        const r = response.get(false);
        expect(r).to.deep.equal(rawData);
    });

    it('get("ack")', function () {
        const r = response.get('ack');
        expect(r).to.equal('Success');
    });

    it('get(["data"])', function () {
        const r = response.get(["data"]);
        expect(r).to.deep.equal(rawData.data);
    });

    it('get(["data", "a"])', function () {
        const r = response.get(["data","a"]);
        expect(r).to.equal(rawData.data.a);
    });

    it('get("notExists")', function () {
        const r = response.get("notExists");
        expect(r).to.be.undefined;
    });


    it('getArray("ack")', function () {
        const r = response.getArray('ack');
        expect(r).to.have.deep.members(['Success']);
    });

    it('getArray("c")', function () {
        const r = response.getArray('c');
        expect(r).to.have.deep.members(rawData.c);
    });

    it('getPath(["data", "a"])', function () {
        const r = response.getPath(["data", "a"]);
        expect(r).to.equal(rawData.data.a);
    });

    it('getPath("data.a")', function () {
        const r = response.getPath("data.a");
        expect(r).to.equal(rawData.data.a);
    });

    it('getPathArray(["data", "a"])', function () {
        const r = response.getPathArray(["data", "a"]);
        expect(r).to.have.deep.members([rawData.data.a]);
    });

    it('exist("ack")', function () {
        const r = response.exist("ack");
        expect(r).to.be.true;
    });

    it('exist("notExists")', function () {
        const r = response.exist("notExists");
        expect(r).to.be.false;
    });

});