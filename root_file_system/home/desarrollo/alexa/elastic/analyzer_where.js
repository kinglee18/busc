'use strict'
const config = require('../config');
const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
    host: config.ip
});


exports.query_wheres_state = function(tx) {
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
            "size":3,
            "query": query
        }
    });
}

exports.query_wheres_city = function(tx,estado) {
    
    
    let busq = [];
    busq.push({
        "match": {
            "valor": tx
        }
    })

    if(estado && estado.length > 0) {
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
            "size":3,
            "query": query
        }
    });
}

exports.query_wheres_colony = function(tx,estado) {

    let busq = [];
    let max = 10;
    busq.push({
        "match": {
            "relacion": tx
        }
    })

    if(estado && estado.length > 0) {
        
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
            "size":max,
            "query": query
        }
    });
}



