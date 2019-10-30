var assert = require('chai').assert;
const functs = require('../../routes');

describe('Validates app responses', () => {
    it('should return an error if searchTerm is not provided', () => {
        const response = functs.validParams({});
        assert.deepEqual(response, { valid: false, msg: 'missing param: searchTerm' });
    });

    it('should return an error if any of the coordinates is not in params', () => {
        const response = functs.validParams({ searchTerm: 'jugos', lng: '19.002' });
        assert.deepEqual(response, { valid: false, msg: 'malformed coordinates' });
    });

    it('should return a valid reponse with searchTerm', () => {
        const response = functs.validParams({ searchTerm: 'jugos'});
        assert.deepEqual(response, { valid: true });
    });

    it('should return a valid reponse with searchTerm and coordinates', () => {
        const response = functs.validParams({ searchTerm: 'jugos', lng: '19.002', lat: '234.3434'});
        assert.deepEqual(response, { valid: true });
    });

    it('should return an error if no searchTerm is provided and coordinates are not', () => {
        const response = functs.validParams({ lng: '19.002', lat: '234.3434'});
        assert.deepEqual(response, { valid: false, "msg": "missing param: searchTerm" });
    });
});