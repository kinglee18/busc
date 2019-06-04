'use strict'
const config = require('../config');
const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
    host: config.ip
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





function pakmail() {
    return {
        "index": "sucursales_pakmail",
        "type": "default",
        "body": {
            "size": 150,
            "from": 0,
            "query": {
                "match_all": {}
            }
        }
    };
}


function pakmailByText(search) {
    return {
        "index": "sucursales_pakmail",
        "type": "default",
        "body": {
            "size": 150,
            "from": 0,
            "query": {
                "bool": {
                    "should": [
                        { "match": { "name": search } },

                        { "match": { "address": search } }
                    ]
                }
            }

        }
    };
}

function pakmailCoords(lon, lat) {
    return {
        "index": "sucursales_pakmail",
        "type": "default",
        "body": {
            "size": 150,
            "from": 0,
            "query": {
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
            "sort": [
                {
                    "_geo_distance": {
                        "coordinates": [lon, lat],
                        "order": "asc",
                        "unit": "km",
                        "distance_type": "plane"
                    }
                }
            ]
        }
    }
}
exports.getPakmail = function () {
    return client.search(pakmail());
}

exports.getPakmailCoordinates = function (lon, lat) {
    return client.search(pakmailCoords(lon, lat));
}

exports.getPakmailByText = function (text) {
    return client.search(pakmailByText(text));
}

