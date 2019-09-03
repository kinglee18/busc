'use strict'
const client = require('./client');

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

    return client.getClient().search({
        "index": process.env.taxonomias,
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

    return client.getClient().search({
        "index": process.env.taxonomias,
        "type": "default",
        "body": {
            "size":3,
            "query": query
        }
    });
}

exports.query_neg_bn = function(tx) {
    

    return client.getClient().search({
        "index": process.env.negocios,
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





