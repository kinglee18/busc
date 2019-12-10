const client = require('../elastic/client');


exports.search = async function (address) {
    let requestBody = {
        index: process.env.locations,
        body: {
            "size": 1,
            "query": {
                "boosting": {
                  "negative_boost": 0.2,
                  "negative": {
                    "exists": {
                      "field": "colony"
                    }
                  },
                  "positive": {
                    "bool": {
                      "should": [
                        {
                          "multi_match": {
                            "query": address,
                            "fields": [
                              "state.spanish^8",
                              "city.spanish",
                              "colony.spanish",
                              "colony",
                              "zc",
                              "statename.keyword"
                            ],
                            "type": "cross_fields"
                          }
                        }
                      ]
                    }
                  }
                }
              }
        }
    };
    const request = await client.getClient().search(requestBody);
    if (request.hits.hits.length){
        return {
            "physicalstate": request.hits.hits[0]._source.statename,
            "physicalcity": request.hits.hits[0]._source.city,
            "postalCode": request.hits.hits[0]._source.zc || request.hits.hits[0]._source.zip,
            "colony": request.hits.hits[0]._source.colony,
            "initials": request.hits.hits[0]._source.initials || request.hits.hits[0]._source.state
        };
    }
    return
}