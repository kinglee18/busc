
var assert = require('chai').assert
const maps = require('../../services/maps');


describe('Google maps functionality', function () {

    it('should return physicalstate name depending on physicalcity in object', function (done) {
        const addresses = [
            { input: 'coyoacan', physicalstate: 'DISTRITO FEDERAL', physicalcity: 'COYOACAN' },
            { input: 'GUSTAVO A MADERO', physicalstate: 'DISTRITO FEDERAL', physicalcity: 'GUSTAVO A MADERO' },
            { input: 'nezahualcoyotl', physicalstate: 'MEXICO', physicalcity: 'NEZAHUALCOYOTL' },
            { input: 'oaxtepec', physicalstate: 'MORELOS', physicalcity: 'OAXTEPEC' },
            { input: 'cuernavaca', physicalstate: 'MORELOS', physicalcity: 'CUERNAVACA' },
            { input: '04400', physicalstate: 'DISTRITO FEDERAL', physicalcity: 'COYOACAN' }


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