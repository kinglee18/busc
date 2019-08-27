'use strict'
const client = require('./client');

exports.validar = function(id) {
    return client.getClient().search({
        "index": process.env.negocios,
		"body": {
		    "query": {
                "match_phrase": {
                    "listadoid": id
                }
            }
		}
    });
}