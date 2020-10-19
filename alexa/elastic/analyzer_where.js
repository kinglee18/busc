'use strict'
const config = require('../config');
const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
    host: config.ip,
    httpAuth: config.elasticAuth
});


exports.query_wheres_state = function (tx) {
    let query = {
        "bool": {
            "should": [
                {
                    "match": {
                        "valor": tx
                    }
                }
            ],
            "filter": [
                {
                    "term": {
                        "fuente": "lugares_city"
                    }
                }
            ]
        }

    }



    return client.search({
        "index": config.taxonomias,
        "type": "default",
        "body": {
            "size": 3,
            "query": query
        }
    });
}

exports.query_wheres_city = function (tx, estado) {


    let busq = [];
    busq.push({
        "match": {
            "valor": tx
        }
    })

    if (estado && estado.length > 0) {
        busq.push({
            "match_phrase": {
                "tipo": estado
            }
        });
    }


    let query = {
        "bool": {
            "should": busq,
            "filter": [
                {
                    "term": {
                        "fuente": "lugares_colony"
                    }
                }
            ]
        }

    }

    //console.log(JSON.stringify(query));

    return client.search({
        "index": config.taxonomias,
        "type": "default",
        "body": {
            "size": 3,
            "query": query
        }
    });
}

exports.query_wheres_colony = function (tx, estado) {

    let busq = [];
    let max = 10;
    busq.push({
        "match": {
            "relacion": tx
        }
    })

    if (estado && estado.length > 0) {

        busq.push({
            "match_phrase": {
                "tipo": estado
            }
        });
        max = 20;
    }

    let query = {
        "bool": {
            "should": busq,
            "filter": [
                {
                    "term": {
                        "fuente": "lugares_colony"
                    }
                }
            ]
        }

    }

    //console.log(JSON.stringify(query));

    return client.search({
        "index": config.taxonomias,
        "type": "default",
        "body": {
            "size": max,
            "query": query
        }
    });
}


function pakmailStructure(query, sort) {
    return {
        "index": "sucursales_pakmail",
        "body": {
            "size": 150,
            "from": 0,
            query, sort
        }
    };
}

exports.getPakmail = function () {
    return client.search(pakmailStructure({
        "match_all": {}
    }, {
        "name.raw": {
            "order": "asc"
          }
    }));
}

exports.getPakmailCoordinates = function (lon, lat) {
    return client.search(pakmailStructure({
        "bool": {
            "should": [
                {
                    "match_all": {}
                }
            ],
            "filter": {
                "geo_distance": {
                    "distance": "5km",
                    "coordinates": [lon, lat]
                }
            }
        },

    },
        [
            {
                "_geo_distance": {
                    "coordinates": [lon, lat],
                    "order": "asc",
                    "unit": "km",
                    "distance_type": "plane"
                }
            }
        ]
    ));
}

exports.getPakmailByText = function (text) {
    return client.search(pakmailStructure({
        "bool": {
            "should": [
                {
                    "match": {
                        "name": {
                            "_name": "name",
                            "query": text,
                            "boost": 2
                      }
                    }
                },
                { "match": { "address": text } }
            ]
        }
    }));
}

exports.getPakmailByState = function (state) {
    return client.search(pakmailStructure(
        {
            "match_phrase": {
                "state": state
            }
        }
    ));
}



// ***** Gocha *****
exports.getGocha = function () {
    return client.search(gochaStructure({
        "match_all": {}
    }));
}
function gochaStructure(query, sort) {
    return {
        "index": "sucursales_gocha",
        "body": {
            "size": 150,
            "from": 0,
            query, sort
        }
    };
}

exports.getGochaCoordinates = function (lon, lat) {
    return client.search(gochaStructure({
        "bool": {
            "should": [
                {
                    "match_all": {}
                }
            ],
            "filter": {
                "geo_distance": {
                    "distance": "5km",
                    "coordinates": [lon, lat]
                }
            }
        },

    },
        [
            {
                "_geo_distance": {
                    "coordinates": [lon, lat],
                    "order": "asc",
                    "unit": "km",
                    "distance_type": "plane"
                }
            }
        ]
    ));
}

exports.getGochaByText = function (text) {
    return client.search(gochaStructure({
        "bool": {
            "should": [
                {
                    "match": {
                        "name": {
                            "_name": "name",
                            "query": text,
                            "boost": 2
                      }
                    }
                },
                { "match": { "address": text } }
            ]
        }
    }));
}

exports.getGochaByState = function (state) {
    return client.search(gochaStructure(
        {
            "match_phrase": {
                "state": state
            }
        }
    ));
}
