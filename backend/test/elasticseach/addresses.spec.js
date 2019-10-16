
var assert = require('chai').assert
const client = require('../../elastic/client');
const abbreviatedStates = require('../../info/syn_where');
const config = require('../../config');

describe('Elasticsearch tests', function () {
    before(() => {
        process.env = Object.assign(process.env, config['test']);
    });

    it('should match all the abbreviations', function (done) {
        let requestArray = [];
        for (let abrv of abbreviatedStates.data) {
            let requestBody = {
                body: {
                    query: {
                        bool: {
                            should: [
                                {
                                    "match_all": {

                                    }
                                }
                            ],
                            filter: [
                                {
                                    "match": {
                                        "Appearances.Appearance.state.keyword": {
                                            "query": abrv.simb
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
                ,
                index: process.env.negocios
            }
            requestArray.push(client.getClient().search(requestBody));
        }
        Promise.all(requestArray).then(responses => {
            responses.forEach((response, index) => {
                assert.isNotEmpty(response.hits.hits, "no contiene en " + abbreviatedStates.data[index].valor);
            });
            done();
        })
    });
});