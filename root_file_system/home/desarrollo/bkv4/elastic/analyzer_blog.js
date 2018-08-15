'use strict'

const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
    host: '10.34.180.126:9200'
});


exports.query_blog_all = function(tx) {
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
                        "fuente": "blog"
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
            "size":3,
            "query": query
        }
    });
}


/*exports.run = function(tx,tags,ctg) {
    let busq = [];
    busq.push({
        "match": {
            "title": tx
        }
    })
    busq.push({
        "match": {
            "excerpt": tx
        }
    })

    if(tags.length > 0) {
        let nv = '';
        for(let i in tags) {
            busq.push({
                "match": {
                  "tags.slug": tags[i]
                }
            })
        }

    }

    for(let i in ctg) {
        busq.push({
            "match": {
              "categories.slug": ctg[i]
            }
        })
    }

    
    let query = {
        "bool": {
            "should": busq
        }
    }

    console.log(JSON.stringify(query));

    return client.search({
        "index": "blog_rep",
		"body": {
			"size":10,
            "query" : query
        }
    });
}*/