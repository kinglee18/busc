const client = require('../elastic/client');


exports.search = async function (address) {
  let requestBody = {
    index: process.env.locations,
    body: {
      "size": 1,
      "query": {
        "boosting": {
          "negative_boost": 0.4,
          "negative": {
            "bool": {
              "should": [
                {
                  "exists": { "field": "zip" }
                },
                {
                  "exists": { "field": "postal_code" }
                }
              ]
            }
          },
          "positive": {
            "bool": {
              "should": [
                {
                  "multi_match": {
                    "query": address,
                    "fields": [
                      "city^2",
                      "city.spanish",
                      "colony.spanish",
                      "colony",
                      "zc",
                      "state.spanish^8",
                      "statename^3",
                      "statename.keyword"
                    ],
                    "operator": "and"
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
  if (request.hits.hits.length) {
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