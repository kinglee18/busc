'use strict'
const config = require('../config');
const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
    host: config.ip
});

exports.validar = function(id) {
    return client.search({
        "index": config.negocios,
		"body": {
		    "query": {
                "match_phrase": {
                    "listadoid": id
                }
            }
		}
    });
}