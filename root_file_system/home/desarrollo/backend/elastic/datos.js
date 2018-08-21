'use strict'

const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
    host: '10.34.180.126:9200'
});

exports.validar = function(id) {
    return client.search({
        "index": "mex_negocios",
		"body": {
		    "query": {
                "match_phrase": {
                    "listadoid": id
                }
            }
		}
    });
}