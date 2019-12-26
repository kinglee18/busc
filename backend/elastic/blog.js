'use strict'
const client = require('./client');

/**
 * 
 */
exports.searchRelatedArticles = function (searchTerm, page = 0, pageSize = 10, category) {
    let must = [];
    if (category) {
        must = must.concat([{
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
        "function_score": {
            "query": {
                "bool": {
                    filter: category ? [{
                        "range": {
                          "date": {
                            "gt": "now-3M/M",
                            "lte": "now/M"
                          }
                        }
                      }] : [],
                    must,
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
            },
            "functions": [
                {
                    "random_score": {}
                }
            ]
        }
    };
    console.log(JSON.stringify(query));

    return client.getClient().search({
        "index": process.env.blog,
        "body": {
            "from": pageSize * page,
            "size": pageSize,
            query
        }
    });
}