var assert = require('chai').assert;
const functs = require('../../elastic/run');


describe('Body for elasticsearch queries', function () {
    it('should return an object containing only state field', () => {
        const address = {
            'state': 'df'
        };
        const filter = functs.getAddressFilter(address);
        assert.isArray(filter);
        assert(
            filter[0]['match_phrase']['Appearances.Appearance.state.keyword']
            ['query'], address.state
        );
    });
    it('should return an object containing only city and state fields', () => {
        const address = {
            'state': 'df',
            'city': 'xochimilco'
        };
        const filter = functs.getAddressFilter(address);
        assert(Array.isArray(filter));
        assert.deepNestedInclude(filter[0], {
            "match": {
                "Appearances.Appearance.city.spanish": {
                    "query": 'xochimilco'
                }
            }
        });
        assert.deepNestedInclude(
            filter[1], {
            "match_phrase": {
                "Appearances.Appearance.state.keyword": {
                    "query": "df"
                }
            }
        }
        );
    });

    it('should return an object containing only city , state and colny fields', () => {
        const address = {
            'state': 'df',
            'city': 'xochimilco',
            'colony': 'alguna'
        };
        const filter = functs.getAddressFilter(address);
        assert(Array.isArray(filter));
        assert.deepNestedInclude(filter[0], {
            "match_phrase": {
                "colony.spanish": {
                    "query": 'alguna'
                }
            }
        });
        assert.deepNestedInclude(filter[1], {
            "match": {
                "Appearances.Appearance.city.spanish": {
                    "query": 'xochimilco'
                }
            }
        });
        assert.deepNestedInclude(
            filter[2], {
            "match_phrase": {
                "Appearances.Appearance.state.keyword": {
                    "query": "df"
                }
            }
        }
        );
    });
    it('should not return nothing', () => {
        const filter = functs.getAddressFilter(undefined, undefined);
        assert.isUndefined(filter)
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