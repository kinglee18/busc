const client = require('../elastic/client');


exports.search = async function (address, text) {
  let body = {};
  if (address) {
    body = {
      "sort": [

        "_score",
        {
          "relevance": {
            "order": "desc"
          }
        }
      ],
      "size": 1,
      "query": {
        "boosting": {
          "negative_boost": 0.3,
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
                  "bool": {
                    "should": [
                      {
                        "match": {
                             "statename": "DISTRITO FEDERAL"
                        }
                      }
                    ], 
                    "must": [
                      {
                        "match": {
                          "colony.spanish": {
                            "query": address,
                            "operator": "and"
                          }
                        }
                      }
                    ],
                    "filter": [
                      {
                        "bool": {
                          "should": [
                            {
                              "match": {
                                "statename": "DISTRITO FEDERAL"
                              }
                            },
                            {
                              "match": {
                                "city": "MONTERREY"
                              }
                            },
                            {
                              "match": {
                                "city": "GUADALAJARA"
                              }
                            }
                          ]
                        }
                      }
                    ]
                  }
                },
                {
                  "multi_match": {
                    "query": address,
                    "fields": [
                      "city.spanish",
                      "zc",
                      "state.spanish^8",
                      "statename^3",
                      "statename.keyword",
                      "statename.spanish"
                    ],
                    "_name": "eee",
                    "type": "phrase",
                    "operator": "and"
                  }
                },
                {
                  "multi_match": {
                    "query": address,
                    "fields": [
                      "statename",
                      "state",
                      "city",
                      "initials",
                      "statename"
                    ],
                    "analyzer": "spanish_analyzer",
                    "type": "cross_fields",
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
      "sort": [
        "_score",
        {
          "relevance": {
            "order": "desc"
          }
        }
      ],
      "size": 1,
      "query": {
        "bool": {
          "should": [
            {
              "multi_match": {
                "query": text,
                "fields": [
                  "zc",
                  "state.spanish^8",
                  "statename^3",
                  "statename.keyword"
                ],
                "minimum_should_match": "90%"
              }
            },
            {
              "bool": {
                "must": [
                  {
                    "match": {
                      "statename": text
                    }
                  },
                  {
                    "match": {
                      "city": text
                    }
                  }
                ],
                "filter": [
                  {
                    "script": {
                      "script": {
                        "source": "if (doc['city.keyword'].size() > 0 ){doc['city.keyword'].value !=  doc['statename.keyword'].value}"
                      }
                    }
                  },
                  {
                    bool: {
                      "must_not": [
                        {
                          "exists": {
                            "field": "postal_code"
                          }
                        },
                        {
                          "exists": {
                            "field": "zc"
                          }
                        }
                      ]
                    }
                  }
                ]
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
  //console.log(JSON.stringify(requestBody));
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