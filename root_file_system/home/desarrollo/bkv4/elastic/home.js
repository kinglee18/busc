const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
    host: '10.34.180.126:9200'
});

function adn() {
	return {
            "index": "scrapping",
            "type": "default",
            "body": {
                "size":1,
                "query": {
                    "match_all":{}
                },
                "sort":
                {
                    "date":"desc"
                }
			}

        };        
}

function blog() {
	return {
            "index": "blog_rep",
            "type": "default",
            "body": {
                "size":1,
                "query": {
                    "match_all":{}
                },
                "sort":
                {
                    "date":"desc"
                }
			}

        };        
}

function claro() {
	return {
            "index": "claro_shop",
            "type": "default",
            "body": {
                "size":3,
                "query": {
                    "match_all":{}
                },
                "sort":
                {
                    "date":"desc"
                }
			}

        };        
}

function neg() {
	return {
            "index": "mexmainsystem_dev_rep",
            "type": "default",
            "body": {
                "size":1,
                "query": {
                    "match_all":{}
                }
			}


        };        
}

exports.inicio = function() {
    
    
    let promesa = new Promise((resolve,reject) => {

        Promise.all([
            client.search(neg()),
            client.search(blog())
        ]).then((resp) => {
            let blog = resp[1].hits.hits;
            let neg = resp[0].hits.hits;
            let arrBlog = [];
            let arrNeg = [];
            for(let op of blog) arrBlog.push(op._source);
            for(let op of neg) arrNeg.push(op._source);
            resolve({
                blog: arrBlog,
                neg: arrNeg
            })
        })

    });

    return promesa;

}



