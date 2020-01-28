const axios = require('axios');
var assert = require('chai').assert;
var expect = require('chai').expect;
const config = require('../../config');

describe('Elasticsearch analyzers testing', () => {
    //only dev user has permissions
    before(() => {
        process.env = Object.assign(process.env, config['dev']);
        process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
    });

    it("It should filter with stemming, lowercase, unicode and synonyms", (done) => {
        axios.get(process.env.ip + '/mexobjectsdefinition/_analyze', {
            auth: {
                password: process.env.elasticAuth.substring(process.env.elasticAuth.indexOf(':') + 1),
                username: process.env.elasticAuth.substring(-0, process.env.elasticAuth.indexOf(':'))
            },
            data: {
                text: "Hotelés",
                "analyzer": "spanish_analyzer"
            }
        }).then(
            data => {
                expect(["hotel", "aloj", "hospedaj", "ospedaj", "otel", "hoteles"])
                    .to.have.members(data.data.tokens.map(a => { return a.token }));
                done();
            });
    });

});



