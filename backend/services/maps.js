const client = require('../elastic/client');


exports.search = async function (address, text) {
  let body = {};
  if (address){ 
    body = {
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
                      "city.spanish",
                      "colony.spanish",
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
  } else {
    body = {
      "size": 1,
      "query": {
        "bool": {
          "should": [
            {
              "multi_match": {
                "query": text,
                "fields": [
                  "city^2",
                  "city.spanish",
                  "zc",
                  "colony.spanish",
                  "colony",
                  "state.spanish^8",
                  "statename^3",
                  "statename.keyword"
                ], 
                "minimum_should_match": "90%"
              }
            }
          ]
        }
      }
    }
  }
  
  const requestBody = {
    index: process.env.locations,
    body
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