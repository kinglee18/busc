var assert = require('chai').assert;
const functs = require('../../elastic/run');


describe('Body for elasticsearch queries', function () {

    it('should not return nothing', () => {
        const filter = functs.getAddressFilter(undefined, undefined);
        assert.isEmpty(filter)
    });
    it('should return an array with geo distance query', () => {
        const filter = functs.getAddressFilter(undefined, { lat: 19.3014959, lng: -99.1788312 });
        assert.deepNestedInclude(filter[0], {
            "geo_distance": {
                "distance": "5km",
                "pin": [-99.1788312, 19.3014959]
            }
        });
    });
});