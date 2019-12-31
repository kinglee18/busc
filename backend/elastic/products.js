'use strict'
const client = require('./client');

/**
 * 
 */
exports.searchRelatedProducts = function (searchTerm, page = 0, pageSize = 10) {

    const query = {
        "bool": {
            "should": [
                {
                    "multi_match": {
                        "query": searchTerm,
                        "fields": ["title"]
                    }
                }
            ]
        }
    };
    return client.getClient().search({
        "index": process.env.products,
        "body": {
            "from": pageSize * page,
            "size": pageSize,
            "sort": [{ date: { order: "desc" } }],
            "query": query
        }
    });
}