'use strict'

const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
    host: '172.18.1.96:9200'
});

exports.validar = function(id) {
    return client.search({
        "index": "negocios_secam",
		"body": {
		    "query": {
                "match_phrase": {
                    "listadoid": id
                }
            }
		}
    });
}