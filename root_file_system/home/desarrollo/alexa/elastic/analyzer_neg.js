'use strict'
const config = require('../config');
const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
    host: config.ip
});


exports.query_neg_ctg = function(tx) {
    let query = {
        "bool": {
            "must": [
                {
                    "match": {
                        "valor": tx
                    }
                }
            ],
            "filter": [ 
                {
                    "term": {
                        "fuente": "negocios"
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
            "size":5,
            "query": query
        }
    });
}

exports.query_neg_pys = function(tx) {
    let query = {
        "bool": {
            "should": [
                {
                    "match": {
                        "relacion": tx
                    }
                }
            ],
            "filter": [ 
                {
                    "term": {
                        "fuente": "negocios"
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

exports.query_neg_bn = function(tx) {
    

    return client.search({
        "index": config.negocios,
		"body": {
			"size":3,
		    "query" : {
				"match": {
					"bn": tx
				}
			}
		}
    });
}





