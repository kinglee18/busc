'use strict'

const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
    host: '172.18.1.96:9200'
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
        "index": "taxonomias_globales",
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
        "index": "taxonomias_globales",
        "type": "default",
        "body": {
            "size":3,
            "query": query
        }
    });
}

exports.query_neg_bn = function(tx) {
    

    return client.search({
        "index": "negocios_secam",
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





