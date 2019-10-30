'use strict'
const client = require('./client');

/**
 * 
 */
exports.searchRelatedArticles = function (searchTerm, page = 0, pageSize = 10, category) {
    let filter = [];
    if (category) {
        filter = filter.concat([{
            "nested": {
                "path": "categories",
                "query": {
                    "match_phrase": {
                        "categories.slug": category
                    }
                }
            }
        }]);
    }
    const query = {
        "bool": {
            filter,
            "should": searchTerm ? [
                {
                    "multi_match": {
                        "query": searchTerm,
                        "fields": ["title", "excerpt", "tags.slug"]
                    }
                },
                {
                    "nested": {
                        "path": "categories",
                        "query": {
                            "match": {
                                "categories.slug": searchTerm
                            }
                        }
                    }
                }
            ] : []
        }
    };
    console.log(JSON.stringify(query));
    
    return client.getClient().search({
        "index": process.env.blog,
        "body": {
            "from": pageSize * page,
            "size": pageSize,
            "sort": [{ date: { order: "desc" } }],
            "query": query
        }
    });
}