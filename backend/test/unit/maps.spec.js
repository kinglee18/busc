var assert = require('assert');
const maps = require('../../maps/address');


describe('Google maps functionality', function () {
    it('should return mexico value on every case of search', function (done) {
        const mexicoCityOpts = ['ciudad de mexico', 'cdmx', 'mexico', 'distrito federal', 'df'];
        for (let abbreviation of mexicoCityOpts) {
            maps.search('mexico').then(address => {
                assert.equal(address.state, 'df', 'failed in ' + abbreviation + JSON.stringify(address));
            });
        }
        done();
    });
    it('should return state name depending on city in object', function (done) {
        const addresses = [
            { input: 'coyoacan', state: 'df' , city: 'coyoacan'},
            { input: 'gam', state: 'df', city: 'gustavo a. madero' },
            { input: 'neza', state: 'mex', city: 'ciudad nezahualcoyotl' },
            { input: 'oaxtepec', state: 'mor', city: 'oaxtepec' },
            { input: 'cuernavaca', state: 'mor', city: 'cuernavaca' }

        ];
        for (let address of addresses) {
            maps.search(address.input).then(result => {
                assert.equal(result.city, address.city, 'failed in ' + JSON.stringify(result) + ' ' + JSON.stringify(address));
                assert.equal(result.state, address.state, 'failed in ' + JSON.stringify(result) + ' ' + JSON.stringify(address));

            });
        }
        done();
    });
});