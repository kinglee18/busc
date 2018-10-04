'use strict'
const config = require('../config');
const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
    host: config.ip
});


exports.query_claro_shop_prod = function(tx,marcas) {
    let busq = [];
    busq.push({
        "match": {
            "relacion": tx
        }
    })

    if(marcas.length > 0) {
        let nv = '';
        for(let i in marcas) {
            if(i == 0) {
                nv += '('+marcas[i]+')';
            }
            else {
                nv += ' OR ('+marcas[i]+')';
            }
        }

        busq.push({
            "query_string" : {
                "default_field" : "valor",
                "query" : nv
            }
        })
    }


    let query = {
        "bool": {
            "should": busq,
            "filter": [ 
                {
                    "term": {
                        "fuente": "claro_shop"
                    }
                }
            ]
        }
        
    }
    //console.log('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%');
    //console.log(JSON.stringify(query));

    return client.search({
        "index": config.taxonomias,
        "type": "default",
        "body": {
            "size":30,
            "query": query
        }
    });
}

exports.query_claro_shop_marca = function(tx) {
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
                        "fuente": "claro_shop"
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

exports.query_claro_shop_esp = function(tx,marcas) {

    //console.log(JSON.stringify(query));

    return client.search({
        "index": config.claro_shop,
		"body": {
			"size":5,
		    "query" : {
				"bool": {
                    "should": [
                        {
                            "match": {
                                "title": tx
                            }
                        }, {
                            "match": {
                                "description": tx
                            }
                        }
                    ]
                }
			}
		}
    });
}

/*exports.run(tx,marcas,ctg,bn) {
    if(marcas.length > 0 || ctg.length > 0 || bn.length > 0) {
        let query = {
            
        }
    }
}*/