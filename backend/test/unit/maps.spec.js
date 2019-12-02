
var assert = require('chai').assert
const maps = require('../../services/maps');


describe('Google maps functionality', function () {

    it('should return physicalstate name depending on physicalcity in object', function (done) {
        const addresses = [
            { input: 'coyoacan', physicalstate: 'distrito federal', physicalcity: 'coyoacan' },
            { input: 'gam', physicalstate: 'distrito federal', physicalcity: 'gustavo a. madero' },
            { input: 'neza', physicalstate: 'mexico', physicalcity: 'ciudad nezahualcoyotl' },
            { input: 'oaxtepec', physicalstate: 'morelos', physicalcity: 'oaxtepec' },
            { input: 'cuernavaca', physicalstate: 'morelos', physicalcity: 'cuernavaca' }

        ];
        for (let address of addresses) {
            maps.search(address.input).then(result => {
                assert.equal(result.physicalcity, address.physicalcity, 'failed in ' + JSON.stringify(result) + ' ' + JSON.stringify(address));
                assert.equal(result.physicalstate, address.physicalstate, 'failed in ' + JSON.stringify(result) + ' ' + JSON.stringify(address));

            });
        }
        done();
    });

});